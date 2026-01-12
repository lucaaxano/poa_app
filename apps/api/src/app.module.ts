import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CompaniesModule } from './companies/companies.module';
import { VehiclesModule } from './vehicles/vehicles.module';
import { ClaimsModule } from './claims/claims.module';
import { PoliciesModule } from './policies/policies.module';
import { InsurersModule } from './insurers/insurers.module';
import { StorageModule } from './storage/storage.module';
import { EmailModule } from './email/email.module';
import { BrokerModule } from './broker/broker.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AiModule } from './ai/ai.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env', '../../.env.local', '../../.env'],
    }),
    PrismaModule,
    StorageModule,
    EmailModule,
    AiModule,
    AuthModule,
    UsersModule,
    CompaniesModule,
    VehiclesModule,
    ClaimsModule,
    PoliciesModule,
    InsurersModule,
    BrokerModule,
    NotificationsModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
