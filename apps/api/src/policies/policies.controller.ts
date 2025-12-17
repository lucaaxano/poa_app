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
import { PoliciesService } from './policies.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
import { CreatePolicyDto, UpdatePolicyDto } from './dto/policy.dto';

@Controller('policies')
@UseGuards(JwtAuthGuard)
export class PoliciesController {
  constructor(private readonly policiesService: PoliciesService) {}

  @Get()
  async findAll(@Request() req: AuthenticatedRequest) {
    return this.policiesService.findByCompanyId(req.user.companyId!);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.policiesService.findById(id, req.user.companyId!);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('COMPANY_ADMIN', 'SUPERADMIN')
  async create(
    @Body() createPolicyDto: CreatePolicyDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.policiesService.create(req.user.companyId!, createPolicyDto);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('COMPANY_ADMIN', 'SUPERADMIN')
  async update(
    @Param('id') id: string,
    @Body() updatePolicyDto: UpdatePolicyDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.policiesService.update(id, req.user.companyId!, updatePolicyDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('COMPANY_ADMIN', 'SUPERADMIN')
  async delete(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.policiesService.deactivate(id, req.user.companyId!);
  }
}
