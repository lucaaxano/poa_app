import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { AI_CONFIG } from './ai.config';
import {
  ChatMessageDto,
  ChatRole,
  ChatResponseDto,
  ExtractedClaimDataDto,
} from './dto';
import { ClaimDataValidationResult } from './dto/chat-complete.dto';
import {
  buildClaimSystemPrompt,
  VehicleContext,
  buildExtractionSystemPrompt,
} from './prompts/claim-system-prompt';
import { DamageCategory } from '@poa/database';

/**
 * Rate limit entry for tracking user requests
 */
interface RateLimitEntry {
  count: number;
  windowStart: number;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly openai: OpenAI;
  private readonly rateLimiter: Map<string, RateLimitEntry> = new Map();

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');

    if (!apiKey) {
      this.logger.warn(
        'OPENAI_API_KEY not configured. AI features will not work.',
      );
    }

    this.openai = new OpenAI({
      apiKey: apiKey || 'not-configured',
      timeout: AI_CONFIG.openaiTimeoutMs,
    });
  }

  /**
   * Check if a user is within rate limits
   */
  private checkRateLimit(userId: string): boolean {
    const now = Date.now();
    const entry = this.rateLimiter.get(userId);

    if (!entry || now - entry.windowStart > AI_CONFIG.rateLimitWindowMs) {
      // Start new window
      this.rateLimiter.set(userId, { count: 1, windowStart: now });
      return true;
    }

    if (entry.count >= AI_CONFIG.rateLimitPerMinute) {
      return false;
    }

    entry.count++;
    return true;
  }

  /**
   * Get remaining requests for a user
   */
  getRemainingRequests(userId: string): number {
    const entry = this.rateLimiter.get(userId);
    const now = Date.now();

    if (!entry || now - entry.windowStart > AI_CONFIG.rateLimitWindowMs) {
      return AI_CONFIG.rateLimitPerMinute;
    }

    return Math.max(0, AI_CONFIG.rateLimitPerMinute - entry.count);
  }

  /**
   * Main chat method - processes a conversation and returns AI response
   */
  async chat(
    messages: ChatMessageDto[],
    vehicles: VehicleContext[],
    userId: string,
  ): Promise<ChatResponseDto> {
    // Check rate limit
    if (!this.checkRateLimit(userId)) {
      throw new BadRequestException(
        'Zu viele Anfragen. Bitte warten Sie einen Moment und versuchen Sie es erneut.',
      );
    }

    // Check if OpenAI is configured
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!apiKey || apiKey === 'not-configured') {
      throw new BadRequestException(
        'Der KI-Service ist nicht konfiguriert. Bitte kontaktieren Sie den Administrator.',
      );
    }

    try {
      // Build system prompt with vehicle context
      const systemPrompt = buildClaimSystemPrompt(vehicles);

      // Prepare messages for OpenAI
      const openaiMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] =
        [
          { role: 'system', content: systemPrompt },
          ...messages.map((m) => ({
            role: m.role as 'user' | 'assistant' | 'system',
            content: m.content,
          })),
        ];

      // Call OpenAI API
      const completion = await this.openai.chat.completions.create({
        model: AI_CONFIG.model,
        messages: openaiMessages,
        max_tokens: AI_CONFIG.maxTokens,
        temperature: AI_CONFIG.temperature,
      });

      const responseMessage = completion.choices[0]?.message?.content || '';

      // Check if the conversation is complete (summary has been provided)
      const isComplete = this.checkIfComplete(responseMessage);

      // extractPartialData is NOT called here to avoid a second OpenAI round-trip
      // per message (was causing timeouts). Full extraction happens in extractClaimData().

      return {
        message: responseMessage,
        isComplete,
        extractedData: undefined,
        suggestedActions: isComplete
          ? ['Schaden melden', 'Korrektur vornehmen']
          : undefined,
      };
    } catch (error) {
      this.logger.error('OpenAI API error', error);

      if (error instanceof OpenAI.APIError) {
        if (error.status === 429) {
          throw new BadRequestException(
            'Der KI-Service ist momentan überlastet. Bitte versuchen Sie es in einigen Sekunden erneut.',
          );
        }
        if (error.status === 401) {
          throw new BadRequestException(
            'Der KI-Service ist nicht korrekt konfiguriert. Bitte kontaktieren Sie den Administrator.',
          );
        }
      }

      throw new BadRequestException(
        'Der KI-Service ist momentan nicht verfügbar. Bitte versuchen Sie es später erneut.',
      );
    }
  }

  /**
   * Check if the conversation has reached completion (summary provided)
   */
  private checkIfComplete(message: string): boolean {
    const completionIndicators = [
      'ZUSAMMENFASSUNG IHRER SCHADENMELDUNG',
      'Ist diese Zusammenfassung korrekt',
      'Klicken Sie jetzt auf',
      'Schaden melden',
    ];

    return completionIndicators.some((indicator) =>
      message.toUpperCase().includes(indicator.toUpperCase()),
    );
  }

  /**
   * Extract partial data from conversation for preview
   */
  private async extractPartialData(
    messages: ChatMessageDto[],
    vehicles: VehicleContext[],
  ): Promise<Partial<ExtractedClaimDataDto>> {
    // Only extract from user messages
    const conversationText = messages
      .map((m) => `${m.role}: ${m.content}`)
      .join('\n');

    const vehicleContext = vehicles
      .map((v) => `${v.licensePlate}: ${v.id}`)
      .join(', ');

    try {
      const completion = await this.openai.chat.completions.create({
        model: AI_CONFIG.model,
        messages: [
          {
            role: 'system',
            content: `${buildExtractionSystemPrompt()}\n\nVerfügbare Fahrzeuge (Kennzeichen: ID): ${vehicleContext}`,
          },
          { role: 'user', content: conversationText },
        ],
        max_tokens: 500,
        temperature: 0.1, // Low temperature for more consistent extraction
      });

      const responseText = completion.choices[0]?.message?.content || '{}';

      // Try to parse JSON from response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]) as Partial<ExtractedClaimDataDto>;
      }

      return {};
    } catch {
      return {};
    }
  }

  /**
   * Extract complete claim data from finished conversation
   */
  async extractClaimData(
    messages: ChatMessageDto[],
    vehicles: VehicleContext[],
  ): Promise<ExtractedClaimDataDto> {
    const conversationText = messages
      .map((m) => `${m.role}: ${m.content}`)
      .join('\n');

    const vehicleContext = vehicles
      .map((v) => `${v.licensePlate}: ${v.id}`)
      .join(', ');

    try {
      const completion = await this.openai.chat.completions.create({
        model: AI_CONFIG.model,
        messages: [
          {
            role: 'system',
            content: `${buildExtractionSystemPrompt()}\n\nVerfügbare Fahrzeuge (Kennzeichen: ID): ${vehicleContext}\n\nWICHTIG: Setze vehicleId auf die korrekte ID basierend auf dem erwähnte Kennzeichen.`,
          },
          { role: 'user', content: conversationText },
        ],
        max_tokens: 1000,
        temperature: 0.1,
      });

      const responseText = completion.choices[0]?.message?.content || '{}';

      // Try to parse JSON from response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new BadRequestException(
          'Konnte keine strukturierten Daten aus dem Gespräch extrahieren.',
        );
      }

      const extracted = JSON.parse(jsonMatch[0]) as ExtractedClaimDataDto;

      // Try to match vehicle by license plate if vehicleId is not set
      if (!extracted.vehicleId && extracted.vehicleLicensePlate) {
        const matchedVehicle = vehicles.find(
          (v) =>
            v.licensePlate.toLowerCase() ===
            extracted.vehicleLicensePlate?.toLowerCase(),
        );
        if (matchedVehicle) {
          extracted.vehicleId = matchedVehicle.id;
        }
      }

      return extracted;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error('Error extracting claim data', error);
      throw new BadRequestException(
        'Fehler beim Extrahieren der Schadendaten. Bitte versuchen Sie es erneut.',
      );
    }
  }

  /**
   * Validate extracted claim data for completeness
   */
  validateClaimData(data: ExtractedClaimDataDto): ClaimDataValidationResult {
    const missingFields: string[] = [];
    const warnings: string[] = [];

    // Required fields
    if (!data.vehicleId) {
      missingFields.push('Fahrzeug');
    }

    if (!data.accidentDate) {
      missingFields.push('Unfalldatum');
    }

    if (!data.damageCategory) {
      missingFields.push('Schadenart');
    }

    // Recommended fields (warnings only)
    if (!data.accidentLocation) {
      warnings.push('Unfallort nicht angegeben');
    }

    if (!data.description) {
      warnings.push('Keine Beschreibung des Unfallhergangs');
    }

    // Validate damage category enum
    if (
      data.damageCategory &&
      !Object.values(DamageCategory).includes(data.damageCategory)
    ) {
      missingFields.push(
        `Ungültige Schadenart: ${data.damageCategory}`,
      );
    }

    // Validate date format
    if (data.accidentDate && !/^\d{4}-\d{2}-\d{2}$/.test(data.accidentDate)) {
      missingFields.push('Ungültiges Datumsformat');
    }

    return {
      isValid: missingFields.length === 0,
      missingFields,
      warnings,
    };
  }
}
