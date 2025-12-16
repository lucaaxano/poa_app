import { Controller, Get, Param, UseGuards, Request } from '@nestjs/common';
import { ClaimsService } from './claims.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('claims')
@UseGuards(JwtAuthGuard)
export class ClaimsController {
  constructor(private readonly claimsService: ClaimsService) {}

  @Get()
  async findAll(@Request() req) {
    return this.claimsService.findByCompanyId(req.user.companyId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req) {
    return this.claimsService.findById(id, req.user.companyId);
  }
}
