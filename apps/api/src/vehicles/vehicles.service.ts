import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Vehicle } from '@poa/database';
import { CreateVehicleDto, UpdateVehicleDto } from './dto/vehicle.dto';

@Injectable()
export class VehiclesService {
  constructor(private prisma: PrismaService) {}

  async findByCompanyId(companyId: string): Promise<Vehicle[]> {
    return this.prisma.vehicle.findMany({
      where: { companyId },
      orderBy: { licensePlate: 'asc' },
    });
  }

  async findById(id: string, companyId: string): Promise<Vehicle> {
    const vehicle = await this.prisma.vehicle.findFirst({
      where: { id, companyId },
    });

    if (!vehicle) {
      throw new NotFoundException('Fahrzeug nicht gefunden');
    }

    return vehicle;
  }

  async create(companyId: string, dto: CreateVehicleDto): Promise<Vehicle> {
    // Check for duplicate license plate within company
    const existing = await this.prisma.vehicle.findFirst({
      where: {
        companyId,
        licensePlate: dto.licensePlate,
      },
    });

    if (existing) {
      throw new ConflictException(
        `Ein Fahrzeug mit dem Kennzeichen ${dto.licensePlate} existiert bereits`,
      );
    }

    return this.prisma.vehicle.create({
      data: {
        companyId,
        licensePlate: dto.licensePlate,
        brand: dto.brand || null,
        model: dto.model || null,
        year: dto.year || null,
        vin: dto.vin || null,
        hsn: dto.hsn || null,
        tsn: dto.tsn || null,
        internalName: dto.internalName || null,
        vehicleType: dto.vehicleType || 'CAR',
        color: dto.color || null,
        isActive: true,
      },
    });
  }

  async update(
    id: string,
    companyId: string,
    dto: UpdateVehicleDto,
  ): Promise<Vehicle> {
    // Check if vehicle exists and belongs to company
    const vehicle = await this.findById(id, companyId);

    // If license plate is being changed, check for duplicates
    if (dto.licensePlate && dto.licensePlate !== vehicle.licensePlate) {
      const existing = await this.prisma.vehicle.findFirst({
        where: {
          companyId,
          licensePlate: dto.licensePlate,
          NOT: { id },
        },
      });

      if (existing) {
        throw new ConflictException(
          `Ein Fahrzeug mit dem Kennzeichen ${dto.licensePlate} existiert bereits`,
        );
      }
    }

    return this.prisma.vehicle.update({
      where: { id },
      data: {
        ...(dto.licensePlate !== undefined && { licensePlate: dto.licensePlate }),
        ...(dto.brand !== undefined && { brand: dto.brand || null }),
        ...(dto.model !== undefined && { model: dto.model || null }),
        ...(dto.year !== undefined && { year: dto.year || null }),
        ...(dto.vin !== undefined && { vin: dto.vin || null }),
        ...(dto.hsn !== undefined && { hsn: dto.hsn || null }),
        ...(dto.tsn !== undefined && { tsn: dto.tsn || null }),
        ...(dto.internalName !== undefined && { internalName: dto.internalName || null }),
        ...(dto.vehicleType !== undefined && { vehicleType: dto.vehicleType }),
        ...(dto.color !== undefined && { color: dto.color || null }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
  }

  async deactivate(id: string, companyId: string): Promise<Vehicle> {
    // Check if vehicle exists and belongs to company
    await this.findById(id, companyId);

    return this.prisma.vehicle.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async activate(id: string, companyId: string): Promise<Vehicle> {
    // Check if vehicle exists and belongs to company
    await this.findById(id, companyId);

    return this.prisma.vehicle.update({
      where: { id },
      data: { isActive: true },
    });
  }

  async delete(id: string, companyId: string): Promise<void> {
    // Check if vehicle exists and belongs to company
    const vehicle = await this.findById(id, companyId);

    // Check if vehicle has claims
    const claimsCount = await this.prisma.claim.count({
      where: { vehicleId: id },
    });

    if (claimsCount > 0) {
      throw new ConflictException(
        `Das Fahrzeug ${vehicle.licensePlate} kann nicht gelöscht werden, da ${claimsCount} Schaden/Schäden zugeordnet sind. Bitte deaktivieren Sie es stattdessen.`,
      );
    }

    await this.prisma.vehicle.delete({
      where: { id },
    });
  }
}
