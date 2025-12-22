import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
import { NotificationFilterDto } from './dto/notification.dto';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  /**
   * Get all notifications for the current user (paginated)
   * GET /notifications?page=1&limit=20&type=NEW_CLAIM&unreadOnly=true
   */
  @Get()
  async findAll(
    @Query() filters: NotificationFilterDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.notificationsService.findByUserId(req.user.id, filters);
  }

  /**
   * Get count of unread notifications
   * GET /notifications/unread-count
   */
  @Get('unread-count')
  async getUnreadCount(@Request() req: AuthenticatedRequest) {
    const count = await this.notificationsService.getUnreadCount(req.user.id);
    return { count };
  }

  /**
   * Mark a single notification as read
   * PATCH /notifications/:id/read
   */
  @Patch(':id/read')
  async markAsRead(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.notificationsService.markAsRead(id, req.user.id);
  }

  /**
   * Mark all notifications as read
   * POST /notifications/read-all
   */
  @Post('read-all')
  async markAllAsRead(@Request() req: AuthenticatedRequest) {
    const count = await this.notificationsService.markAllAsRead(req.user.id);
    return { success: true, count };
  }

  /**
   * Delete a notification
   * DELETE /notifications/:id
   */
  @Delete(':id')
  async delete(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    await this.notificationsService.delete(id, req.user.id);
    return { success: true };
  }
}
