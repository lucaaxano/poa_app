import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Insurer } from '@poa/database';

@Injectable()
export class InsurersService {
  constructor(private prisma: PrismaService) {}

  async findAll(): Promise<Insurer[]> {
    return this.prisma.insurer.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string): Promise<Insurer | null> {
    return this.prisma.insurer.findUnique({
      where: { id },
    });
  }
}
