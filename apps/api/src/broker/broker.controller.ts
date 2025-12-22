import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { BrokerService } from './broker.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
import {
  CompanyWithStats,
  BrokerAggregatedStats,
  BrokerCompanyStats,
  BrokerClaimFilterDto,
  PaginatedBrokerClaims,
} from './dto/broker.dto';

@Controller('broker')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('BROKER')
export class BrokerController {
  constructor(private readonly brokerService: BrokerService) {}

  /**
   * GET /broker/companies
   * Get all companies linked to the broker with stats
   */
  @Get('companies')
  async getLinkedCompanies(
    @Request() req: AuthenticatedRequest
  ): Promise<CompanyWithStats[]> {
    return this.brokerService.getLinkedCompanies(req.user.id);
  }

  /**
   * GET /broker/stats
   * Get aggregated statistics across all linked companies
   */
  @Get('stats')
  async getAggregatedStats(
    @Request() req: AuthenticatedRequest
  ): Promise<BrokerAggregatedStats> {
    return this.brokerService.getAggregatedStats(req.user.id);
  }

  /**
   * GET /broker/companies/:companyId/stats
   * Get stats for a specific company
   */
  @Get('companies/:companyId/stats')
  async getCompanyStats(
    @Param('companyId') companyId: string,
    @Request() req: AuthenticatedRequest
  ): Promise<BrokerCompanyStats> {
    return this.brokerService.getCompanyStats(req.user.id, companyId);
  }

  /**
   * GET /broker/claims
   * Get claims with optional company filter
   */
  @Get('claims')
  async getClaims(
    @Query() filters: BrokerClaimFilterDto,
    @Request() req: AuthenticatedRequest
  ): Promise<PaginatedBrokerClaims> {
    return this.brokerService.getClaims(req.user.id, filters);
  }
}
