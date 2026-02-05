import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Body,
  UseGuards,
  Request,
  Query,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { UserRole } from '@poa/database';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  CompaniesService,
  CompanyStats,
  TimelineStats,
  VehicleStatsItem,
  DriverStatsItem,
  CategoryStatsItem,
  QuotaStats,
} from './companies.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
import { UpdateCompanyDto } from './dto/company.dto';
import { Company } from '@poa/database';
import { StorageService } from '../storage/storage.service';

@Controller('companies')
@UseGuards(JwtAuthGuard)
export class CompaniesController {
  constructor(
    private readonly companiesService: CompaniesService,
    private readonly storageService: StorageService,
  ) {}

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

  @Get('current')
  async getCurrent(@Request() req: AuthenticatedRequest): Promise<Company> {
    const companyId = this.getCompanyIdOrFail(req.user.companyId, req.user.role);
    return this.companiesService.findById(companyId);
  }

  @Get('current/stats')
  async getStats(@Request() req: AuthenticatedRequest): Promise<CompanyStats> {
    const companyId = this.getCompanyIdOrFail(req.user.companyId, req.user.role);
    return this.companiesService.getStats(companyId);
  }

  @Get('current/stats/timeline')
  async getStatsTimeline(
    @Request() req: AuthenticatedRequest,
    @Query('period') period?: 'week' | 'month',
    @Query('range') range?: string,
  ): Promise<TimelineStats> {
    const companyId = this.getCompanyIdOrFail(req.user.companyId, req.user.role);
    return this.companiesService.getStatsTimeline(
      companyId,
      period || 'month',
      range ? parseInt(range, 10) : 12,
    );
  }

  @Get('current/stats/by-vehicle')
  async getStatsByVehicle(
    @Request() req: AuthenticatedRequest,
    @Query('limit') limit?: string,
  ): Promise<VehicleStatsItem[]> {
    const companyId = this.getCompanyIdOrFail(req.user.companyId, req.user.role);
    return this.companiesService.getStatsByVehicle(
      companyId,
      limit ? parseInt(limit, 10) : 10,
    );
  }

  @Get('current/stats/by-driver')
  async getStatsByDriver(
    @Request() req: AuthenticatedRequest,
    @Query('limit') limit?: string,
  ): Promise<DriverStatsItem[]> {
    const companyId = this.getCompanyIdOrFail(req.user.companyId, req.user.role);
    return this.companiesService.getStatsByDriver(
      companyId,
      limit ? parseInt(limit, 10) : 10,
    );
  }

  @Get('current/stats/by-category')
  async getStatsByCategory(
    @Request() req: AuthenticatedRequest,
  ): Promise<CategoryStatsItem[]> {
    const companyId = this.getCompanyIdOrFail(req.user.companyId, req.user.role);
    return this.companiesService.getStatsByCategory(companyId);
  }

  @Get('current/stats/quota')
  async getQuotaStats(
    @Request() req: AuthenticatedRequest,
    @Query('year') year?: string,
  ): Promise<QuotaStats> {
    const companyId = this.getCompanyIdOrFail(req.user.companyId, req.user.role);
    return this.companiesService.getQuotaStats(
      companyId,
      year ? parseInt(year, 10) : undefined,
    );
  }

  @Patch('current')
  @UseGuards(RolesGuard)
  @Roles('COMPANY_ADMIN', 'SUPERADMIN')
  async update(
    @Body() updateCompanyDto: UpdateCompanyDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<Company> {
    const companyId = this.getCompanyIdOrFail(req.user.companyId, req.user.role);
    return this.companiesService.update(companyId, updateCompanyDto);
  }

  @Post('current/logo')
  @UseGuards(RolesGuard)
  @Roles('COMPANY_ADMIN', 'SUPERADMIN')
  @UseInterceptors(FileInterceptor('logo'))
  async uploadLogo(
    @UploadedFile() file: Express.Multer.File,
    @Request() req: AuthenticatedRequest,
  ): Promise<Company> {
    const companyId = this.getCompanyIdOrFail(req.user.companyId, req.user.role);

    if (!file) {
      throw new BadRequestException('Keine Datei hochgeladen');
    }

    // Validate file type
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Nur JPEG, PNG, WebP und SVG Dateien sind erlaubt');
    }

    // Validate file size (max 2MB)
    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new BadRequestException('Die Datei darf maximal 2MB gross sein');
    }

    // Get current company to delete old logo if exists
    const company = await this.companiesService.findById(companyId);
    if (company.logoUrl) {
      try {
        await this.storageService.deleteFile(company.logoUrl);
      } catch {
        // Ignore errors when deleting old logo
      }
    }

    // Upload new logo
    const uploaded = await this.storageService.uploadFile(file, 'logos');
    return this.companiesService.updateLogo(companyId, uploaded.url);
  }

  @Delete('current/logo')
  @UseGuards(RolesGuard)
  @Roles('COMPANY_ADMIN', 'SUPERADMIN')
  async deleteLogo(@Request() req: AuthenticatedRequest): Promise<Company> {
    const companyId = this.getCompanyIdOrFail(req.user.companyId, req.user.role);
    const company = await this.companiesService.findById(companyId);
    if (company.logoUrl) {
      try {
        await this.storageService.deleteFile(company.logoUrl);
      } catch {
        // Ignore errors when deleting logo
      }
    }
    return this.companiesService.updateLogo(companyId, null);
  }
}
