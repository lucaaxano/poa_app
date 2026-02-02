/**
 * AI Service Configuration
 */
export const AI_CONFIG = {
  // OpenAI Model - gpt-4o for best German language support
  model: 'gpt-4o',

  // Temperature for natural conversation
  temperature: 0.7,

  // Max tokens per response
  maxTokens: 1000,

  // OpenAI request timeout (safety net so calls don't hang forever)
  openaiTimeoutMs: 20000,

  // Rate limiting
  rateLimitPerMinute: 10,
  rateLimitWindowMs: 60 * 1000, // 1 minute
} as const;
