import { Controller, Get, Param, UseGuards, Request } from '@nestjs/common';
import { VehiclesService } from './vehicles.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('vehicles')
@UseGuards(JwtAuthGuard)
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Get()
  async findAll(@Request() req) {
    return this.vehiclesService.findByCompanyId(req.user.companyId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req) {
    return this.vehiclesService.findById(id, req.user.companyId);
  }
}
