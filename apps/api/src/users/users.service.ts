import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole, Company } from '@poa/database';
import { UpdateUserDto } from './dto/user.dto';

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

  async findByIdAndCompany(id: string, companyId: string): Promise<UserListItem> {
    const user = await this.prisma.user.findFirst({
      where: { id, companyId },
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
    });

    if (!user) {
      throw new NotFoundException('Benutzer nicht gefunden');
    }

    return user;
  }

  async update(
    id: string,
    companyId: string,
    dto: UpdateUserDto,
  ): Promise<UserListItem> {
    // Verify user belongs to company
    await this.findByIdAndCompany(id, companyId);

    return this.prisma.user.update({
      where: { id },
      data: {
        ...(dto.firstName !== undefined && { firstName: dto.firstName }),
        ...(dto.lastName !== undefined && { lastName: dto.lastName }),
        ...(dto.phone !== undefined && { phone: dto.phone || null }),
        ...(dto.position !== undefined && { position: dto.position || null }),
      },
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
    });
  }

  async updateRole(
    id: string,
    companyId: string,
    role: UserRole,
  ): Promise<UserListItem> {
    // Verify user belongs to company
    const user = await this.findByIdAndCompany(id, companyId);

    // Prevent changing SUPERADMIN role
    if (user.role === 'SUPERADMIN') {
      throw new ForbiddenException('Die Rolle eines Superadmins kann nicht geaendert werden');
    }

    // Only allow certain role changes
    const allowedRoles: UserRole[] = ['EMPLOYEE', 'COMPANY_ADMIN'];
    if (!allowedRoles.includes(role)) {
      throw new ForbiddenException('Diese Rollenaenderung ist nicht erlaubt');
    }

    return this.prisma.user.update({
      where: { id },
      data: { role },
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
    });
  }

  async deactivate(id: string, companyId: string): Promise<UserListItem> {
    // Verify user belongs to company
    const user = await this.findByIdAndCompany(id, companyId);

    // Prevent deactivating SUPERADMIN
    if (user.role === 'SUPERADMIN') {
      throw new ForbiddenException('Ein Superadmin kann nicht deaktiviert werden');
    }

    return this.prisma.user.update({
      where: { id },
      data: { isActive: false },
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
    });
  }

  async reactivate(id: string, companyId: string): Promise<UserListItem> {
    // Verify user belongs to company
    await this.findByIdAndCompany(id, companyId);

    return this.prisma.user.update({
      where: { id },
      data: { isActive: true },
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
    });
  }

  async delete(id: string, companyId: string): Promise<void> {
    // Verify user belongs to company
    const user = await this.findByIdAndCompany(id, companyId);

    // Prevent deleting SUPERADMIN
    if (user.role === 'SUPERADMIN') {
      throw new ForbiddenException('Ein Superadmin kann nicht geloescht werden');
    }

    // Check if user has claims as reporter or driver
    const claimsCount = await this.prisma.claim.count({
      where: {
        OR: [
          { reporterUserId: id },
          { driverUserId: id },
        ],
      },
    });

    if (claimsCount > 0) {
      throw new ForbiddenException(
        `Der Benutzer kann nicht geloescht werden, da ${claimsCount} Schaden/Schaeden zugeordnet sind. Bitte deaktivieren Sie den Benutzer stattdessen.`,
      );
    }

    await this.prisma.user.delete({
      where: { id },
    });
  }
}
