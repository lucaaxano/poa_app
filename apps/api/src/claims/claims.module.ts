import { Module } from '@nestjs/common';
import { ClaimsService } from './claims.service';
import { ClaimsExportService } from './claims-export.service';
import { ClaimsController } from './claims.controller';
import { BrokerModule } from '../broker/broker.module';

@Module({
  imports: [BrokerModule],
  controllers: [ClaimsController],
  providers: [ClaimsService, ClaimsExportService],
  exports: [ClaimsService, ClaimsExportService],
})
export class ClaimsModule {}
