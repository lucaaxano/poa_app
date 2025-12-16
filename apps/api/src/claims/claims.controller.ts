import { Controller, Get, Param, UseGuards, Request } from '@nestjs/common';
import { ClaimsService } from './claims.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';

@Controller('claims')
@UseGuards(JwtAuthGuard)
export class ClaimsController {
  constructor(private readonly claimsService: ClaimsService) {}

  @Get()
  async findAll(@Request() req: AuthenticatedRequest) {
    return this.claimsService.findByCompanyId(req.user.companyId!);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.claimsService.findById(id, req.user.companyId!);
  }
}
