import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ClaimStatus } from '@poa/database';
import {
  CompanyWithStats,
  BrokerAggregatedStats,
  BrokerCompanyStats,
  BrokerClaimFilterDto,
  PaginatedBrokerClaims,
} from './dto/broker.dto';

@Injectable()
export class BrokerService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get all companies linked to a broker with their stats
   */
  async getLinkedCompanies(brokerUserId: string): Promise<CompanyWithStats[]> {
    const brokerLinks = await this.prisma.brokerCompanyLink.findMany({
      where: { brokerUserId },
      include: {
        company: {
          include: {
            _count: {
              select: {
                vehicles: { where: { isActive: true } },
                claims: true,
              },
            },
            claims: {
              where: {
                status: { in: [ClaimStatus.SUBMITTED, ClaimStatus.APPROVED] },
              },
              select: { id: true },
            },
          },
        },
      },
    });

    return brokerLinks.map((link) => ({
      id: link.company.id,
      name: link.company.name,
      address: link.company.address,
      city: link.company.city,
      postalCode: link.company.postalCode,
      country: link.company.country,
      totalClaims: link.company._count.claims,
      totalVehicles: link.company._count.vehicles,
      pendingClaims: link.company.claims.length,
    }));
  }

  /**
   * Get aggregated stats across all linked companies
   */
  async getAggregatedStats(brokerUserId: string): Promise<BrokerAggregatedStats> {
    // Get all linked company IDs
    const brokerLinks = await this.prisma.brokerCompanyLink.findMany({
      where: { brokerUserId },
      select: { companyId: true, company: { select: { name: true } } },
    });

    const companyIds = brokerLinks.map((link) => link.companyId);

    if (companyIds.length === 0) {
      return {
        totalCompanies: 0,
        totalClaims: 0,
        totalVehicles: 0,
        totalUsers: 0,
        claimsByStatus: {},
        claimsByCompany: [],
      };
    }

    // Aggregate counts - all queries run in parallel for performance
    const [totalClaims, totalVehicles, totalUsers, claimsByStatus, claimsByCompany, pendingClaimsByCompany] =
      await Promise.all([
        // Total claims
        this.prisma.claim.count({
          where: { companyId: { in: companyIds } },
        }),
        // Total vehicles
        this.prisma.vehicle.count({
          where: { companyId: { in: companyIds }, isActive: true },
        }),
        // Total users
        this.prisma.user.count({
          where: { companyId: { in: companyIds }, isActive: true },
        }),
        // Claims by status
        this.prisma.claim.groupBy({
          by: ['status'],
          where: { companyId: { in: companyIds } },
          _count: { status: true },
        }),
        // Claims by company
        this.prisma.claim.groupBy({
          by: ['companyId'],
          where: { companyId: { in: companyIds } },
          _count: { companyId: true },
        }),
        // Pending claims count per company (moved into Promise.all for parallel execution)
        this.prisma.claim.groupBy({
          by: ['companyId'],
          where: {
            companyId: { in: companyIds },
            status: { in: [ClaimStatus.SUBMITTED, ClaimStatus.APPROVED] },
          },
          _count: { companyId: true },
        }),
      ]);

    // Transform claims by status to object
    const claimsByStatusObj: Record<string, number> = {};
    claimsByStatus.forEach((item) => {
      claimsByStatusObj[item.status] = item._count.status;
    });

    // Transform claims by company with names
    const companyNameMap = new Map(
      brokerLinks.map((link) => [link.companyId, link.company.name])
    );
    const pendingMap = new Map(
      pendingClaimsByCompany.map((item) => [item.companyId, item._count.companyId])
    );

    const claimsByCompanyArr = claimsByCompany.map((item) => ({
      companyId: item.companyId,
      companyName: companyNameMap.get(item.companyId) || 'Unknown',
      claimCount: item._count.companyId,
      pendingCount: pendingMap.get(item.companyId) || 0,
    }));

    return {
      totalCompanies: companyIds.length,
      totalClaims,
      totalVehicles,
      totalUsers,
      claimsByStatus: claimsByStatusObj,
      claimsByCompany: claimsByCompanyArr,
    };
  }

  /**
   * Check if broker has access to a specific company
   */
  async hasBrokerAccessToCompany(
    brokerUserId: string,
    companyId: string
  ): Promise<boolean> {
    const link = await this.prisma.brokerCompanyLink.findUnique({
      where: {
        brokerUserId_companyId: {
          brokerUserId,
          companyId,
        },
      },
    });
    return !!link;
  }

  /**
   * Get stats for a specific company (with broker access check)
   */
  async getCompanyStats(
    brokerUserId: string,
    companyId: string
  ): Promise<BrokerCompanyStats> {
    // Check access
    const hasAccess = await this.hasBrokerAccessToCompany(brokerUserId, companyId);
    if (!hasAccess) {
      throw new ForbiddenException('Kein Zugriff auf diese Firma');
    }

    const [totalClaims, totalVehicles, totalUsers, claimsByStatus] = await Promise.all([
      this.prisma.claim.count({ where: { companyId } }),
      this.prisma.vehicle.count({ where: { companyId, isActive: true } }),
      this.prisma.user.count({ where: { companyId, isActive: true } }),
      this.prisma.claim.groupBy({
        by: ['status'],
        where: { companyId },
        _count: { status: true },
      }),
    ]);

    const claimsByStatusObj: Record<string, number> = {};
    claimsByStatus.forEach((item) => {
      claimsByStatusObj[item.status] = item._count.status;
    });

    return {
      totalClaims,
      totalVehicles,
      totalUsers,
      claimsByStatus: claimsByStatusObj,
    };
  }

  /**
   * Get claims for broker with optional company filter
   */
  async getClaims(
    brokerUserId: string,
    filters: BrokerClaimFilterDto
  ): Promise<PaginatedBrokerClaims> {
    const { companyId, status, search, page = 1, limit = 20 } = filters;

    // If companyId is specified, check access
    if (companyId) {
      const hasAccess = await this.hasBrokerAccessToCompany(brokerUserId, companyId);
      if (!hasAccess) {
        throw new ForbiddenException('Kein Zugriff auf diese Firma');
      }
    }

    // Get all linked company IDs
    const brokerLinks = await this.prisma.brokerCompanyLink.findMany({
      where: { brokerUserId },
      select: { companyId: true },
    });
    const linkedCompanyIds = brokerLinks.map((link) => link.companyId);

    if (linkedCompanyIds.length === 0) {
      return {
        data: [],
        meta: { total: 0, page, limit, totalPages: 0 },
      };
    }

    // Build where clause
    const where: any = {
      companyId: companyId ? companyId : { in: linkedCompanyIds },
    };

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { claimNumber: { contains: search, mode: 'insensitive' } },
        { vehicle: { licensePlate: { contains: search, mode: 'insensitive' } } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get total count and claims
    const [total, claims] = await Promise.all([
      this.prisma.claim.count({ where }),
      this.prisma.claim.findMany({
        where,
        include: {
          company: { select: { id: true, name: true } },
          vehicle: {
            select: { id: true, licensePlate: true, brand: true, model: true },
          },
          reporter: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: claims.map((claim) => ({
        id: claim.id,
        claimNumber: claim.claimNumber,
        status: claim.status,
        accidentDate: claim.accidentDate,
        accidentLocation: claim.accidentLocation,
        damageCategory: claim.damageCategory,
        estimatedCost: claim.estimatedCost ? Number(claim.estimatedCost) : null,
        createdAt: claim.createdAt,
        company: claim.company,
        vehicle: claim.vehicle,
        reporter: claim.reporter,
      })),
      meta: { total, page, limit, totalPages },
    };
  }

  /**
   * Get all company IDs linked to broker (helper method)
   */
  async getLinkedCompanyIds(brokerUserId: string): Promise<string[]> {
    const brokerLinks = await this.prisma.brokerCompanyLink.findMany({
      where: { brokerUserId },
      select: { companyId: true },
    });
    return brokerLinks.map((link) => link.companyId);
  }
}
