import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole, Company } from '@poa/database';

export interface UserListItem {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  position: string | null;
  phone: string | null;
  isActive: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
}

export interface UserWithCompany {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  position: string | null;
  phone: string | null;
  isActive: boolean;
  companyId: string | null;
  company: Company | null;
}

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findByCompanyId(companyId: string): Promise<UserListItem[]> {
    return this.prisma.user.findMany({
      where: { companyId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        position: true,
        phone: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
      },
      orderBy: { lastName: 'asc' },
    });
  }

  async findById(id: string): Promise<UserWithCompany | null> {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        position: true,
        phone: true,
        isActive: true,
        companyId: true,
        company: true,
      },
    });
  }
}
