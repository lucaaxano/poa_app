import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { VehiclesService } from './vehicles.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
import { CreateVehicleDto, UpdateVehicleDto } from './dto/vehicle.dto';
import { BrokerService } from '../broker/broker.service';
import { UserRole } from '@poa/database';

@Controller('vehicles')
@UseGuards(JwtAuthGuard)
export class VehiclesController {
  constructor(
    private readonly vehiclesService: VehiclesService,
    private readonly brokerService: BrokerService,
  ) {}

  @Get()
  async findAll(
    @Request() req: AuthenticatedRequest,
    @Query('companyId') companyId?: string,
  ) {
    const { companyId: userCompanyId, role, id: userId } = req.user;

    // For Broker: companyId is required from query params
    if (role === UserRole.BROKER) {
      if (!companyId) {
        throw new BadRequestException('companyId ist erforderlich fuer Broker');
      }
      // Check if broker has access to this company
      const hasAccess = await this.brokerService.hasBrokerAccessToCompany(userId, companyId);
      if (!hasAccess) {
        throw new ForbiddenException('Kein Zugriff auf diese Firma');
      }
      return this.vehiclesService.findByCompanyId(companyId);
    }

    // For other roles: use their company
    return this.vehiclesService.findByCompanyId(userCompanyId!);
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
  async findOne(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
    @Query('companyId') companyId?: string,
  ) {
    const { companyId: userCompanyId, role, id: userId } = req.user;

    // For Broker: companyId is required from query params
    if (role === UserRole.BROKER) {
      if (!companyId) {
        throw new BadRequestException('companyId ist erforderlich fuer Broker');
      }
      // Check if broker has access to this company
      const hasAccess = await this.brokerService.hasBrokerAccessToCompany(userId, companyId);
      if (!hasAccess) {
        throw new ForbiddenException('Kein Zugriff auf diese Firma');
      }
      return this.vehiclesService.findById(id, companyId);
    }

    return this.vehiclesService.findById(id, userCompanyId!);
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
