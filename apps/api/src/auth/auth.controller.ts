import {
  Controller,
  Post,
  Get,
  Delete,
  Patch,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { TwoFactorService } from './two-factor.service';
import {
  LoginDto,
  RegisterDto,
  RefreshTokenDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  AcceptInvitationDto,
  InviteUserDto,
  ChangePasswordDto,
} from './dto/auth.dto';
import {
  Enable2FADto,
  Validate2FADto,
  Disable2FADto,
  UseBackupCodeDto,
} from './dto/two-factor.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { AuthenticatedRequest } from './interfaces/authenticated-request.interface';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly twoFactorService: TwoFactorService,
  ) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('refresh')
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto.refreshToken);
  }

  @Post('forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  // ==========================================
  // Email Verification Endpoints
  // ==========================================

  @Post('verify-email')
  async verifyEmail(@Body() body: { token: string }) {
    return this.authService.verifyEmail(body.token);
  }

  @Post('resend-verification')
  async resendVerificationEmail(@Body() body: { email: string }) {
    return this.authService.resendVerificationEmail(body.email);
  }

  @Post('accept-invitation')
  async acceptInvitation(@Body() dto: AcceptInvitationDto) {
    return this.authService.acceptInvitation(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getProfile(@Request() req: AuthenticatedRequest) {
    return this.authService.getProfile(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('change-password')
  async changePassword(
    @Request() req: AuthenticatedRequest,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(req.user.id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('COMPANY_ADMIN', 'SUPERADMIN')
  @Post('invite')
  async inviteUser(@Request() req: AuthenticatedRequest, @Body() dto: InviteUserDto) {
    return this.authService.createInvitation(req.user.companyId!, dto, req.user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('COMPANY_ADMIN', 'SUPERADMIN')
  @Get('invitations')
  async getInvitations(@Request() req: AuthenticatedRequest) {
    return this.authService.getInvitations(req.user.companyId!);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('COMPANY_ADMIN', 'SUPERADMIN')
  @Delete('invitations/:id')
  async cancelInvitation(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.authService.cancelInvitation(id, req.user.companyId!);
  }

  // ==========================================
  // Broker Request Endpoints
  // ==========================================

  /**
   * Get pending broker requests for the current broker
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('BROKER')
  @Get('broker-requests')
  async getBrokerRequests(@Request() req: AuthenticatedRequest) {
    return this.authService.getBrokerRequests(req.user.id);
  }

  /**
   * Accept a broker request
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('BROKER')
  @Post('broker-requests/:id/accept')
  async acceptBrokerRequest(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.authService.acceptBrokerRequest(id, req.user.id);
  }

  /**
   * Reject a broker request
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('BROKER')
  @Post('broker-requests/:id/reject')
  async rejectBrokerRequest(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.authService.rejectBrokerRequest(id, req.user.id);
  }

  /**
   * Get brokers linked to the current company (for Company Admins)
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('COMPANY_ADMIN', 'SUPERADMIN')
  @Get('company-brokers')
  async getCompanyBrokers(@Request() req: AuthenticatedRequest) {
    return this.authService.getCompanyBrokers(req.user.companyId!);
  }

  /**
   * Remove a broker from the company
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('COMPANY_ADMIN', 'SUPERADMIN')
  @Delete('company-brokers/:id')
  async removeBrokerFromCompany(
    @Request() req: AuthenticatedRequest,
    @Param('id') brokerId: string,
  ) {
    return this.authService.removeBrokerFromCompany(brokerId, req.user.companyId!);
  }

  // ==========================================
  // Two-Factor Authentication (2FA) Endpoints
  // ==========================================

  /**
   * Get 2FA setup (QR code and secret)
   * Requires: Authenticated user without 2FA enabled
   */
  @UseGuards(JwtAuthGuard)
  @Get('2fa/setup')
  async get2FASetup(@Request() req: AuthenticatedRequest) {
    return this.twoFactorService.generateSetup(req.user.id);
  }

  /**
   * Enable 2FA after verifying token from authenticator app
   */
  @UseGuards(JwtAuthGuard)
  @Post('2fa/enable')
  async enable2FA(@Request() req: AuthenticatedRequest, @Body() dto: Enable2FADto) {
    await this.twoFactorService.enable(req.user.id, dto.token);
    return { success: true, message: '2FA wurde erfolgreich aktiviert' };
  }

  /**
   * Disable 2FA (requires password confirmation)
   */
  @UseGuards(JwtAuthGuard)
  @Post('2fa/disable')
  async disable2FA(@Request() req: AuthenticatedRequest, @Body() dto: Disable2FADto) {
    await this.twoFactorService.disable(req.user.id, dto.password);
    return { success: true, message: '2FA wurde deaktiviert' };
  }

  /**
   * Validate 2FA token during login
   */
  @Post('2fa/validate')
  async validate2FA(@Body() dto: Validate2FADto) {
    return this.authService.validate2FA(dto.tempToken, dto.token);
  }

  /**
   * Use backup code during login (when authenticator is not available)
   */
  @Post('2fa/backup')
  async useBackupCode(@Body() dto: UseBackupCodeDto) {
    return this.authService.validate2FAWithBackupCode(dto.tempToken, dto.backupCode);
  }

  /**
   * Get 2FA status for current user
   */
  @UseGuards(JwtAuthGuard)
  @Get('2fa/status')
  async get2FAStatus(@Request() req: AuthenticatedRequest) {
    const enabled = await this.twoFactorService.isTwoFactorEnabled(req.user.id);
    return { twoFactorEnabled: enabled };
  }

  /**
   * Regenerate backup codes (replaces existing ones)
   */
  @UseGuards(JwtAuthGuard)
  @Post('2fa/backup-codes')
  async regenerateBackupCodes(@Request() req: AuthenticatedRequest) {
    const codes = await this.twoFactorService.regenerateBackupCodes(req.user.id);
    return { backupCodes: codes };
  }
}
