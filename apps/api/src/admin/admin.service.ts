import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Company, User, Claim, Insurer, ClaimStatus, UserRole } from '@poa/database';
import {
  AdminCompanyFilterDto,
  AdminUserFilterDto,
  AdminClaimFilterDto,
  AdminInsurerFilterDto,
} from './dto/admin-filters.dto';
import { CreateInsurerDto, UpdateInsurerDto } from './dto/admin-insurer.dto';

// Response types
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AdminStats {
  totalCompanies: number;
  totalUsers: number;
  totalClaims: number;
  totalVehicles: number;
  totalInsurers: number;
  activeUsers: number;
  claimsByStatus: Record<string, number>;
  recentActivity: {
    newCompaniesThisMonth: number;
    newClaimsThisWeek: number;
    pendingClaims: number;
  };
}

export interface CompanyWithStats extends Company {
  _count: {
    users: number;
    vehicles: number;
    claims: number;
  };
}

export interface UserWithCompany extends User {
  company: Company | null;
}

export interface ClaimWithRelations extends Claim {
  company: Company;
  vehicle: {
    id: string;
    licensePlate: string;
    brand: string | null;
    model: string | null;
  };
  reporter: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

@Injectable()
export class AdminService {
  // In-memory cache for system stats (120 second TTL)
  // Increased from 30s to reduce DB load on frequent dashboard access
  private statsCache: AdminStats | null = null;
  private statsCacheExpiry: number = 0;
  private static readonly STATS_CACHE_TTL_MS = 120000; // 120 seconds

  constructor(private prisma: PrismaService) {}

  // ============ STATS ============

  async getSystemStats(): Promise<AdminStats> {
    // Return cached stats if still valid (prevents DB overload on rapid page loads)
    const currentTime = Date.now();
    if (this.statsCache && currentTime < this.statsCacheExpiry) {
      return this.statsCache;
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const [
      totalCompanies,
      totalUsers,
      activeUsers,
      totalClaims,
      totalVehicles,
      totalInsurers,
      claimsByStatus,
      newCompaniesThisMonth,
      newClaimsThisWeek,
      pendingClaims,
    ] = await Promise.all([
      this.prisma.company.count(),
      this.prisma.user.count(),
      this.prisma.user.count({ where: { isActive: true } }),
      this.prisma.claim.count(),
      this.prisma.vehicle.count({ where: { isActive: true } }),
      this.prisma.insurer.count({ where: { isActive: true } }),
      this.prisma.claim.groupBy({
        by: ['status'],
        _count: true,
      }),
      this.prisma.company.count({
        where: { createdAt: { gte: startOfMonth } },
      }),
      this.prisma.claim.count({
        where: { createdAt: { gte: startOfWeek } },
      }),
      this.prisma.claim.count({
        where: { status: { in: [ClaimStatus.SUBMITTED, ClaimStatus.APPROVED] } },
      }),
    ]);

    const stats: AdminStats = {
      totalCompanies,
      totalUsers,
      totalClaims,
      totalVehicles,
      totalInsurers,
      activeUsers,
      claimsByStatus: claimsByStatus.reduce(
        (acc, item) => {
          acc[item.status] = item._count;
          return acc;
        },
        {} as Record<string, number>,
      ),
      recentActivity: {
        newCompaniesThisMonth,
        newClaimsThisWeek,
        pendingClaims,
      },
    };

    // Cache the result
    this.statsCache = stats;
    this.statsCacheExpiry = Date.now() + AdminService.STATS_CACHE_TTL_MS;

    return stats;
  }

  // ============ COMPANIES ============

  async getCompanies(
    filters: AdminCompanyFilterDto,
  ): Promise<PaginatedResponse<CompanyWithStats>> {
    const { search, page = 1, limit = 20, orderBy = 'createdAt', orderDir = 'desc' } = filters;

    const where: Prisma.CompanyWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.company.findMany({
        where,
        include: {
          _count: {
            select: {
              users: true,
              vehicles: true,
              claims: true,
            },
          },
        },
        orderBy: { [orderBy]: orderDir },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.company.count({ where }),
    ]);

    return {
      data: data as CompanyWithStats[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getCompanyById(id: string): Promise<CompanyWithStats & { users: User[] }> {
    const company = await this.prisma.company.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
            vehicles: true,
            claims: true,
          },
        },
        users: {
          where: { isActive: true },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            position: true,
            isActive: true,
            lastLoginAt: true,
            createdAt: true,
            updatedAt: true,
            companyId: true,
            phone: true,
            avatarUrl: true,
            emailVerifiedAt: true,
            passwordHash: false,
            notificationSettings: true,
            twoFactorEnabled: true,
            twoFactorSecret: false,
            twoFactorBackupCodes: false,
          },
        },
      },
    });

    if (!company) {
      throw new NotFoundException('Firma nicht gefunden');
    }

    return company as any;
  }

  // ============ USERS ============

  async getUsers(
    filters: AdminUserFilterDto,
  ): Promise<PaginatedResponse<UserWithCompany>> {
    const { search, companyId, role, isActive, page = 1, limit = 20 } = filters;

    const where: Prisma.UserWhereInput = {};

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (companyId) {
      where.companyId = companyId;
    }

    if (role) {
      where.role = role;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        include: {
          company: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    // Remove sensitive fields
    const sanitizedData = data.map((user) => {
      const { passwordHash, twoFactorSecret, twoFactorBackupCodes, ...safeUser } = user;
      return safeUser;
    });

    return {
      data: sanitizedData as unknown as UserWithCompany[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getUserById(id: string): Promise<UserWithCompany> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        company: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Benutzer nicht gefunden');
    }

    const { passwordHash, twoFactorSecret, twoFactorBackupCodes, ...safeUser } = user;
    return safeUser as unknown as UserWithCompany;
  }

  async activateUser(id: string): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundException('Benutzer nicht gefunden');
    }

    return this.prisma.user.update({
      where: { id },
      data: { isActive: true },
    });
  }

  async deactivateUser(id: string, adminId: string): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundException('Benutzer nicht gefunden');
    }

    if (user.id === adminId) {
      throw new BadRequestException('Sie können sich nicht selbst deaktivieren');
    }

    if (user.role === UserRole.SUPERADMIN) {
      throw new BadRequestException('SUPERADMIN kann nicht deaktiviert werden');
    }

    return this.prisma.user.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // ============ CLAIMS ============

  async getClaims(
    filters: AdminClaimFilterDto,
  ): Promise<PaginatedResponse<ClaimWithRelations>> {
    const { search, companyId, status, dateFrom, dateTo, page = 1, limit = 20 } = filters;

    const where: Prisma.ClaimWhereInput = {};

    if (search) {
      where.OR = [
        { claimNumber: { contains: search, mode: 'insensitive' } },
        { vehicle: { licensePlate: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (companyId) {
      where.companyId = companyId;
    }

    if (status) {
      where.status = status;
    }

    if (dateFrom) {
      where.accidentDate = {
        ...((where.accidentDate as any) || {}),
        gte: new Date(dateFrom),
      };
    }

    if (dateTo) {
      where.accidentDate = {
        ...((where.accidentDate as any) || {}),
        lte: new Date(dateTo),
      };
    }

    const [data, total] = await Promise.all([
      this.prisma.claim.findMany({
        where,
        include: {
          company: true,
          vehicle: {
            select: {
              id: true,
              licensePlate: true,
              brand: true,
              model: true,
            },
          },
          reporter: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.claim.count({ where }),
    ]);

    return {
      data: data as ClaimWithRelations[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getClaimById(id: string): Promise<Claim> {
    const claim = await this.prisma.claim.findUnique({
      where: { id },
      include: {
        company: true,
        vehicle: true,
        policy: {
          include: {
            insurer: true,
          },
        },
        reporter: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        driver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        attachments: true,
        events: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!claim) {
      throw new NotFoundException('Schaden nicht gefunden');
    }

    return claim;
  }

  // ============ INSURERS ============

  async getInsurers(
    filters: AdminInsurerFilterDto,
  ): Promise<PaginatedResponse<Insurer>> {
    const { search, isActive, page = 1, limit = 20 } = filters;

    const where: Prisma.InsurerWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { claimsEmail: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [data, total] = await Promise.all([
      this.prisma.insurer.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.insurer.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getInsurerById(id: string): Promise<Insurer> {
    const insurer = await this.prisma.insurer.findUnique({
      where: { id },
    });

    if (!insurer) {
      throw new NotFoundException('Versicherer nicht gefunden');
    }

    return insurer;
  }

  async createInsurer(dto: CreateInsurerDto): Promise<Insurer> {
    // Check if insurer with same email already exists
    const existing = await this.prisma.insurer.findFirst({
      where: { claimsEmail: dto.claimsEmail },
    });

    if (existing) {
      throw new BadRequestException('Ein Versicherer mit dieser E-Mail existiert bereits');
    }

    return this.prisma.insurer.create({
      data: {
        name: dto.name,
        claimsEmail: dto.claimsEmail,
        contactPhone: dto.contactPhone || null,
        website: dto.website || null,
        logoUrl: dto.logoUrl || null,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async updateInsurer(id: string, dto: UpdateInsurerDto): Promise<Insurer> {
    const insurer = await this.getInsurerById(id);

    // Check for duplicate email if changing
    if (dto.claimsEmail && dto.claimsEmail !== insurer.claimsEmail) {
      const existing = await this.prisma.insurer.findFirst({
        where: { claimsEmail: dto.claimsEmail, id: { not: id } },
      });

      if (existing) {
        throw new BadRequestException('Ein Versicherer mit dieser E-Mail existiert bereits');
      }
    }

    return this.prisma.insurer.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.claimsEmail !== undefined && { claimsEmail: dto.claimsEmail }),
        ...(dto.contactPhone !== undefined && { contactPhone: dto.contactPhone || null }),
        ...(dto.website !== undefined && { website: dto.website || null }),
        ...(dto.logoUrl !== undefined && { logoUrl: dto.logoUrl || null }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
  }

  async deleteInsurer(id: string): Promise<void> {
    await this.getInsurerById(id);

    // Check if insurer is used in any policies
    const policiesCount = await this.prisma.policy.count({
      where: { insurerId: id },
    });

    if (policiesCount > 0) {
      // Soft delete - just deactivate
      await this.prisma.insurer.update({
        where: { id },
        data: { isActive: false },
      });
    } else {
      // Hard delete if not used
      await this.prisma.insurer.delete({
        where: { id },
      });
    }
  }
}
