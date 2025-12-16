import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { CompaniesService, CompanyStats } from './companies.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
import { Company } from '@poa/database';

@Controller('companies')
@UseGuards(JwtAuthGuard)
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Get('current')
  async getCurrent(@Request() req: AuthenticatedRequest): Promise<Company> {
    return this.companiesService.findById(req.user.companyId!);
  }

  @Get('current/stats')
  async getStats(@Request() req: AuthenticatedRequest): Promise<CompanyStats> {
    return this.companiesService.getStats(req.user.companyId!);
  }
}
