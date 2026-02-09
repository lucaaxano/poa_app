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
  private cache = new Map<string, { data: unknown; expiry: number }>();
  private static readonly CACHE_TTL_MS = 120000; // 2 minutes

  constructor(private prisma: PrismaService) {}

  private getCached<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (entry && Date.now() < entry.expiry) {
      return entry.data as T;
    }
    this.cache.delete(key);
    return null;
  }

  private setCache(key: string, data: unknown): void {
    this.cache.set(key, {
      data,
      expiry: Date.now() + CompaniesService.CACHE_TTL_MS,
    });
    // Cleanup: max 100 entries
    if (this.cache.size > 100) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }
  }

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
    const cacheKey = `stats:${companyId}`;
    const cached = this.getCached<CompanyStats>(cacheKey);
    if (cached) return cached;

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

    const result: CompanyStats = {
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

    this.setCache(cacheKey, result);
    return result;
  }

  async getStatsTimeline(
    companyId: string,
    period: 'week' | 'month' = 'month',
    range: number = 12,
  ): Promise<TimelineStats> {
    const cacheKey = `timeline:${companyId}:${period}:${range}`;
    const cached = this.getCached<TimelineStats>(cacheKey);
    if (cached) return cached;

    const now = new Date();
    const startDate = new Date();

    if (period === 'month') {
      startDate.setMonth(now.getMonth() - range + 1);
      startDate.setDate(1);
    } else {
      startDate.setDate(now.getDate() - range * 7);
    }

    // Use SQL aggregation instead of loading all claims into memory
    // Note: DATE_TRUNC interval must be a literal, not a parameter, so we branch
    type TimelineRow = {
      period: string;
      claim_count: bigint;
      total_estimated_cost: number | null;
      total_final_cost: number | null;
    };

    const dbRows = period === 'month'
      ? await this.prisma.$queryRaw<TimelineRow[]>`
          SELECT
            TO_CHAR(DATE_TRUNC('month', accident_date), 'YYYY-MM') AS period,
            COUNT(*)::bigint AS claim_count,
            COALESCE(SUM(estimated_cost), 0)::float AS total_estimated_cost,
            COALESCE(SUM(final_cost), 0)::float AS total_final_cost
          FROM claims
          WHERE company_id = ${companyId}
            AND accident_date >= ${startDate}
          GROUP BY DATE_TRUNC('month', accident_date)
          ORDER BY DATE_TRUNC('month', accident_date)
        `
      : await this.prisma.$queryRaw<TimelineRow[]>`
          SELECT
            TO_CHAR(DATE_TRUNC('week', accident_date), 'YYYY-MM') AS period,
            COUNT(*)::bigint AS claim_count,
            COALESCE(SUM(estimated_cost), 0)::float AS total_estimated_cost,
            COALESCE(SUM(final_cost), 0)::float AS total_final_cost
          FROM claims
          WHERE company_id = ${companyId}
            AND accident_date >= ${startDate}
          GROUP BY DATE_TRUNC('week', accident_date)
          ORDER BY DATE_TRUNC('week', accident_date)
        `;

    // Build a map from DB results for quick lookup
    const dbMap = new Map<string, TimelineDataPoint>();
    for (const row of dbRows) {
      dbMap.set(row.period, {
        period: row.period,
        claimCount: Number(row.claim_count),
        totalEstimatedCost: Number(row.total_estimated_cost || 0),
        totalFinalCost: Number(row.total_final_cost || 0),
      });
    }

    // Initialize all periods with zero values, overlay DB data
    const dataArr: TimelineDataPoint[] = [];
    for (let i = 0; i < range; i++) {
      const date = new Date(startDate);
      let periodKey: string;
      if (period === 'month') {
        date.setMonth(startDate.getMonth() + i);
        periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      } else {
        date.setDate(startDate.getDate() + i * 7);
        periodKey = `${date.getFullYear()}-W${String(this.getWeekNumber(date)).padStart(2, '0')}`;
      }
      dataArr.push(
        dbMap.get(periodKey) || {
          period: periodKey,
          claimCount: 0,
          totalEstimatedCost: 0,
          totalFinalCost: 0,
        },
      );
    }

    const result: TimelineStats = {
      data: dataArr.sort((a, b) => a.period.localeCompare(b.period)),
    };

    this.setCache(cacheKey, result);
    return result;
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
    const cacheKey = `by-vehicle:${companyId}:${limit}`;
    const cached = this.getCached<VehicleStatsItem[]>(cacheKey);
    if (cached) return cached;

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

    const result = vehicleStats.map((stat) => {
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

    this.setCache(cacheKey, result);
    return result;
  }

  async getStatsByDriver(
    companyId: string,
    limit: number = 10,
  ): Promise<DriverStatsItem[]> {
    const cacheKey = `by-driver:${companyId}:${limit}`;
    const cached = this.getCached<DriverStatsItem[]>(cacheKey);
    if (cached) return cached;

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

    const result = driverStats.map((stat) => {
      const user = stat.driverUserId ? userMap.get(stat.driverUserId) : null;
      return {
        userId: stat.driverUserId || '',
        firstName: user?.firstName || 'Unbekannt',
        lastName: user?.lastName || '',
        claimCount: stat._count,
        totalCost: Number(stat._sum.finalCost || stat._sum.estimatedCost || 0),
      };
    });

    this.setCache(cacheKey, result);
    return result;
  }

  async getStatsByCategory(companyId: string): Promise<CategoryStatsItem[]> {
    const cacheKey = `by-category:${companyId}`;
    const cached = this.getCached<CategoryStatsItem[]>(cacheKey);
    if (cached) return cached;

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

    const result = categoryStats
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

    this.setCache(cacheKey, result);
    return result;
  }

  async getQuotaStats(companyId: string, year?: number): Promise<QuotaStats> {
    const targetYear = year || new Date().getFullYear();
    const cacheKey = `quota:${companyId}:${targetYear}`;
    const cached = this.getCached<QuotaStats>(cacheKey);
    if (cached) return cached;
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

    // Use SQL aggregation instead of loading all claims into memory
    const monthlyRows = await this.prisma.$queryRaw<
      Array<{
        month: string;
        claim_count: bigint;
        claim_cost: number | null;
      }>
    >`
      SELECT
        TO_CHAR(DATE_TRUNC('month', accident_date), 'YYYY-MM') AS month,
        COUNT(*)::bigint AS claim_count,
        COALESCE(SUM(COALESCE(final_cost, estimated_cost, 0)), 0)::float AS claim_cost
      FROM claims
      WHERE company_id = ${companyId}
        AND accident_date >= ${startDate}
        AND accident_date <= ${endDate}
      GROUP BY DATE_TRUNC('month', accident_date)
      ORDER BY DATE_TRUNC('month', accident_date)
    `;

    // Compute total claim cost from aggregated rows
    const totalClaimCost = monthlyRows.reduce(
      (sum, r) => sum + Number(r.claim_cost || 0),
      0,
    );

    const quotaRatio =
      totalPremium > 0
        ? Math.round((totalClaimCost / totalPremium) * 100 * 10) / 10
        : 0;

    // Build monthly data: initialize all 12 months, overlay DB results
    const dbMonthMap = new Map(
      monthlyRows.map((r) => [
        r.month,
        { month: r.month, claimCost: Number(r.claim_cost || 0), claimCount: Number(r.claim_count) },
      ]),
    );

    const monthlyMap = new Map<string, QuotaMonthlyData>();
    for (let month = 0; month < 12; month++) {
      const monthKey = `${targetYear}-${String(month + 1).padStart(2, '0')}`;
      monthlyMap.set(
        monthKey,
        dbMonthMap.get(monthKey) || { month: monthKey, claimCost: 0, claimCount: 0 },
      );
    }

    const result: QuotaStats = {
      totalPremium,
      totalClaimCost,
      quotaRatio,
      quotaThreshold: quotaThreshold ? Number(quotaThreshold) : null,
      isOverThreshold: quotaThreshold
        ? quotaRatio > Number(quotaThreshold)
        : false,
      monthlyData: Array.from(monthlyMap.values()),
    };

    this.setCache(cacheKey, result);
    return result;
  }
}
