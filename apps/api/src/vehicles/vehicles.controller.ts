import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { VehiclesService } from './vehicles.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
import { CreateVehicleDto, UpdateVehicleDto } from './dto/vehicle.dto';

@Controller('vehicles')
@UseGuards(JwtAuthGuard)
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Get()
  async findAll(@Request() req: AuthenticatedRequest) {
    return this.vehiclesService.findByCompanyId(req.user.companyId!);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('COMPANY_ADMIN', 'SUPERADMIN')
  async create(
    @Body() createVehicleDto: CreateVehicleDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.vehiclesService.create(req.user.companyId!, createVehicleDto);
  }

  // Specific routes MUST come before parameterized routes
  @Patch(':id/deactivate')
  @UseGuards(RolesGuard)
  @Roles('COMPANY_ADMIN', 'SUPERADMIN')
  async deactivate(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.vehiclesService.deactivate(id, req.user.companyId!);
  }

  @Patch(':id/activate')
  @UseGuards(RolesGuard)
  @Roles('COMPANY_ADMIN', 'SUPERADMIN')
  async activate(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.vehiclesService.activate(id, req.user.companyId!);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.vehiclesService.findById(id, req.user.companyId!);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('COMPANY_ADMIN', 'SUPERADMIN')
  async update(
    @Param('id') id: string,
    @Body() updateVehicleDto: UpdateVehicleDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.vehiclesService.update(id, req.user.companyId!, updateVehicleDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('COMPANY_ADMIN', 'SUPERADMIN')
  async delete(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    await this.vehiclesService.delete(id, req.user.companyId!);
    return { success: true };
  }
}
