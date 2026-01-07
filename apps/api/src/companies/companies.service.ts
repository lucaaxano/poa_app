import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Company, DamageCategory, Prisma } from '@poa/database';
import { UpdateCompanyDto } from './dto/company.dto';

export interface CompanyStats {
  totalClaims: number;
  totalVehicles: number;
  totalUsers: number;
  claimsByStatus: Record<string, number>;
}

export interface TimelineDataPoint {
  period: string;
  claimCount: number;
  totalEstimatedCost: number;
  totalFinalCost: number;
}

export interface TimelineStats {
  data: TimelineDataPoint[];
}

export interface VehicleStatsItem {
  vehicleId: string;
  licensePlate: string;
  brand: string | null;
  model: string | null;
  claimCount: number;
  totalCost: number;
}

export interface DriverStatsItem {
  userId: string;
  firstName: string;
  lastName: string;
  claimCount: number;
  totalCost: number;
}

export interface CategoryStatsItem {
  category: DamageCategory;
  claimCount: number;
  totalCost: number;
  percentage: number;
}

export interface QuotaMonthlyData {
  month: string;
  claimCost: number;
  claimCount: number;
}

export interface QuotaStats {
  totalPremium: number;
  totalClaimCost: number;
  quotaRatio: number;
  quotaThreshold: number | null;
  isOverThreshold: boolean;
  monthlyData: QuotaMonthlyData[];
}

@Injectable()
export class CompaniesService {
  constructor(private prisma: PrismaService) {}

  async findById(id: string): Promise<Company> {
    const company = await this.prisma.company.findUnique({
      where: { id },
    });

    if (!company) {
      throw new NotFoundException('Firma nicht gefunden');
    }

    return company;
  }

  async update(id: string, dto: UpdateCompanyDto): Promise<Company> {
    // Verify company exists
    await this.findById(id);

    return this.prisma.company.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.address !== undefined && { address: dto.address || null }),
        ...(dto.city !== undefined && { city: dto.city || null }),
        ...(dto.postalCode !== undefined && { postalCode: dto.postalCode || null }),
        ...(dto.country !== undefined && { country: dto.country || null }),
        ...(dto.phone !== undefined && { phone: dto.phone || null }),
        ...(dto.website !== undefined && { website: dto.website || null }),
      },
    });
  }

  async updateLogo(id: string, logoUrl: string | null): Promise<Company> {
    await this.findById(id);
    return this.prisma.company.update({
      where: { id },
      data: { logoUrl },
    });
  }

  async getStats(companyId: string): Promise<CompanyStats> {
    const [claimsCount, vehiclesCount, usersCount, claimsByStatus] =
      await Promise.all([
        this.prisma.claim.count({ where: { companyId } }),
        this.prisma.vehicle.count({ where: { companyId, isActive: true } }),
        this.prisma.user.count({ where: { companyId, isActive: true } }),
        this.prisma.claim.groupBy({
          by: ['status'],
          where: { companyId },
          _count: true,
        }),
      ]);

    return {
      totalClaims: claimsCount,
      totalVehicles: vehiclesCount,
      totalUsers: usersCount,
      claimsByStatus: claimsByStatus.reduce(
        (acc, item) => {
          acc[item.status] = item._count;
          return acc;
        },
        {} as Record<string, number>,
      ),
    };
  }

  async getStatsTimeline(
    companyId: string,
    period: 'week' | 'month' = 'month',
    range: number = 12,
  ): Promise<TimelineStats> {
    const now = new Date();
    const startDate = new Date();

    if (period === 'month') {
      startDate.setMonth(now.getMonth() - range + 1);
      startDate.setDate(1);
    } else {
      startDate.setDate(now.getDate() - range * 7);
    }

    const claims = await this.prisma.claim.findMany({
      where: {
        companyId,
        accidentDate: {
          gte: startDate,
        },
      },
      select: {
        accidentDate: true,
        estimatedCost: true,
        finalCost: true,
      },
    });

    // Group by period
    const dataMap = new Map<string, TimelineDataPoint>();

    // Initialize all periods with zero values
    for (let i = 0; i < range; i++) {
      const date = new Date(startDate);
      if (period === 'month') {
        date.setMonth(startDate.getMonth() + i);
        const periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        dataMap.set(periodKey, {
          period: periodKey,
          claimCount: 0,
          totalEstimatedCost: 0,
          totalFinalCost: 0,
        });
      } else {
        date.setDate(startDate.getDate() + i * 7);
        const periodKey = `${date.getFullYear()}-W${String(this.getWeekNumber(date)).padStart(2, '0')}`;
        dataMap.set(periodKey, {
          period: periodKey,
          claimCount: 0,
          totalEstimatedCost: 0,
          totalFinalCost: 0,
        });
      }
    }

    // Aggregate claims
    for (const claim of claims) {
      const accidentDate = new Date(claim.accidentDate);
      let periodKey: string;

      if (period === 'month') {
        periodKey = `${accidentDate.getFullYear()}-${String(accidentDate.getMonth() + 1).padStart(2, '0')}`;
      } else {
        periodKey = `${accidentDate.getFullYear()}-W${String(this.getWeekNumber(accidentDate)).padStart(2, '0')}`;
      }

      const existing = dataMap.get(periodKey);
      if (existing) {
        existing.claimCount += 1;
        existing.totalEstimatedCost += Number(claim.estimatedCost || 0);
        existing.totalFinalCost += Number(claim.finalCost || 0);
      }
    }

    return {
      data: Array.from(dataMap.values()).sort((a, b) =>
        a.period.localeCompare(b.period),
      ),
    };
  }

  private getWeekNumber(date: Date): number {
    const d = new Date(
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
    );
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  }

  async getStatsByVehicle(
    companyId: string,
    limit: number = 10,
  ): Promise<VehicleStatsItem[]> {
    const vehicleStats = await this.prisma.claim.groupBy({
      by: ['vehicleId'],
      where: { companyId },
      _count: true,
      _sum: {
        finalCost: true,
        estimatedCost: true,
      },
      orderBy: {
        _count: {
          vehicleId: 'desc',
        },
      },
      take: limit,
    });

    // Get vehicle details
    const vehicleIds = vehicleStats.map((v) => v.vehicleId);
    const vehicles = await this.prisma.vehicle.findMany({
      where: { id: { in: vehicleIds } },
      select: {
        id: true,
        licensePlate: true,
        brand: true,
        model: true,
      },
    });

    const vehicleMap = new Map(vehicles.map((v) => [v.id, v]));

    return vehicleStats.map((stat) => {
      const vehicle = vehicleMap.get(stat.vehicleId);
      return {
        vehicleId: stat.vehicleId,
        licensePlate: vehicle?.licensePlate || 'Unbekannt',
        brand: vehicle?.brand || null,
        model: vehicle?.model || null,
        claimCount: stat._count,
        totalCost: Number(stat._sum.finalCost || stat._sum.estimatedCost || 0),
      };
    });
  }

  async getStatsByDriver(
    companyId: string,
    limit: number = 10,
  ): Promise<DriverStatsItem[]> {
    const driverStats = await this.prisma.claim.groupBy({
      by: ['driverUserId'],
      where: {
        companyId,
        driverUserId: { not: null },
      },
      _count: true,
      _sum: {
        finalCost: true,
        estimatedCost: true,
      },
      orderBy: {
        _count: {
          driverUserId: 'desc',
        },
      },
      take: limit,
    });

    // Get user details
    const userIds = driverStats
      .map((d) => d.driverUserId)
      .filter((id): id is string => id !== null);
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
      },
    });

    const userMap = new Map(users.map((u) => [u.id, u]));

    return driverStats.map((stat) => {
      const user = stat.driverUserId ? userMap.get(stat.driverUserId) : null;
      return {
        userId: stat.driverUserId || '',
        firstName: user?.firstName || 'Unbekannt',
        lastName: user?.lastName || '',
        claimCount: stat._count,
        totalCost: Number(stat._sum.finalCost || stat._sum.estimatedCost || 0),
      };
    });
  }

  async getStatsByCategory(companyId: string): Promise<CategoryStatsItem[]> {
    const categoryStats = await this.prisma.claim.groupBy({
      by: ['damageCategory'],
      where: { companyId },
      _count: true,
      _sum: {
        finalCost: true,
        estimatedCost: true,
      },
    });

    const totalClaims = categoryStats.reduce(
      (sum, stat) => sum + stat._count,
      0,
    );

    return categoryStats
      .map((stat) => ({
        category: stat.damageCategory,
        claimCount: stat._count,
        totalCost: Number(stat._sum.finalCost || stat._sum.estimatedCost || 0),
        percentage:
          totalClaims > 0
            ? Math.round((stat._count / totalClaims) * 100 * 10) / 10
            : 0,
      }))
      .sort((a, b) => b.claimCount - a.claimCount);
  }

  async getQuotaStats(companyId: string, year?: number): Promise<QuotaStats> {
    const targetYear = year || new Date().getFullYear();
    const startDate = new Date(targetYear, 0, 1);
    const endDate = new Date(targetYear, 11, 31);

    // Get active policies with annual premium
    const policies = await this.prisma.policy.findMany({
      where: {
        companyId,
        isActive: true,
        validFrom: { lte: endDate },
        OR: [{ validTo: null }, { validTo: { gte: startDate } }],
      },
      select: {
        annualPremium: true,
        quotaThreshold: true,
      },
    });

    const totalPremium = policies.reduce(
      (sum, p) => sum + Number(p.annualPremium || 0),
      0,
    );

    // Get first non-null quota threshold
    const quotaThreshold =
      policies.find((p) => p.quotaThreshold !== null)?.quotaThreshold || null;

    // Get claims for the year
    const claims = await this.prisma.claim.findMany({
      where: {
        companyId,
        accidentDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        accidentDate: true,
        finalCost: true,
        estimatedCost: true,
      },
    });

    const totalClaimCost = claims.reduce(
      (sum, c) => sum + Number(c.finalCost || c.estimatedCost || 0),
      0,
    );

    const quotaRatio =
      totalPremium > 0
        ? Math.round((totalClaimCost / totalPremium) * 100 * 10) / 10
        : 0;

    // Group by month
    const monthlyMap = new Map<string, QuotaMonthlyData>();
    for (let month = 0; month < 12; month++) {
      const monthKey = `${targetYear}-${String(month + 1).padStart(2, '0')}`;
      monthlyMap.set(monthKey, {
        month: monthKey,
        claimCost: 0,
        claimCount: 0,
      });
    }

    for (const claim of claims) {
      const accidentDate = new Date(claim.accidentDate);
      const monthKey = `${accidentDate.getFullYear()}-${String(accidentDate.getMonth() + 1).padStart(2, '0')}`;
      const existing = monthlyMap.get(monthKey);
      if (existing) {
        existing.claimCost += Number(
          claim.finalCost || claim.estimatedCost || 0,
        );
        existing.claimCount += 1;
      }
    }

    return {
      totalPremium,
      totalClaimCost,
      quotaRatio,
      quotaThreshold: quotaThreshold ? Number(quotaThreshold) : null,
      isOverThreshold: quotaThreshold
        ? quotaRatio > Number(quotaThreshold)
        : false,
      monthlyData: Array.from(monthlyMap.values()),
    };
  }
}
