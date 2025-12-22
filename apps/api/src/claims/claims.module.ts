import { Module } from '@nestjs/common';
import { ClaimsService } from './claims.service';
import { ClaimsExportService } from './claims-export.service';
import { ClaimsController } from './claims.controller';
import { BrokerModule } from '../broker/broker.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [BrokerModule, NotificationsModule, UsersModule],
  controllers: [ClaimsController],
  providers: [ClaimsService, ClaimsExportService],
  exports: [ClaimsService, ClaimsExportService],
})
export class ClaimsModule {}
