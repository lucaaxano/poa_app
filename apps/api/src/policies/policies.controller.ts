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
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PoliciesService } from './policies.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
import { CreatePolicyDto, UpdatePolicyDto } from './dto/policy.dto';
import { UserRole } from '@poa/database';

@Controller('policies')
@UseGuards(JwtAuthGuard)
export class PoliciesController {
  constructor(private readonly policiesService: PoliciesService) {}

  /**
   * Helper method to ensure companyId is present.
   * Brokers should use /api/broker/* endpoints instead.
   */
  private getCompanyIdOrFail(companyId: string | null, role: UserRole): string {
    if (!companyId) {
      if (role === UserRole.BROKER) {
        throw new ForbiddenException(
          'Broker sollten /api/broker/* Endpoints verwenden',
        );
      }
      throw new BadRequestException('Keine Firma zugeordnet');
    }
    return companyId;
  }

  @Get()
  async findAll(@Request() req: AuthenticatedRequest) {
    const companyId = this.getCompanyIdOrFail(req.user.companyId, req.user.role);
    return this.policiesService.findByCompanyId(companyId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    const companyId = this.getCompanyIdOrFail(req.user.companyId, req.user.role);
    return this.policiesService.findById(id, companyId);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('COMPANY_ADMIN', 'SUPERADMIN')
  async create(
    @Body() createPolicyDto: CreatePolicyDto,
    @Request() req: AuthenticatedRequest,
  ) {
    const companyId = this.getCompanyIdOrFail(req.user.companyId, req.user.role);
    return this.policiesService.create(companyId, createPolicyDto);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('COMPANY_ADMIN', 'SUPERADMIN')
  async update(
    @Param('id') id: string,
    @Body() updatePolicyDto: UpdatePolicyDto,
    @Request() req: AuthenticatedRequest,
  ) {
    const companyId = this.getCompanyIdOrFail(req.user.companyId, req.user.role);
    return this.policiesService.update(id, companyId, updatePolicyDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('COMPANY_ADMIN', 'SUPERADMIN')
  async delete(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    const companyId = this.getCompanyIdOrFail(req.user.companyId, req.user.role);
    return this.policiesService.deactivate(id, companyId);
  }
}
