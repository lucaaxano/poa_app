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
} from '@nestjs/common';
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

  @Get('current')
  async getCurrent(@Request() req: AuthenticatedRequest): Promise<Company> {
    return this.companiesService.findById(req.user.companyId!);
  }

  @Get('current/stats')
  async getStats(@Request() req: AuthenticatedRequest): Promise<CompanyStats> {
    return this.companiesService.getStats(req.user.companyId!);
  }

  @Get('current/stats/timeline')
  async getStatsTimeline(
    @Request() req: AuthenticatedRequest,
    @Query('period') period?: 'week' | 'month',
    @Query('range') range?: string,
  ): Promise<TimelineStats> {
    return this.companiesService.getStatsTimeline(
      req.user.companyId!,
      period || 'month',
      range ? parseInt(range, 10) : 12,
    );
  }

  @Get('current/stats/by-vehicle')
  async getStatsByVehicle(
    @Request() req: AuthenticatedRequest,
    @Query('limit') limit?: string,
  ): Promise<VehicleStatsItem[]> {
    return this.companiesService.getStatsByVehicle(
      req.user.companyId!,
      limit ? parseInt(limit, 10) : 10,
    );
  }

  @Get('current/stats/by-driver')
  async getStatsByDriver(
    @Request() req: AuthenticatedRequest,
    @Query('limit') limit?: string,
  ): Promise<DriverStatsItem[]> {
    return this.companiesService.getStatsByDriver(
      req.user.companyId!,
      limit ? parseInt(limit, 10) : 10,
    );
  }

  @Get('current/stats/by-category')
  async getStatsByCategory(
    @Request() req: AuthenticatedRequest,
  ): Promise<CategoryStatsItem[]> {
    return this.companiesService.getStatsByCategory(req.user.companyId!);
  }

  @Get('current/stats/quota')
  async getQuotaStats(
    @Request() req: AuthenticatedRequest,
    @Query('year') year?: string,
  ): Promise<QuotaStats> {
    return this.companiesService.getQuotaStats(
      req.user.companyId!,
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
    return this.companiesService.update(req.user.companyId!, updateCompanyDto);
  }

  @Post('current/logo')
  @UseGuards(RolesGuard)
  @Roles('COMPANY_ADMIN', 'SUPERADMIN')
  @UseInterceptors(FileInterceptor('logo'))
  async uploadLogo(
    @UploadedFile() file: Express.Multer.File,
    @Request() req: AuthenticatedRequest,
  ): Promise<Company> {
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
    const company = await this.companiesService.findById(req.user.companyId!);
    if (company.logoUrl) {
      try {
        await this.storageService.deleteFile(company.logoUrl);
      } catch {
        // Ignore errors when deleting old logo
      }
    }

    // Upload new logo
    const uploaded = await this.storageService.uploadFile(file, 'logos');
    return this.companiesService.updateLogo(req.user.companyId!, uploaded.url);
  }

  @Delete('current/logo')
  @UseGuards(RolesGuard)
  @Roles('COMPANY_ADMIN', 'SUPERADMIN')
  async deleteLogo(@Request() req: AuthenticatedRequest): Promise<Company> {
    const company = await this.companiesService.findById(req.user.companyId!);
    if (company.logoUrl) {
      try {
        await this.storageService.deleteFile(company.logoUrl);
      } catch {
        // Ignore errors when deleting logo
      }
    }
    return this.companiesService.updateLogo(req.user.companyId!, null);
  }
}
