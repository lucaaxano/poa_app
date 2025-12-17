import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Company } from '@poa/database';
import { UpdateCompanyDto } from './dto/company.dto';

export interface CompanyStats {
  totalClaims: number;
  totalVehicles: number;
  totalUsers: number;
  claimsByStatus: Record<string, number>;
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
}
