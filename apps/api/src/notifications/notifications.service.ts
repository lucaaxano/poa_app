import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationType, Notification, Prisma } from '@poa/database';
import { NotificationFilterDto, CreateNotificationDto } from './dto/notification.dto';

export interface NotificationListItem {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  data: unknown;
  readAt: Date | null;
  createdAt: Date;
}

export interface PaginatedNotifications {
  notifications: NotificationListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new notification for a user
   */
  async create(dto: CreateNotificationDto): Promise<Notification> {
    return this.prisma.notification.create({
      data: {
        userId: dto.userId,
        type: dto.type,
        title: dto.title,
        message: dto.message,
        data: dto.data ? (dto.data as Prisma.InputJsonValue) : Prisma.JsonNull,
      },
    });
  }

  /**
   * Create notifications for multiple users (e.g., all admins)
   */
  async createForUsers(
    userIds: string[],
    type: NotificationType,
    title: string,
    message: string,
    data?: Record<string, unknown>,
  ): Promise<number> {
    if (userIds.length === 0) return 0;

    const jsonData = data ? (data as Prisma.InputJsonValue) : Prisma.JsonNull;

    const result = await this.prisma.notification.createMany({
      data: userIds.map((userId) => ({
        userId,
        type,
        title,
        message,
        data: jsonData,
      })),
    });

    return result.count;
  }

  /**
   * Get notifications for a user with pagination and filters
   */
  async findByUserId(
    userId: string,
    filters: NotificationFilterDto = {},
  ): Promise<PaginatedNotifications> {
    const { type, unreadOnly, page = 1, limit = 20 } = filters;

    const where = {
      userId,
      ...(type && { type }),
      ...(unreadOnly && { readAt: null }),
    };

    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        select: {
          id: true,
          type: true,
          title: true,
          message: true,
          data: true,
          readAt: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.notification.count({ where }),
    ]);

    return {
      notifications,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get count of unread notifications for a user
   */
  async getUnreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: {
        userId,
        readAt: null,
      },
    });
  }

  /**
   * Mark a single notification as read
   */
  async markAsRead(id: string, userId: string): Promise<NotificationListItem> {
    // First verify the notification belongs to the user
    const notification = await this.prisma.notification.findFirst({
      where: { id, userId },
    });

    if (!notification) {
      throw new NotFoundException('Benachrichtigung nicht gefunden');
    }

    return this.prisma.notification.update({
      where: { id },
      data: { readAt: new Date() },
      select: {
        id: true,
        type: true,
        title: true,
        message: true,
        data: true,
        readAt: true,
        createdAt: true,
      },
    });
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<number> {
    const result = await this.prisma.notification.updateMany({
      where: {
        userId,
        readAt: null,
      },
      data: { readAt: new Date() },
    });

    return result.count;
  }

  /**
   * Delete a notification
   */
  async delete(id: string, userId: string): Promise<void> {
    // First verify the notification belongs to the user
    const notification = await this.prisma.notification.findFirst({
      where: { id, userId },
    });

    if (!notification) {
      throw new NotFoundException('Benachrichtigung nicht gefunden');
    }

    await this.prisma.notification.delete({
      where: { id },
    });
  }

  /**
   * Delete all read notifications older than specified days
   */
  async cleanupOldNotifications(daysOld: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await this.prisma.notification.deleteMany({
      where: {
        readAt: { not: null },
        createdAt: { lt: cutoffDate },
      },
    });

    return result.count;
  }
}
