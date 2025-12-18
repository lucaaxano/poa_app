import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  NotFoundException,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ClaimsService, PaginatedClaims, ClaimDetail, EventWithUser, CommentWithUser } from './claims.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
import { CreateClaimDto, UpdateClaimDto, ClaimFilterDto, RejectClaimDto } from './dto/claim.dto';
import { CreateCommentDto } from './dto/comment.dto';
import { UserRole, Claim, ClaimAttachment } from '@poa/database';

@Controller('claims')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClaimsController {
  constructor(private readonly claimsService: ClaimsService) {}

  /**
   * GET /claims - List all claims for the company
   * Admins see all, Employees see only their own
   */
  @Get()
  async findAll(
    @Request() req: AuthenticatedRequest,
    @Query() filters: ClaimFilterDto,
  ): Promise<PaginatedClaims> {
    const { id: userId, companyId, role } = req.user;

    // Employees only see their own claims
    if (role === UserRole.EMPLOYEE) {
      return this.claimsService.findByUserId(userId, companyId!, filters);
    }

    // Admins and Brokers see all company claims
    return this.claimsService.findByCompanyId(companyId!, filters);
  }

  /**
   * GET /claims/next-number - Get the next claim number (for preview)
   */
  @Get('next-number')
  async getNextNumber(): Promise<{ claimNumber: string }> {
    const claimNumber = await this.claimsService.generateClaimNumber();
    return { claimNumber };
  }

  /**
   * GET /claims/:id - Get a single claim by ID
   */
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<ClaimDetail> {
    const { id: userId, companyId, role } = req.user;
    const claim = await this.claimsService.findById(id, companyId!);

    // Employees can only view their own claims
    if (
      role === UserRole.EMPLOYEE &&
      claim.reporter.id !== userId &&
      claim.driver?.id !== userId
    ) {
      // Return 404 instead of 403 to avoid information leakage
      throw new NotFoundException('Schaden nicht gefunden');
    }

    return claim;
  }

  /**
   * POST /claims - Create a new claim
   */
  @Post()
  async create(
    @Body() dto: CreateClaimDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<Claim> {
    const { id: userId, companyId } = req.user;
    return this.claimsService.create(dto, userId, companyId!);
  }

  /**
   * PATCH /claims/:id - Update an existing claim
   */
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateClaimDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<Claim> {
    const { id: userId, companyId, role } = req.user;
    return this.claimsService.update(id, dto, userId, companyId!, role);
  }

  /**
   * DELETE /claims/:id - Delete a draft claim
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<void> {
    const { id: userId, companyId, role } = req.user;
    await this.claimsService.delete(id, userId, companyId!, role);
  }

  /**
   * GET /claims/:id/events - Get claim event history
   */
  @Get(':id/events')
  async getEvents(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<EventWithUser[]> {
    return this.claimsService.getEvents(id, req.user.companyId!);
  }

  /**
   * POST /claims/:id/submit - Submit a draft claim
   */
  @Post(':id/submit')
  async submit(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<Claim> {
    const { id: userId, companyId } = req.user;
    return this.claimsService.submit(id, userId, companyId!);
  }

  /**
   * POST /claims/:id/approve - Approve a submitted claim (Admin only)
   */
  @Post(':id/approve')
  async approve(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<Claim> {
    const { id: userId, companyId, role } = req.user;
    return this.claimsService.approve(id, userId, companyId!, role);
  }

  /**
   * POST /claims/:id/reject - Reject a submitted claim (Admin only)
   */
  @Post(':id/reject')
  async reject(
    @Param('id') id: string,
    @Body() dto: RejectClaimDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<Claim> {
    const { id: userId, companyId, role } = req.user;
    return this.claimsService.reject(id, userId, companyId!, role, dto.rejectionReason);
  }

  /**
   * POST /claims/:id/send - Send approved claim to insurer (Admin only)
   */
  @Post(':id/send')
  async sendToInsurer(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<Claim> {
    const { id: userId, companyId, role } = req.user;
    return this.claimsService.sendToInsurer(id, userId, companyId!, role);
  }

  /**
   * GET /claims/:id/comments - Get comments for a claim
   */
  @Get(':id/comments')
  async getComments(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<CommentWithUser[]> {
    return this.claimsService.getComments(id, req.user.companyId!);
  }

  /**
   * POST /claims/:id/comments - Add a comment to a claim
   */
  @Post(':id/comments')
  async addComment(
    @Param('id') id: string,
    @Body() dto: CreateCommentDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<CommentWithUser> {
    const { id: userId, companyId } = req.user;
    return this.claimsService.addComment(id, userId, companyId!, dto.content);
  }

  /**
   * GET /claims/:id/attachments - Get attachments for a claim
   */
  @Get(':id/attachments')
  async getAttachments(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<ClaimAttachment[]> {
    return this.claimsService.getAttachments(id, req.user.companyId!);
  }

  /**
   * POST /claims/:id/attachments - Upload an attachment to a claim
   */
  @Post(':id/attachments')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAttachment(
    @Param('id') id: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 20 * 1024 * 1024 }), // 20 MB
          new FileTypeValidator({
            fileType: /^(image\/(jpeg|png|gif|webp)|video\/(mp4|webm|quicktime)|application\/pdf)$/,
          }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Request() req: AuthenticatedRequest,
  ): Promise<ClaimAttachment> {
    const { id: userId, companyId } = req.user;
    return this.claimsService.uploadAttachment(id, file, userId, companyId!);
  }

  /**
   * DELETE /claims/:id/attachments/:attachmentId - Delete an attachment
   */
  @Delete(':id/attachments/:attachmentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAttachment(
    @Param('attachmentId') attachmentId: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<void> {
    const { id: userId, companyId, role } = req.user;
    await this.claimsService.deleteAttachment(attachmentId, userId, companyId!, role);
  }
}
