import { Module } from '@nestjs/common';
import { VehiclesService } from './vehicles.service';
import { VehiclesImportService } from './vehicles-import.service';
import { VehiclesController } from './vehicles.controller';
import { BrokerModule } from '../broker/broker.module';

@Module({
  imports: [BrokerModule],
  controllers: [VehiclesController],
  providers: [VehiclesService, VehiclesImportService],
  exports: [VehiclesService],
})
export class VehiclesModule {}
