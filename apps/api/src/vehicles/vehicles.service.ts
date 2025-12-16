import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class VehiclesService {
  constructor(private prisma: PrismaService) {}

  async findByCompanyId(companyId: string) {
    return this.prisma.vehicle.findMany({
      where: { companyId },
      orderBy: { licensePlate: 'asc' },
    });
  }

  async findById(id: string, companyId: string) {
    const vehicle = await this.prisma.vehicle.findFirst({
      where: { id, companyId },
    });

    if (!vehicle) {
      throw new NotFoundException('Fahrzeug nicht gefunden');
    }

    return vehicle;
  }
}
