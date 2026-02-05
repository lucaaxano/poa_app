import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole, Company, Prisma } from '@poa/database';
import { UpdateUserDto } from './dto/user.dto';
import {
  NotificationSettingsDto,
  NotificationSettingsResponseDto,
  DEFAULT_NOTIFICATION_SETTINGS,
} from './dto/notification-settings.dto';

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
      throw new ForbiddenException('Die Rolle eines Superadmins kann nicht geändert werden');
    }

    // Only allow certain role changes
    const allowedRoles: UserRole[] = ['EMPLOYEE', 'COMPANY_ADMIN'];
    if (!allowedRoles.includes(role)) {
      throw new ForbiddenException('Diese Rollenänderung ist nicht erlaubt');
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
      throw new ForbiddenException('Ein Superadmin kann nicht gelöscht werden');
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
        `Der Benutzer kann nicht gelöscht werden, da ${claimsCount} Schaden/Schäden zugeordnet sind. Bitte deaktivieren Sie den Benutzer stattdessen.`,
      );
    }

    await this.prisma.user.delete({
      where: { id },
    });
  }

  /**
   * Get notification settings for a user
   */
  async getNotificationSettings(userId: string): Promise<NotificationSettingsResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { notificationSettings: true },
    });

    if (!user) {
      throw new NotFoundException('Benutzer nicht gefunden');
    }

    // Merge stored settings with defaults
    const storedSettings = (user.notificationSettings || {}) as Partial<NotificationSettingsResponseDto>;
    const storedEmail: Partial<NotificationSettingsResponseDto['email']> = storedSettings.email || {};

    return {
      email: {
        newClaim: storedEmail.newClaim ?? DEFAULT_NOTIFICATION_SETTINGS.email.newClaim,
        claimApproved: storedEmail.claimApproved ?? DEFAULT_NOTIFICATION_SETTINGS.email.claimApproved,
        claimRejected: storedEmail.claimRejected ?? DEFAULT_NOTIFICATION_SETTINGS.email.claimRejected,
        newComment: storedEmail.newComment ?? DEFAULT_NOTIFICATION_SETTINGS.email.newComment,
        invitation: storedEmail.invitation ?? DEFAULT_NOTIFICATION_SETTINGS.email.invitation,
      },
      digestMode: storedSettings.digestMode ?? DEFAULT_NOTIFICATION_SETTINGS.digestMode,
    };
  }

  /**
   * Update notification settings for a user
   */
  async updateNotificationSettings(
    userId: string,
    dto: NotificationSettingsDto,
  ): Promise<NotificationSettingsResponseDto> {
    // Get current settings
    const currentSettings = await this.getNotificationSettings(userId);

    // Merge with new settings
    const updatedSettings: NotificationSettingsResponseDto = {
      email: {
        newClaim: dto.email?.newClaim ?? currentSettings.email.newClaim,
        claimApproved: dto.email?.claimApproved ?? currentSettings.email.claimApproved,
        claimRejected: dto.email?.claimRejected ?? currentSettings.email.claimRejected,
        newComment: dto.email?.newComment ?? currentSettings.email.newComment,
        invitation: dto.email?.invitation ?? currentSettings.email.invitation,
      },
      digestMode: dto.digestMode ?? currentSettings.digestMode,
    };

    // Update in database
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        notificationSettings: updatedSettings as unknown as Prisma.InputJsonValue,
      },
    });

    return updatedSettings;
  }

  /**
   * Check if a user should receive email for a specific notification type
   */
  async shouldSendEmail(
    userId: string,
    notificationType: 'newClaim' | 'claimApproved' | 'claimRejected' | 'newComment' | 'invitation',
  ): Promise<boolean> {
    const settings = await this.getNotificationSettings(userId);

    // Check if digest mode is "none" - no emails at all
    if (settings.digestMode === 'none') {
      return false;
    }

    // Check specific email setting
    return settings.email[notificationType] ?? true;
  }
}
