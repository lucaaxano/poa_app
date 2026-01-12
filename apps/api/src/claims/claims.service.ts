import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { EmailService } from '../email/email.service';
import { NotificationsService } from '../notifications/notifications.service';
import { UsersService } from '../users/users.service';
import {
  Claim,
  Vehicle,
  ClaimAttachment,
  ClaimEvent,
  ClaimComment,
  Policy,
  Insurer,
  ClaimStatus,
  ClaimEventType,
  FileType,
  UserRole,
  DamageCategory,
  NotificationType,
  Prisma,
} from '@poa/database';
import { CreateClaimDto, UpdateClaimDto, ClaimFilterDto } from './dto/claim.dto';

// Types for responses
export interface UserSummary {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface UserWithAvatar {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
}

export interface VehicleSummary {
  id: string;
  licensePlate: string;
  brand: string | null;
  model: string | null;
}

export interface ClaimListItem extends Claim {
  vehicle: VehicleSummary;
  reporter: UserSummary;
}

export interface PolicyWithInsurer extends Policy {
  insurer: Insurer;
}

export interface CommentWithUser extends ClaimComment {
  user: UserWithAvatar;
}

export interface EventWithUser extends ClaimEvent {
  user: UserWithAvatar | null;
}

export interface ClaimDetail extends Claim {
  vehicle: Vehicle;
  reporter: UserSummary;
  driver: UserSummary | null;
  policy: PolicyWithInsurer | null;
  attachments: ClaimAttachment[];
  events: EventWithUser[];
  comments: CommentWithUser[];
}

export interface PaginatedClaims {
  data: ClaimListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

@Injectable()
export class ClaimsService {
  private readonly logger = new Logger(ClaimsService.name);
  private readonly appUrl: string;

  constructor(
    private prisma: PrismaService,
    private storageService: StorageService,
    private emailService: EmailService,
    private notificationsService: NotificationsService,
    private usersService: UsersService,
    private configService: ConfigService,
  ) {
    this.appUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
  }

  /**
   * Generate next claim number in format CLM-YYYY-NNNNN
   */
  async generateClaimNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `CLM-${year}-`;

    const lastClaim = await this.prisma.claim.findFirst({
      where: { claimNumber: { startsWith: prefix } },
      orderBy: { claimNumber: 'desc' },
      select: { claimNumber: true },
    });

    let nextNumber = 1;
    if (lastClaim) {
      const lastNumberStr = lastClaim.claimNumber.split('-')[2];
      nextNumber = parseInt(lastNumberStr, 10) + 1;
    }

    return `${prefix}${nextNumber.toString().padStart(5, '0')}`;
  }

  /**
   * Create a new claim
   */
  async create(
    dto: CreateClaimDto,
    userId: string,
    companyId: string,
  ): Promise<Claim> {
    // Verify vehicle belongs to company
    const vehicle = await this.prisma.vehicle.findFirst({
      where: { id: dto.vehicleId, companyId, isActive: true },
    });

    if (!vehicle) {
      throw new BadRequestException('Fahrzeug nicht gefunden oder nicht aktiv');
    }

    // Verify policy belongs to company (if provided)
    if (dto.policyId) {
      const policy = await this.prisma.policy.findFirst({
        where: { id: dto.policyId, companyId, isActive: true },
      });

      if (!policy) {
        throw new BadRequestException('Versicherungsvertrag nicht gefunden');
      }
    }

    // Verify driver belongs to company (if provided)
    if (dto.driverUserId) {
      const driver = await this.prisma.user.findFirst({
        where: { id: dto.driverUserId, companyId, isActive: true },
      });

      if (!driver) {
        throw new BadRequestException('Fahrer nicht gefunden');
      }
    }

    // Generate claim number
    const claimNumber = await this.generateClaimNumber();

    // Determine initial status
    const status = dto.submitImmediately ? ClaimStatus.SUBMITTED : ClaimStatus.DRAFT;

    // Parse accident time if provided
    let accidentTime: Date | null = null;
    if (dto.accidentTime) {
      const [hours, minutes] = dto.accidentTime.split(':').map(Number);
      accidentTime = new Date(1970, 0, 1, hours, minutes);
    }

    // Create claim
    const claim = await this.prisma.claim.create({
      data: {
        companyId,
        vehicleId: dto.vehicleId,
        policyId: dto.policyId || null,
        reporterUserId: userId,
        driverUserId: dto.driverUserId || null,
        status,
        claimNumber,
        accidentDate: new Date(dto.accidentDate),
        accidentTime,
        accidentLocation: dto.accidentLocation || null,
        gpsLat: dto.gpsLat ? new Prisma.Decimal(dto.gpsLat) : null,
        gpsLng: dto.gpsLng ? new Prisma.Decimal(dto.gpsLng) : null,
        damageCategory: dto.damageCategory,
        damageSubcategory: dto.damageSubcategory || null,
        description: dto.description || null,
        policeInvolved: dto.policeInvolved ?? false,
        policeFileNumber: dto.policeFileNumber || null,
        hasInjuries: dto.hasInjuries ?? false,
        injuryDetails: dto.injuryDetails || null,
        thirdPartyInfo: dto.thirdPartyInfo
          ? (dto.thirdPartyInfo as unknown as Prisma.InputJsonValue)
          : Prisma.JsonNull,
        witnessInfo: dto.witnessInfo
          ? (dto.witnessInfo as unknown as Prisma.InputJsonValue)
          : Prisma.JsonNull,
        estimatedCost: dto.estimatedCost
          ? new Prisma.Decimal(dto.estimatedCost)
          : null,
      },
    });

    // Create CREATED event
    await this.createEvent(claim.id, userId, ClaimEventType.CREATED, null, {
      status,
      claimNumber,
    });

    // If submitted immediately, send notification to admins
    if (status === ClaimStatus.SUBMITTED) {
      const reporter = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { firstName: true, lastName: true },
      });

      const admins = await this.prisma.user.findMany({
        where: {
          companyId,
          role: { in: [UserRole.COMPANY_ADMIN, UserRole.BROKER] },
          isActive: true,
        },
        select: { id: true, email: true, firstName: true },
      });

      const damageCategoryMap: Record<DamageCategory, string> = {
        [DamageCategory.LIABILITY]: 'Haftpflichtschaden',
        [DamageCategory.COMPREHENSIVE]: 'Kaskoschaden',
        [DamageCategory.GLASS]: 'Glasschaden',
        [DamageCategory.WILDLIFE]: 'Wildschaden',
        [DamageCategory.PARKING]: 'Parkschaden',
        [DamageCategory.THEFT]: 'Diebstahl',
        [DamageCategory.VANDALISM]: 'Vandalismus',
        [DamageCategory.OTHER]: 'Sonstiges',
      };

      // Create in-app notifications for admins
      const adminIds = admins.map(a => a.id);
      const reporterName = reporter ? `${reporter.firstName} ${reporter.lastName}` : 'Unbekannt';
      await this.notificationsService.createForUsers(
        adminIds,
        NotificationType.NEW_CLAIM,
        'Neuer Schaden eingegangen',
        `${reporterName} hat einen neuen Schaden gemeldet: ${vehicle.licensePlate} - ${damageCategoryMap[dto.damageCategory] || dto.damageCategory}`,
        { claimId: claim.id, claimNumber: claim.claimNumber },
      );

      for (const admin of admins) {
        try {
          // Check if admin wants to receive this type of email
          const shouldSend = await this.usersService.shouldSendEmail(admin.id, 'newClaim');
          if (shouldSend) {
            await this.emailService.sendClaimNotification(admin.email, 'submitted', {
              adminName: admin.firstName,
              claimNumber: claim.claimNumber,
              licensePlate: vehicle.licensePlate,
              vehicleBrand: vehicle.brand || '',
              vehicleModel: vehicle.model || '',
              accidentDate: new Date(dto.accidentDate).toLocaleDateString('de-DE'),
              damageCategory: damageCategoryMap[dto.damageCategory] || dto.damageCategory,
              reporterName,
              description: dto.description || null,
              claimLink: `${this.appUrl}/claims/${claim.id}`,
            });
          }
        } catch (error) {
          this.logger.warn(`Failed to send submit notification to ${admin.email}: ${error.message}`);
        }
      }
    }

    return claim;
  }

  /**
   * Update an existing claim
   */
  async update(
    id: string,
    dto: UpdateClaimDto,
    userId: string,
    companyId: string,
    userRole: UserRole,
  ): Promise<Claim> {
    // Find existing claim
    const existingClaim = await this.prisma.claim.findFirst({
      where: { id, companyId },
    });

    if (!existingClaim) {
      throw new NotFoundException('Schaden nicht gefunden');
    }

    // Check if claim can be edited based on status
    const editableStatuses: ClaimStatus[] = [ClaimStatus.DRAFT, ClaimStatus.SUBMITTED, ClaimStatus.REJECTED];
    if (!editableStatuses.includes(existingClaim.status as ClaimStatus)) {
      throw new ForbiddenException(
        'Schaden kann in diesem Status nicht mehr bearbeitet werden',
      );
    }

    // Regular employees can only edit their own claims in DRAFT status
    if (
      userRole === UserRole.EMPLOYEE &&
      existingClaim.reporterUserId !== userId
    ) {
      throw new ForbiddenException('Sie koennen nur eigene Schaeden bearbeiten');
    }

    if (
      userRole === UserRole.EMPLOYEE &&
      existingClaim.status !== ClaimStatus.DRAFT
    ) {
      throw new ForbiddenException(
        'Sie koennen nur Entwuerfe bearbeiten',
      );
    }

    // Verify vehicle belongs to company (if changing)
    if (dto.vehicleId && dto.vehicleId !== existingClaim.vehicleId) {
      const vehicle = await this.prisma.vehicle.findFirst({
        where: { id: dto.vehicleId, companyId, isActive: true },
      });

      if (!vehicle) {
        throw new BadRequestException('Fahrzeug nicht gefunden oder nicht aktiv');
      }
    }

    // Verify policy belongs to company (if changing)
    if (dto.policyId && dto.policyId !== existingClaim.policyId) {
      const policy = await this.prisma.policy.findFirst({
        where: { id: dto.policyId, companyId, isActive: true },
      });

      if (!policy) {
        throw new BadRequestException('Versicherungsvertrag nicht gefunden');
      }
    }

    // Only admins can set finalCost and insurerClaimNumber
    if (
      (dto.finalCost !== undefined || dto.insurerClaimNumber !== undefined) &&
      userRole === UserRole.EMPLOYEE
    ) {
      throw new ForbiddenException(
        'Nur Administratoren koennen finale Kosten und Versicherer-Schadennummer setzen',
      );
    }

    // Parse accident time if provided
    let accidentTime: Date | null | undefined = undefined;
    if (dto.accidentTime !== undefined) {
      if (dto.accidentTime) {
        const [hours, minutes] = dto.accidentTime.split(':').map(Number);
        accidentTime = new Date(1970, 0, 1, hours, minutes);
      } else {
        accidentTime = null;
      }
    }

    // Build update data
    const updateData: Prisma.ClaimUpdateInput = {};

    if (dto.vehicleId !== undefined) updateData.vehicle = { connect: { id: dto.vehicleId } };
    if (dto.policyId !== undefined) {
      updateData.policy = dto.policyId ? { connect: { id: dto.policyId } } : { disconnect: true };
    }
    if (dto.driverUserId !== undefined) {
      updateData.driver = dto.driverUserId ? { connect: { id: dto.driverUserId } } : { disconnect: true };
    }
    if (dto.accidentDate !== undefined) updateData.accidentDate = new Date(dto.accidentDate);
    if (accidentTime !== undefined) updateData.accidentTime = accidentTime;
    if (dto.accidentLocation !== undefined) updateData.accidentLocation = dto.accidentLocation || null;
    if (dto.gpsLat !== undefined) updateData.gpsLat = dto.gpsLat ? new Prisma.Decimal(dto.gpsLat) : null;
    if (dto.gpsLng !== undefined) updateData.gpsLng = dto.gpsLng ? new Prisma.Decimal(dto.gpsLng) : null;
    if (dto.damageCategory !== undefined) updateData.damageCategory = dto.damageCategory;
    if (dto.damageSubcategory !== undefined) updateData.damageSubcategory = dto.damageSubcategory || null;
    if (dto.description !== undefined) updateData.description = dto.description || null;
    if (dto.policeInvolved !== undefined) updateData.policeInvolved = dto.policeInvolved;
    if (dto.policeFileNumber !== undefined) updateData.policeFileNumber = dto.policeFileNumber || null;
    if (dto.hasInjuries !== undefined) updateData.hasInjuries = dto.hasInjuries;
    if (dto.injuryDetails !== undefined) updateData.injuryDetails = dto.injuryDetails || null;
    if (dto.thirdPartyInfo !== undefined) {
      updateData.thirdPartyInfo = dto.thirdPartyInfo
        ? (dto.thirdPartyInfo as unknown as Prisma.InputJsonValue)
        : Prisma.JsonNull;
    }
    if (dto.witnessInfo !== undefined) {
      updateData.witnessInfo = dto.witnessInfo
        ? (dto.witnessInfo as unknown as Prisma.InputJsonValue)
        : Prisma.JsonNull;
    }
    if (dto.estimatedCost !== undefined) {
      updateData.estimatedCost = dto.estimatedCost ? new Prisma.Decimal(dto.estimatedCost) : null;
    }
    if (dto.finalCost !== undefined) {
      updateData.finalCost = dto.finalCost ? new Prisma.Decimal(dto.finalCost) : null;
    }
    if (dto.insurerClaimNumber !== undefined) updateData.insurerClaimNumber = dto.insurerClaimNumber || null;

    // Update claim
    const updatedClaim = await this.prisma.claim.update({
      where: { id },
      data: updateData,
    });

    // Create UPDATED event with changes
    const changes: Record<string, { old: unknown; new: unknown }> = {};
    Object.keys(dto).forEach((key) => {
      const oldValue = (existingClaim as Record<string, unknown>)[key];
      const newValue = (dto as Record<string, unknown>)[key];
      if (oldValue !== newValue && newValue !== undefined) {
        changes[key] = { old: oldValue, new: newValue };
      }
    });

    if (Object.keys(changes).length > 0) {
      await this.createEvent(id, userId, ClaimEventType.UPDATED, { changes }, null);
    }

    return updatedClaim;
  }

  /**
   * Delete a claim (only DRAFT status allowed)
   */
  async delete(id: string, userId: string, companyId: string, userRole: UserRole): Promise<void> {
    const claim = await this.prisma.claim.findFirst({
      where: { id, companyId },
    });

    if (!claim) {
      throw new NotFoundException('Schaden nicht gefunden');
    }

    // Only DRAFT claims can be deleted
    if (claim.status !== ClaimStatus.DRAFT) {
      throw new ForbiddenException('Nur Entwuerfe koennen geloescht werden');
    }

    // Employees can only delete their own drafts
    if (userRole === UserRole.EMPLOYEE && claim.reporterUserId !== userId) {
      throw new ForbiddenException('Sie koennen nur eigene Entwuerfe loeschen');
    }

    // Delete claim (cascades to attachments, events, comments)
    await this.prisma.claim.delete({
      where: { id },
    });
  }

  /**
   * Find claims by company with filtering and pagination
   */
  async findByCompanyId(
    companyId: string,
    filters?: ClaimFilterDto,
  ): Promise<PaginatedClaims> {
    const page = filters?.page ?? 1;
    const pageSize = filters?.pageSize ?? 20;
    const skip = (page - 1) * pageSize;

    // Build where clause
    const where: Prisma.ClaimWhereInput = { companyId };

    if (filters?.status && filters.status.length > 0) {
      where.status = { in: filters.status };
    }

    if (filters?.vehicleId) {
      where.vehicleId = filters.vehicleId;
    }

    if (filters?.driverUserId) {
      where.driverUserId = filters.driverUserId;
    }

    if (filters?.damageCategory && filters.damageCategory.length > 0) {
      where.damageCategory = { in: filters.damageCategory };
    }

    if (filters?.dateFrom || filters?.dateTo) {
      where.accidentDate = {};
      if (filters.dateFrom) {
        where.accidentDate.gte = new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        where.accidentDate.lte = new Date(filters.dateTo);
      }
    }

    if (filters?.search) {
      where.OR = [
        { claimNumber: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { accidentLocation: { contains: filters.search, mode: 'insensitive' } },
        { vehicle: { licensePlate: { contains: filters.search, mode: 'insensitive' } } },
      ];
    }

    // Build orderBy
    const sortBy = filters?.sortBy ?? 'createdAt';
    const sortOrder = filters?.sortOrder ?? 'desc';
    const orderBy: Prisma.ClaimOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    // Execute queries
    const [claims, total] = await Promise.all([
      this.prisma.claim.findMany({
        where,
        include: {
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
              email: true,
            },
          },
        },
        orderBy,
        skip,
        take: pageSize,
      }),
      this.prisma.claim.count({ where }),
    ]);

    return {
      data: claims as ClaimListItem[],
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * Find claims for a specific user (employee view)
   */
  async findByUserId(
    userId: string,
    companyId: string,
    filters?: ClaimFilterDto,
  ): Promise<PaginatedClaims> {
    const userFilters = {
      ...filters,
    };

    const page = userFilters?.page ?? 1;
    const pageSize = userFilters?.pageSize ?? 20;
    const skip = (page - 1) * pageSize;

    // Build where clause - only claims where user is reporter or driver
    const where: Prisma.ClaimWhereInput = {
      companyId,
      OR: [{ reporterUserId: userId }, { driverUserId: userId }],
    };

    if (userFilters?.status && userFilters.status.length > 0) {
      where.status = { in: userFilters.status };
    }

    if (userFilters?.damageCategory && userFilters.damageCategory.length > 0) {
      where.damageCategory = { in: userFilters.damageCategory };
    }

    if (userFilters?.search) {
      where.AND = [
        {
          OR: [
            { claimNumber: { contains: userFilters.search, mode: 'insensitive' } },
            { description: { contains: userFilters.search, mode: 'insensitive' } },
          ],
        },
      ];
    }

    const sortBy = userFilters?.sortBy ?? 'createdAt';
    const sortOrder = userFilters?.sortOrder ?? 'desc';
    const orderBy: Prisma.ClaimOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    const [claims, total] = await Promise.all([
      this.prisma.claim.findMany({
        where,
        include: {
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
              email: true,
            },
          },
        },
        orderBy,
        skip,
        take: pageSize,
      }),
      this.prisma.claim.count({ where }),
    ]);

    return {
      data: claims as ClaimListItem[],
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * Find a single claim by ID
   */
  async findById(id: string, companyId: string): Promise<ClaimDetail> {
    const claim = await this.prisma.claim.findFirst({
      where: { id, companyId },
      include: {
        vehicle: true,
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
        policy: {
          include: {
            insurer: true,
          },
        },
        attachments: {
          orderBy: { createdAt: 'asc' },
        },
        events: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
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
                avatarUrl: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!claim) {
      throw new NotFoundException('Schaden nicht gefunden');
    }

    return claim as ClaimDetail;
  }

  /**
   * Find a single claim by ID without company filter (for Broker access)
   * Returns the claim with its companyId for authorization check
   */
  async findByIdWithCompanyId(id: string): Promise<ClaimDetail & { companyId: string }> {
    const claim = await this.prisma.claim.findUnique({
      where: { id },
      include: {
        vehicle: true,
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
        policy: {
          include: {
            insurer: true,
          },
        },
        attachments: {
          orderBy: { createdAt: 'asc' },
        },
        events: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
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
                avatarUrl: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!claim) {
      throw new NotFoundException('Schaden nicht gefunden');
    }

    return claim as ClaimDetail & { companyId: string };
  }

  /**
   * Create a claim event for audit logging
   */
  async createEvent(
    claimId: string,
    userId: string | null,
    eventType: ClaimEventType,
    oldValue: Record<string, unknown> | null,
    newValue: Record<string, unknown> | null,
    meta?: Record<string, unknown>,
  ): Promise<ClaimEvent> {
    return this.prisma.claimEvent.create({
      data: {
        claimId,
        userId,
        eventType,
        oldValue: oldValue
          ? (oldValue as Prisma.InputJsonValue)
          : Prisma.JsonNull,
        newValue: newValue
          ? (newValue as Prisma.InputJsonValue)
          : Prisma.JsonNull,
        meta: meta
          ? (meta as Prisma.InputJsonValue)
          : Prisma.JsonNull,
      },
    });
  }

  /**
   * Get events for a claim
   */
  async getEvents(claimId: string, companyId: string): Promise<EventWithUser[]> {
    // Verify claim belongs to company
    const claim = await this.prisma.claim.findFirst({
      where: { id: claimId, companyId },
      select: { id: true },
    });

    if (!claim) {
      throw new NotFoundException('Schaden nicht gefunden');
    }

    return this.prisma.claimEvent.findMany({
      where: { claimId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }) as Promise<EventWithUser[]>;
  }

  /**
   * Submit a claim (DRAFT/REJECTED → SUBMITTED)
   */
  async submit(
    id: string,
    userId: string,
    companyId: string,
  ): Promise<Claim> {
    const claim = await this.prisma.claim.findFirst({
      where: { id, companyId },
      include: {
        vehicle: true,
        reporter: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!claim) {
      throw new NotFoundException('Schaden nicht gefunden');
    }

    // Only DRAFT or REJECTED claims can be submitted
    if (claim.status !== ClaimStatus.DRAFT && claim.status !== ClaimStatus.REJECTED) {
      throw new BadRequestException(
        'Nur Entwuerfe oder abgelehnte Schaeden koennen eingereicht werden',
      );
    }

    // Update status
    const updatedClaim = await this.prisma.claim.update({
      where: { id },
      data: {
        status: ClaimStatus.SUBMITTED,
        rejectionReason: null, // Clear rejection reason if resubmitting
      },
    });

    // Create event
    await this.createEvent(
      id,
      userId,
      ClaimEventType.STATUS_CHANGED,
      { status: claim.status },
      { status: ClaimStatus.SUBMITTED },
    );

    // Send notification email to admins
    const admins = await this.prisma.user.findMany({
      where: {
        companyId,
        role: { in: [UserRole.COMPANY_ADMIN, UserRole.BROKER] },
        isActive: true,
      },
      select: { id: true, email: true, firstName: true },
    });

    const damageCategoryMap: Record<DamageCategory, string> = {
      [DamageCategory.LIABILITY]: 'Haftpflichtschaden',
      [DamageCategory.COMPREHENSIVE]: 'Kaskoschaden',
      [DamageCategory.GLASS]: 'Glasschaden',
      [DamageCategory.WILDLIFE]: 'Wildschaden',
      [DamageCategory.PARKING]: 'Parkschaden',
      [DamageCategory.THEFT]: 'Diebstahl',
      [DamageCategory.VANDALISM]: 'Vandalismus',
      [DamageCategory.OTHER]: 'Sonstiges',
    };

    // Create in-app notifications for admins
    const adminIds = admins.map(a => a.id);
    const reporterName = `${claim.reporter.firstName} ${claim.reporter.lastName}`;
    await this.notificationsService.createForUsers(
      adminIds,
      NotificationType.NEW_CLAIM,
      'Neuer Schaden eingegangen',
      `${reporterName} hat einen neuen Schaden gemeldet: ${claim.vehicle.licensePlate} - ${damageCategoryMap[claim.damageCategory] || claim.damageCategory}`,
      { claimId: id, claimNumber: claim.claimNumber },
    );

    for (const admin of admins) {
      try {
        // Check if admin wants to receive this type of email
        const shouldSend = await this.usersService.shouldSendEmail(admin.id, 'newClaim');
        if (shouldSend) {
          await this.emailService.sendClaimNotification(admin.email, 'submitted', {
            adminName: admin.firstName,
            claimNumber: claim.claimNumber,
            licensePlate: claim.vehicle.licensePlate,
            vehicleBrand: claim.vehicle.brand || '',
            vehicleModel: claim.vehicle.model || '',
            accidentDate: new Date(claim.accidentDate).toLocaleDateString('de-DE'),
            damageCategory: damageCategoryMap[claim.damageCategory] || claim.damageCategory,
            reporterName,
            description: claim.description || null,
            claimLink: `${this.appUrl}/claims/${id}`,
          });
        }
      } catch (error) {
        this.logger.warn(`Failed to send submit notification to ${admin.email}: ${error.message}`);
      }
    }

    return updatedClaim;
  }

  /**
   * Approve a claim (SUBMITTED → APPROVED)
   */
  async approve(
    id: string,
    userId: string,
    companyId: string,
    userRole: UserRole,
  ): Promise<Claim> {
    // Only admins and brokers can approve
    if (userRole !== UserRole.COMPANY_ADMIN && userRole !== UserRole.BROKER && userRole !== UserRole.SUPERADMIN) {
      throw new ForbiddenException('Nur Administratoren koennen Schaeden genehmigen');
    }

    const claim = await this.prisma.claim.findFirst({
      where: { id, companyId },
      include: {
        vehicle: true,
        reporter: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!claim) {
      throw new NotFoundException('Schaden nicht gefunden');
    }

    // Only SUBMITTED claims can be approved
    if (claim.status !== ClaimStatus.SUBMITTED) {
      throw new BadRequestException(
        'Nur eingereichte Schaeden koennen genehmigt werden',
      );
    }

    // Get approver name
    const approver = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true },
    });

    // Update status
    const updatedClaim = await this.prisma.claim.update({
      where: { id },
      data: { status: ClaimStatus.APPROVED },
    });

    // Create event
    await this.createEvent(
      id,
      userId,
      ClaimEventType.STATUS_CHANGED,
      { status: ClaimStatus.SUBMITTED },
      { status: ClaimStatus.APPROVED },
    );

    // Create in-app notification for reporter
    const approverName = approver ? `${approver.firstName} ${approver.lastName}` : 'Administrator';
    await this.notificationsService.create({
      userId: claim.reporter.id,
      type: NotificationType.CLAIM_APPROVED,
      title: 'Schaden freigegeben',
      message: `Ihr Schaden ${claim.claimNumber} wurde von ${approverName} freigegeben.`,
      data: { claimId: id, claimNumber: claim.claimNumber },
    });

    // Send notification email to reporter (if they want it)
    try {
      const shouldSend = await this.usersService.shouldSendEmail(claim.reporter.id, 'claimApproved');
      if (shouldSend) {
        await this.emailService.sendClaimNotification(claim.reporter.email, 'approved', {
          userName: claim.reporter.firstName,
          claimNumber: claim.claimNumber,
          licensePlate: claim.vehicle.licensePlate,
          accidentDate: new Date(claim.accidentDate).toLocaleDateString('de-DE'),
          approverName,
          approvedAt: new Date().toLocaleDateString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }),
          claimLink: `${this.appUrl}/claims/${id}`,
        });
      }
    } catch (error) {
      this.logger.warn(`Failed to send approval notification: ${error.message}`);
    }

    return updatedClaim;
  }

  /**
   * Reject a claim (SUBMITTED → REJECTED)
   */
  async reject(
    id: string,
    userId: string,
    companyId: string,
    userRole: UserRole,
    reason: string,
  ): Promise<Claim> {
    // Only admins and brokers can reject
    if (userRole !== UserRole.COMPANY_ADMIN && userRole !== UserRole.BROKER && userRole !== UserRole.SUPERADMIN) {
      throw new ForbiddenException('Nur Administratoren koennen Schaeden ablehnen');
    }

    const claim = await this.prisma.claim.findFirst({
      where: { id, companyId },
      include: {
        vehicle: true,
        reporter: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!claim) {
      throw new NotFoundException('Schaden nicht gefunden');
    }

    // Only SUBMITTED claims can be rejected
    if (claim.status !== ClaimStatus.SUBMITTED) {
      throw new BadRequestException(
        'Nur eingereichte Schaeden koennen abgelehnt werden',
      );
    }

    // Get rejector name
    const rejector = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true },
    });

    // Update status
    const updatedClaim = await this.prisma.claim.update({
      where: { id },
      data: {
        status: ClaimStatus.REJECTED,
        rejectionReason: reason,
      },
    });

    // Create event
    await this.createEvent(
      id,
      userId,
      ClaimEventType.STATUS_CHANGED,
      { status: ClaimStatus.SUBMITTED },
      { status: ClaimStatus.REJECTED, rejectionReason: reason },
    );

    // Create in-app notification for reporter
    const rejectorName = rejector ? `${rejector.firstName} ${rejector.lastName}` : 'Administrator';
    await this.notificationsService.create({
      userId: claim.reporter.id,
      type: NotificationType.CLAIM_REJECTED,
      title: 'Schaden abgelehnt',
      message: `Ihr Schaden ${claim.claimNumber} wurde von ${rejectorName} abgelehnt. Grund: ${reason}`,
      data: { claimId: id, claimNumber: claim.claimNumber },
    });

    // Send notification email to reporter (if they want it)
    try {
      const shouldSend = await this.usersService.shouldSendEmail(claim.reporter.id, 'claimRejected');
      if (shouldSend) {
        await this.emailService.sendClaimNotification(claim.reporter.email, 'rejected', {
          userName: claim.reporter.firstName,
          claimNumber: claim.claimNumber,
          licensePlate: claim.vehicle.licensePlate,
          accidentDate: new Date(claim.accidentDate).toLocaleDateString('de-DE'),
          rejectorName,
          rejectedAt: new Date().toLocaleDateString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }),
          rejectionReason: reason,
          claimLink: `${this.appUrl}/claims/${id}`,
        });
      }
    } catch (error) {
      this.logger.warn(`Failed to send rejection notification: ${error.message}`);
    }

    return updatedClaim;
  }

  /**
   * Send claim to insurer (APPROVED → SENT)
   */
  async sendToInsurer(
    id: string,
    userId: string,
    companyId: string,
    userRole: UserRole,
  ): Promise<Claim> {
    // Only admins and brokers can send to insurer
    if (userRole !== UserRole.COMPANY_ADMIN && userRole !== UserRole.BROKER && userRole !== UserRole.SUPERADMIN) {
      throw new ForbiddenException('Nur Administratoren koennen Schaeden an Versicherungen senden');
    }

    // Load claim with all relations needed for the email
    const claim = await this.prisma.claim.findFirst({
      where: { id, companyId },
      include: {
        vehicle: true,
        policy: {
          include: {
            insurer: true,
          },
        },
        reporter: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        driver: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        company: true,
        attachments: true,
      },
    });

    if (!claim) {
      throw new NotFoundException('Schaden nicht gefunden');
    }

    // Only APPROVED claims can be sent
    if (claim.status !== ClaimStatus.APPROVED) {
      throw new BadRequestException(
        'Nur genehmigte Schaeden koennen an die Versicherung gesendet werden',
      );
    }

    // Check if policy and insurer exist
    if (!claim.policy || !claim.policy.insurer) {
      throw new BadRequestException(
        'Der Schaden hat keine zugeordnete Versicherungspolice. Bitte zuerst eine Police zuweisen.',
      );
    }

    const insurerEmail = claim.policy.insurer.claimsEmail;
    if (!insurerEmail) {
      throw new BadRequestException(
        'Die Versicherung hat keine Schadens-E-Mail-Adresse hinterlegt.',
      );
    }

    // Prepare email data
    const damageCategoryMap: Record<DamageCategory, string> = {
      [DamageCategory.LIABILITY]: 'Haftpflichtschaden',
      [DamageCategory.COMPREHENSIVE]: 'Kaskoschaden',
      [DamageCategory.GLASS]: 'Glasschaden',
      [DamageCategory.WILDLIFE]: 'Wildschaden',
      [DamageCategory.PARKING]: 'Parkschaden',
      [DamageCategory.THEFT]: 'Diebstahl',
      [DamageCategory.VANDALISM]: 'Vandalismus',
      [DamageCategory.OTHER]: 'Sonstiges',
    };

    const accidentDate = claim.accidentDate
      ? new Date(claim.accidentDate).toLocaleDateString('de-DE')
      : 'Unbekannt';

    const accidentTime = claim.accidentTime
      ? claim.accidentTime.toString().substring(0, 5)
      : null;

    const claimData = {
      // Policy data
      policyNumber: claim.policy.policyNumber,
      companyName: claim.company.name,
      companyAddress: [
        claim.company.address,
        claim.company.postalCode,
        claim.company.city,
      ].filter(Boolean).join(', ') || null,

      // Vehicle data
      licensePlate: claim.vehicle.licensePlate,
      vehicleBrand: claim.vehicle.brand || '',
      vehicleModel: claim.vehicle.model || '',
      vehicleYear: claim.vehicle.year,
      vin: claim.vehicle.vin,

      // Claim data
      claimNumber: claim.claimNumber,
      accidentDate,
      accidentTime,
      accidentLocation: claim.accidentLocation || 'Nicht angegeben',
      damageCategory: damageCategoryMap[claim.damageCategory] || claim.damageCategory,
      damageSubcategory: claim.damageSubcategory,
      description: claim.description || 'Keine Beschreibung vorhanden',

      // Additional info
      policeInvolved: claim.policeInvolved,
      policeFileNumber: claim.policeFileNumber,
      hasInjuries: claim.hasInjuries,
      injuryDetails: claim.injuryDetails,
      estimatedCost: claim.estimatedCost ? Number(claim.estimatedCost).toFixed(2) : null,

      // People
      reporterName: `${claim.reporter.firstName} ${claim.reporter.lastName}`,
      driverName: claim.driver ? `${claim.driver.firstName} ${claim.driver.lastName}` : null,

      // Third party & witnesses
      thirdPartyInfo: claim.thirdPartyInfo as Record<string, unknown> | null,
      witnessInfo: claim.witnessInfo as Array<Record<string, unknown>> | null,

      // Attachments info
      hasAttachments: claim.attachments.length > 0,
      attachmentCount: claim.attachments.length,
    };

    // Prepare attachments for email
    const emailAttachments: Array<{ filename: string; content: Buffer; contentType: string }> = [];

    for (const attachment of claim.attachments) {
      try {
        const fileBuffer = await this.storageService.downloadFile(attachment.fileUrl);
        emailAttachments.push({
          filename: attachment.fileName,
          content: fileBuffer,
          contentType: attachment.mimeType || 'application/octet-stream',
        });
      } catch (error) {
        this.logger.warn(`Could not download attachment ${attachment.fileName}: ${error.message}`);
      }
    }

    // Generate email subject
    const subject = `[${claim.policy.policyNumber}] Schadenmeldung vom ${accidentDate} - ${claim.vehicle.licensePlate}`;

    // Send email
    const emailResult = await this.emailService.sendClaimToInsurer(
      insurerEmail,
      subject,
      claimData,
      emailAttachments,
    );

    if (!emailResult.success) {
      this.logger.error(`Failed to send claim ${claim.claimNumber} to insurer: ${emailResult.error}`);
      throw new BadRequestException(
        `E-Mail konnte nicht gesendet werden: ${emailResult.error}`,
      );
    }

    // Update claim status
    const updatedClaim = await this.prisma.claim.update({
      where: { id },
      data: {
        status: ClaimStatus.SENT,
        sentAt: new Date(),
      },
    });

    // Create event
    await this.createEvent(
      id,
      userId,
      ClaimEventType.EMAIL_SENT,
      { status: ClaimStatus.APPROVED },
      {
        status: ClaimStatus.SENT,
        recipient: insurerEmail,
        messageId: emailResult.messageId,
      },
    );

    // Log to EmailLog table
    await this.prisma.emailLog.create({
      data: {
        claimId: id,
        recipient: insurerEmail,
        subject,
        messageId: emailResult.messageId,
        status: 'sent',
      },
    });

    this.logger.log(`Claim ${claim.claimNumber} sent to ${insurerEmail} (${emailResult.messageId})`);

    return updatedClaim;
  }

  /**
   * Get comments for a claim
   */
  async getComments(claimId: string, companyId: string): Promise<CommentWithUser[]> {
    // Verify claim belongs to company
    const claim = await this.prisma.claim.findFirst({
      where: { id: claimId, companyId },
      select: { id: true },
    });

    if (!claim) {
      throw new NotFoundException('Schaden nicht gefunden');
    }

    return this.prisma.claimComment.findMany({
      where: { claimId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    }) as Promise<CommentWithUser[]>;
  }

  /**
   * Add a comment to a claim
   */
  async addComment(
    claimId: string,
    userId: string,
    companyId: string,
    content: string,
  ): Promise<CommentWithUser> {
    // Verify claim belongs to company and get full data for notifications
    const claim = await this.prisma.claim.findFirst({
      where: { id: claimId, companyId },
      include: {
        vehicle: true,
        reporter: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!claim) {
      throw new NotFoundException('Schaden nicht gefunden');
    }

    // Create comment
    const comment = await this.prisma.claimComment.create({
      data: {
        claimId,
        userId,
        content,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
      },
    });

    // Create event
    await this.createEvent(
      claimId,
      userId,
      ClaimEventType.COMMENT_ADDED,
      null,
      { commentId: comment.id, preview: content.substring(0, 100) },
    );

    // Determine recipients for notification (reporter + admins, excluding commenter)
    const recipients: Array<{ id: string; email: string; firstName: string }> = [];

    // Add reporter if not the commenter
    if (claim.reporter.id !== userId) {
      recipients.push({
        id: claim.reporter.id,
        email: claim.reporter.email,
        firstName: claim.reporter.firstName,
      });
    }

    // Add admins/brokers who are not the commenter
    const admins = await this.prisma.user.findMany({
      where: {
        companyId,
        role: { in: [UserRole.COMPANY_ADMIN, UserRole.BROKER] },
        isActive: true,
        id: { not: userId },
      },
      select: { id: true, email: true, firstName: true },
    });

    for (const admin of admins) {
      // Avoid duplicates (reporter might also be admin)
      if (!recipients.find(r => r.email === admin.email)) {
        recipients.push(admin);
      }
    }

    // Create in-app notifications
    const commenterName = `${comment.user.firstName} ${comment.user.lastName}`;
    const recipientIds = recipients.map(r => r.id);
    await this.notificationsService.createForUsers(
      recipientIds,
      NotificationType.NEW_COMMENT,
      'Neuer Kommentar',
      `${commenterName} hat einen Kommentar zu Schaden ${claim.claimNumber} hinzugefuegt.`,
      { claimId, claimNumber: claim.claimNumber },
    );

    // Send notification emails (respecting user preferences)
    for (const recipient of recipients) {
      try {
        const shouldSend = await this.usersService.shouldSendEmail(recipient.id, 'newComment');
        if (shouldSend) {
          await this.emailService.sendNewCommentNotification(recipient.email, {
            userName: recipient.firstName,
            claimNumber: claim.claimNumber,
            licensePlate: claim.vehicle.licensePlate,
            status: claim.status,
            commenterName,
            commentContent: content,
            commentedAt: new Date().toLocaleDateString('de-DE', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            }),
            claimLink: `${this.appUrl}/claims/${claimId}`,
          });
        }
      } catch (error) {
        this.logger.warn(`Failed to send comment notification to ${recipient.email}: ${error.message}`);
      }
    }

    return comment as CommentWithUser;
  }

  /**
   * Upload an attachment to a claim
   */
  async uploadAttachment(
    claimId: string,
    file: Express.Multer.File,
    userId: string,
    companyId: string,
  ): Promise<ClaimAttachment> {
    // Verify claim belongs to company
    const claim = await this.prisma.claim.findFirst({
      where: { id: claimId, companyId },
      select: { id: true },
    });

    if (!claim) {
      throw new NotFoundException('Schaden nicht gefunden');
    }

    // Upload file to storage
    const uploadedFile = await this.storageService.uploadFile(file, `claims/${claimId}`);

    // Determine file type
    const fileType = this.storageService.getFileType(file.mimetype);

    // Create attachment record
    const attachment = await this.prisma.claimAttachment.create({
      data: {
        claimId,
        fileUrl: uploadedFile.url,
        fileName: uploadedFile.fileName,
        fileSize: uploadedFile.fileSize,
        mimeType: uploadedFile.mimeType,
        fileType: fileType as FileType,
      },
    });

    // Create event
    await this.createEvent(
      claimId,
      userId,
      ClaimEventType.ATTACHMENT_ADDED,
      null,
      { attachmentId: attachment.id, fileName: attachment.fileName },
    );

    return attachment;
  }

  /**
   * Delete an attachment from a claim
   */
  async deleteAttachment(
    attachmentId: string,
    userId: string,
    companyId: string,
    userRole: UserRole,
  ): Promise<void> {
    // Find attachment with claim
    const attachment = await this.prisma.claimAttachment.findUnique({
      where: { id: attachmentId },
      include: {
        claim: {
          select: { id: true, companyId: true, reporterUserId: true },
        },
      },
    });

    if (!attachment || attachment.claim.companyId !== companyId) {
      throw new NotFoundException('Anhang nicht gefunden');
    }

    // Only claim owner or admin can delete
    const canDelete =
      userRole === UserRole.COMPANY_ADMIN ||
      userRole === UserRole.BROKER ||
      userRole === UserRole.SUPERADMIN ||
      attachment.claim.reporterUserId === userId;

    if (!canDelete) {
      throw new ForbiddenException('Sie haben keine Berechtigung, diesen Anhang zu loeschen');
    }

    // Delete from storage
    await this.storageService.deleteFile(attachment.fileUrl);

    // Delete record
    await this.prisma.claimAttachment.delete({
      where: { id: attachmentId },
    });

    // Create event
    await this.createEvent(
      attachment.claimId,
      userId,
      ClaimEventType.ATTACHMENT_REMOVED,
      { attachmentId, fileName: attachment.fileName },
      null,
    );
  }

  /**
   * Get attachments for a claim
   */
  async getAttachments(claimId: string, companyId: string): Promise<ClaimAttachment[]> {
    // Verify claim belongs to company
    const claim = await this.prisma.claim.findFirst({
      where: { id: claimId, companyId },
      select: { id: true },
    });

    if (!claim) {
      throw new NotFoundException('Schaden nicht gefunden');
    }

    return this.prisma.claimAttachment.findMany({
      where: { claimId },
      orderBy: { createdAt: 'asc' },
    });
  }
}
