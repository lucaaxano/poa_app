import { Controller, Get, Param, UseGuards, Request } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('companies')
@UseGuards(JwtAuthGuard)
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Get('current')
  async getCurrent(@Request() req) {
    return this.companiesService.findById(req.user.companyId);
  }

  @Get('current/stats')
  async getStats(@Request() req) {
    return this.companiesService.getStats(req.user.companyId);
  }
}
