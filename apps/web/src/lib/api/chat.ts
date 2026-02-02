import { apiClient } from './client';
import type { Claim } from '@poa/shared';

/**
 * Chat message interface
 */
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

/**
 * Extracted claim data from chat
 */
export interface ExtractedClaimData {
  vehicleId?: string;
  vehicleLicensePlate?: string;
  accidentDate?: string;
  accidentTime?: string;
  accidentLocation?: string;
  damageCategory?: string;
  damageSubcategory?: string;
  description?: string;
  policeInvolved?: boolean;
  policeFileNumber?: string;
  hasInjuries?: boolean;
  injuryDetails?: string;
  thirdPartyInfo?: {
    licensePlate?: string;
    ownerName?: string;
    ownerPhone?: string;
    insurerName?: string;
  };
  estimatedCost?: number;
}

/**
 * Chat response from API
 */
export interface ChatResponse {
  message: string;
  isComplete: boolean;
  extractedData?: Partial<ExtractedClaimData>;
  suggestedActions?: string[];
}

/**
 * Chat API functions
 */
export const chatApi = {
  /**
   * Send a chat message and get AI response
   */
  async sendMessage(messages: ChatMessage[]): Promise<ChatResponse> {
    const response = await apiClient.post<ChatResponse>(
      '/claims/chat',
      { messages },
      { timeout: 60000 },
    );
    return response.data;
  },

  /**
   * Complete the chat and create a claim
   */
  async completeClaim(
    messages: ChatMessage[],
    submitImmediately: boolean
  ): Promise<Claim> {
    const response = await apiClient.post<Claim>(
      '/claims/chat/complete',
      { messages, submitImmediately },
      { timeout: 60000 },
    );
    return response.data;
  },
};
