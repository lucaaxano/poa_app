import { Module, Global } from '@nestjs/common';
import { AiService } from './ai.service';

/**
 * AI Module
 * Provides AI/OpenAI integration services globally
 */
@Global()
@Module({
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}
