import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Claim, Vehicle, ClaimAttachment, ClaimEvent, ClaimComment, Policy, Insurer } from '@poa/database';

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

export interface ClaimDetail extends Claim {
  vehicle: Vehicle;
  reporter: UserSummary;
  driver: UserSummary | null;
  policy: PolicyWithInsurer | null;
  attachments: ClaimAttachment[];
  events: ClaimEvent[];
  comments: CommentWithUser[];
}

@Injectable()
export class ClaimsService {
  constructor(private prisma: PrismaService) {}

  async findByCompanyId(companyId: string): Promise<ClaimListItem[]> {
    return this.prisma.claim.findMany({
      where: { companyId },
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
      orderBy: { createdAt: 'desc' },
    }) as Promise<ClaimListItem[]>;
  }

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
        attachments: true,
        events: {
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
}
