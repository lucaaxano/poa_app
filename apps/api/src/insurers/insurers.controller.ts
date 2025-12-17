import { Controller, Get, UseGuards } from '@nestjs/common';
import { InsurersService } from './insurers.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('insurers')
@UseGuards(JwtAuthGuard)
export class InsurersController {
  constructor(private readonly insurersService: InsurersService) {}

  @Get()
  async findAll() {
    return this.insurersService.findAll();
  }
}
