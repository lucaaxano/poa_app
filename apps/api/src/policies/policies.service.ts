import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Policy } from '@poa/database';
import { CreatePolicyDto, UpdatePolicyDto } from './dto/policy.dto';

export interface PolicyWithInsurer extends Policy {
  insurer: {
    id: string;
    name: string;
    claimsEmail: string;
  };
}

@Injectable()
export class PoliciesService {
  constructor(private prisma: PrismaService) {}

  async findByCompanyId(companyId: string): Promise<PolicyWithInsurer[]> {
    return this.prisma.policy.findMany({
      where: { companyId },
      include: {
        insurer: {
          select: {
            id: true,
            name: true,
            claimsEmail: true,
          },
        },
      },
      orderBy: { policyNumber: 'asc' },
    });
  }

  async findById(id: string, companyId: string): Promise<PolicyWithInsurer> {
    const policy = await this.prisma.policy.findFirst({
      where: { id, companyId },
      include: {
        insurer: {
          select: {
            id: true,
            name: true,
            claimsEmail: true,
          },
        },
      },
    });

    if (!policy) {
      throw new NotFoundException('Police nicht gefunden');
    }

    return policy;
  }

  async create(companyId: string, dto: CreatePolicyDto): Promise<PolicyWithInsurer> {
    // Check for duplicate policy number within company
    const existing = await this.prisma.policy.findFirst({
      where: {
        companyId,
        policyNumber: dto.policyNumber,
      },
    });

    if (existing) {
      throw new ConflictException(
        `Eine Police mit der Nummer ${dto.policyNumber} existiert bereits`,
      );
    }

    // Verify insurer exists
    const insurer = await this.prisma.insurer.findUnique({
      where: { id: dto.insurerId },
    });

    if (!insurer) {
      throw new NotFoundException('Versicherer nicht gefunden');
    }

    return this.prisma.policy.create({
      data: {
        companyId,
        insurerId: dto.insurerId,
        policyNumber: dto.policyNumber,
        coverageType: dto.coverageType || 'FLEET',
        pricingModel: dto.pricingModel || null,
        annualPremium: dto.annualPremium || null,
        deductible: dto.deductible || null,
        quotaThreshold: dto.quotaThreshold || null,
        validFrom: new Date(dto.validFrom),
        validTo: dto.validTo ? new Date(dto.validTo) : null,
        notes: dto.notes || null,
        isActive: true,
      },
      include: {
        insurer: {
          select: {
            id: true,
            name: true,
            claimsEmail: true,
          },
        },
      },
    });
  }

  async update(
    id: string,
    companyId: string,
    dto: UpdatePolicyDto,
  ): Promise<PolicyWithInsurer> {
    // Verify policy exists and belongs to company
    const policy = await this.findById(id, companyId);

    // If policy number is being changed, check for duplicates
    if (dto.policyNumber && dto.policyNumber !== policy.policyNumber) {
      const existing = await this.prisma.policy.findFirst({
        where: {
          companyId,
          policyNumber: dto.policyNumber,
          NOT: { id },
        },
      });

      if (existing) {
        throw new ConflictException(
          `Eine Police mit der Nummer ${dto.policyNumber} existiert bereits`,
        );
      }
    }

    // If insurer is being changed, verify it exists
    if (dto.insurerId) {
      const insurer = await this.prisma.insurer.findUnique({
        where: { id: dto.insurerId },
      });

      if (!insurer) {
        throw new NotFoundException('Versicherer nicht gefunden');
      }
    }

    return this.prisma.policy.update({
      where: { id },
      data: {
        ...(dto.insurerId !== undefined && { insurerId: dto.insurerId }),
        ...(dto.policyNumber !== undefined && { policyNumber: dto.policyNumber }),
        ...(dto.coverageType !== undefined && { coverageType: dto.coverageType }),
        ...(dto.pricingModel !== undefined && { pricingModel: dto.pricingModel || null }),
        ...(dto.annualPremium !== undefined && { annualPremium: dto.annualPremium || null }),
        ...(dto.deductible !== undefined && { deductible: dto.deductible || null }),
        ...(dto.quotaThreshold !== undefined && { quotaThreshold: dto.quotaThreshold || null }),
        ...(dto.validFrom !== undefined && { validFrom: new Date(dto.validFrom) }),
        ...(dto.validTo !== undefined && { validTo: dto.validTo ? new Date(dto.validTo) : null }),
        ...(dto.notes !== undefined && { notes: dto.notes || null }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
      include: {
        insurer: {
          select: {
            id: true,
            name: true,
            claimsEmail: true,
          },
        },
      },
    });
  }

  async deactivate(id: string, companyId: string): Promise<PolicyWithInsurer> {
    // Verify policy exists and belongs to company
    await this.findById(id, companyId);

    return this.prisma.policy.update({
      where: { id },
      data: { isActive: false },
      include: {
        insurer: {
          select: {
            id: true,
            name: true,
            claimsEmail: true,
          },
        },
      },
    });
  }
}
