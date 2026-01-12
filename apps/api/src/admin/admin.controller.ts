import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
import {
  AdminService,
  AdminStats,
  PaginatedResponse,
  CompanyWithStats,
  UserWithCompany,
  ClaimWithRelations,
} from './admin.service';
import {
  AdminCompanyFilterDto,
  AdminUserFilterDto,
  AdminClaimFilterDto,
  AdminInsurerFilterDto,
} from './dto/admin-filters.dto';
import { CreateInsurerDto, UpdateInsurerDto } from './dto/admin-insurer.dto';
import { User, Claim, Insurer } from '@poa/database';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPERADMIN')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ============ STATS ============

  @Get('stats')
  async getSystemStats(): Promise<AdminStats> {
    return this.adminService.getSystemStats();
  }

  // ============ COMPANIES ============

  @Get('companies')
  async getCompanies(
    @Query() filters: AdminCompanyFilterDto,
  ): Promise<PaginatedResponse<CompanyWithStats>> {
    return this.adminService.getCompanies(filters);
  }

  @Get('companies/:id')
  async getCompanyById(
    @Param('id') id: string,
  ): Promise<CompanyWithStats & { users: User[] }> {
    return this.adminService.getCompanyById(id);
  }

  // ============ USERS ============

  @Get('users')
  async getUsers(
    @Query() filters: AdminUserFilterDto,
  ): Promise<PaginatedResponse<UserWithCompany>> {
    return this.adminService.getUsers(filters);
  }

  @Get('users/:id')
  async getUserById(@Param('id') id: string): Promise<UserWithCompany> {
    return this.adminService.getUserById(id);
  }

  @Patch('users/:id/activate')
  async activateUser(@Param('id') id: string): Promise<User> {
    return this.adminService.activateUser(id);
  }

  @Patch('users/:id/deactivate')
  async deactivateUser(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<User> {
    return this.adminService.deactivateUser(id, req.user.id);
  }

  // ============ CLAIMS ============

  @Get('claims')
  async getClaims(
    @Query() filters: AdminClaimFilterDto,
  ): Promise<PaginatedResponse<ClaimWithRelations>> {
    return this.adminService.getClaims(filters);
  }

  @Get('claims/:id')
  async getClaimById(@Param('id') id: string): Promise<Claim> {
    return this.adminService.getClaimById(id);
  }

  // ============ INSURERS ============

  @Get('insurers')
  async getInsurers(
    @Query() filters: AdminInsurerFilterDto,
  ): Promise<PaginatedResponse<Insurer>> {
    return this.adminService.getInsurers(filters);
  }

  @Get('insurers/:id')
  async getInsurerById(@Param('id') id: string): Promise<Insurer> {
    return this.adminService.getInsurerById(id);
  }

  @Post('insurers')
  async createInsurer(@Body() dto: CreateInsurerDto): Promise<Insurer> {
    return this.adminService.createInsurer(dto);
  }

  @Patch('insurers/:id')
  async updateInsurer(
    @Param('id') id: string,
    @Body() dto: UpdateInsurerDto,
  ): Promise<Insurer> {
    return this.adminService.updateInsurer(id, dto);
  }

  @Delete('insurers/:id')
  async deleteInsurer(@Param('id') id: string): Promise<{ success: boolean }> {
    await this.adminService.deleteInsurer(id);
    return { success: true };
  }
}
