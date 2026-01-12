import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { TwoFactorService } from './two-factor.service';
import { UserRole, User, Company } from '@poa/database';
import {
  LoginDto,
  RegisterDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  AcceptInvitationDto,
  InviteUserDto,
  ChangePasswordDto,
} from './dto/auth.dto';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface SanitizedUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  companyId: string | null;
  phone: string | null;
  position: string | null;
  isActive: boolean;
  emailVerifiedAt: Date | null;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthResponse {
  user: SanitizedUser;
  company: Company | null;
  tokens: AuthTokens;
}

export interface TwoFactorRequiredResponse {
  requires2FA: true;
  tempToken: string;
  userId: string;
}

export interface ProfileResponse {
  user: SanitizedUser;
  company: Company | null;
}

export interface InvitationResponse {
  id: string;
  email: string;
  role: UserRole;
  expiresAt: Date;
}

export interface InvitationListItem {
  id: string;
  email: string;
  role: UserRole;
  expiresAt: Date;
  createdAt: Date;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly appUrl: string;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private emailService: EmailService,
    private twoFactorService: TwoFactorService,
  ) {
    this.appUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');
  }

  async register(dto: RegisterDto): Promise<{ message: string; requiresVerification: boolean }> {
    // Check if email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('E-Mail ist bereits registriert');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(dto.password, 10);

    // Create company and admin user in a transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Create company
      const company = await tx.company.create({
        data: {
          name: dto.companyName,
          numVehicles: dto.numVehicles,
        },
      });

      // Create admin user with unverified email
      const user = await tx.user.create({
        data: {
          companyId: company.id,
          email: dto.email,
          passwordHash,
          firstName: dto.firstName,
          lastName: dto.lastName,
          role: UserRole.COMPANY_ADMIN,
          isActive: true,
          emailVerifiedAt: null, // Email must be verified before login
        },
      });

      return { company, user };
    });

    // Send verification email
    await this.sendVerificationEmail(result.user);

    return {
      message: 'Registrierung erfolgreich. Bitte bestätigen Sie Ihre E-Mail-Adresse.',
      requiresVerification: true,
    };
  }

  /**
   * Send email verification link to user
   */
  private async sendVerificationEmail(user: { id: string; email: string; firstName: string }): Promise<void> {
    // Generate verification token
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = await bcrypt.hash(token, 10);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Delete existing verification tokens for this user
    await this.prisma.emailVerification.deleteMany({
      where: { userId: user.id },
    });

    // Create new verification token
    await this.prisma.emailVerification.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    // Send verification email
    const verificationLink = `${this.appUrl}/verify-email?token=${token}`;
    const emailResult = await this.emailService.sendEmailVerification(
      user.email,
      verificationLink,
      user.firstName,
    );

    if (emailResult.success) {
      this.logger.log(`Verification email sent to ${user.email}`);
    } else {
      this.logger.error(`Failed to send verification email to ${user.email}: ${emailResult.error}`);
    }
  }

  /**
   * Verify email with token
   */
  async verifyEmail(token: string): Promise<{ message: string }> {
    // Find all verification tokens (including used ones to check if already verified)
    const verifications = await this.prisma.emailVerification.findMany({
      where: {
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
    });

    // Find matching token
    let matchedVerification = null;
    for (const verification of verifications) {
      const isMatch = await bcrypt.compare(token, verification.tokenHash);
      if (isMatch) {
        matchedVerification = verification;
        break;
      }
    }

    if (!matchedVerification) {
      throw new BadRequestException('Ungültiger oder abgelaufener Verifizierungslink');
    }

    // Check if the token was already used or user is already verified
    if (matchedVerification.usedAt || matchedVerification.user.emailVerifiedAt) {
      this.logger.log(`Email already verified for user ${matchedVerification.userId}`);
      return { message: 'E-Mail-Adresse wurde bereits bestätigt. Sie können sich anmelden.' };
    }

    // Update user and mark verification as used
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: matchedVerification.userId },
        data: { emailVerifiedAt: new Date() },
      }),
      this.prisma.emailVerification.update({
        where: { id: matchedVerification.id },
        data: { usedAt: new Date() },
      }),
    ]);

    this.logger.log(`Email verified for user ${matchedVerification.userId}`);

    return { message: 'E-Mail-Adresse erfolgreich bestätigt. Sie können sich jetzt anmelden.' };
  }

  /**
   * Resend verification email
   */
  async resendVerificationEmail(email: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return { message: 'Falls ein Konto mit dieser E-Mail existiert, wurde ein Verifizierungslink gesendet.' };
    }

    // Check if already verified
    if (user.emailVerifiedAt) {
      return { message: 'Diese E-Mail-Adresse ist bereits verifiziert.' };
    }

    // Check rate limiting (max 3 per hour)
    const recentVerifications = await this.prisma.emailVerification.count({
      where: {
        userId: user.id,
        createdAt: { gt: new Date(Date.now() - 60 * 60 * 1000) }, // Last hour
      },
    });

    if (recentVerifications >= 3) {
      throw new BadRequestException('Zu viele Anfragen. Bitte versuchen Sie es später erneut.');
    }

    // Send new verification email
    await this.sendVerificationEmail(user);

    return { message: 'Falls ein Konto mit dieser E-Mail existiert, wurde ein Verifizierungslink gesendet.' };
  }

  async login(dto: LoginDto): Promise<AuthResponse | TwoFactorRequiredResponse> {
    const startTime = Date.now();
    this.logger.log(`[LOGIN] Starting login for ${dto.email}`);

    const dbStartTime = Date.now();
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { company: true },
    });
    this.logger.log(`[LOGIN] DB query took ${Date.now() - dbStartTime}ms`);

    if (!user) {
      throw new UnauthorizedException('Ungueltige Anmeldedaten');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Konto ist deaktiviert');
    }

    const bcryptStartTime = Date.now();
    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    this.logger.log(`[LOGIN] bcrypt.compare took ${Date.now() - bcryptStartTime}ms`);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Ungueltige Anmeldedaten');
    }

    // Check if email is verified
    if (!user.emailVerifiedAt) {
      throw new UnauthorizedException('Bitte bestätigen Sie zuerst Ihre E-Mail-Adresse. Überprüfen Sie Ihren Posteingang oder fordern Sie einen neuen Verifizierungslink an.');
    }

    // Check if 2FA is enabled
    if (user.twoFactorEnabled) {
      // Generate a temporary token for 2FA validation
      const tempToken = this.jwtService.sign(
        { sub: user.id, purpose: '2fa-validation' },
        { expiresIn: '5m' }, // 5 minutes to complete 2FA
      );

      this.logger.log(`[LOGIN] 2FA required, total time: ${Date.now() - startTime}ms`);
      return {
        requires2FA: true,
        tempToken,
        userId: user.id,
      };
    }

    // Generate tokens and update last login in parallel for faster response
    const tokenStartTime = Date.now();
    const [tokens] = await Promise.all([
      this.generateTokens(user.id, user.role),
      this.prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      }),
    ]);
    this.logger.log(`[LOGIN] Token generation + lastLogin update took ${Date.now() - tokenStartTime}ms`);
    this.logger.log(`[LOGIN] Total login time: ${Date.now() - startTime}ms`);

    return {
      user: this.sanitizeUser(user),
      company: user.company,
      tokens,
    };
  }

  /**
   * Validate 2FA token and complete login
   */
  async validate2FA(tempToken: string, totpToken: string): Promise<AuthResponse> {
    // Verify temp token
    let payload: { sub: string; purpose: string };
    try {
      payload = this.jwtService.verify(tempToken);
    } catch {
      throw new UnauthorizedException('Sitzung abgelaufen. Bitte erneut anmelden.');
    }

    if (payload.purpose !== '2fa-validation') {
      throw new UnauthorizedException('Ungültiger Token');
    }

    const userId = payload.sub;

    // Validate TOTP token
    await this.twoFactorService.validateToken(userId, totpToken);

    // Get user with company
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { company: true },
    });

    if (!user) {
      throw new UnauthorizedException('Benutzer nicht gefunden');
    }

    // Generate tokens and update last login in parallel for faster response
    const [tokens] = await Promise.all([
      this.generateTokens(user.id, user.role),
      this.prisma.user.update({
        where: { id: userId },
        data: { lastLoginAt: new Date() },
      }),
    ]);

    this.logger.log(`User ${userId} completed 2FA login`);

    return {
      user: this.sanitizeUser(user),
      company: user.company,
      tokens,
    };
  }

  /**
   * Validate 2FA with backup code and complete login
   */
  async validate2FAWithBackupCode(tempToken: string, backupCode: string): Promise<AuthResponse> {
    // Verify temp token
    let payload: { sub: string; purpose: string };
    try {
      payload = this.jwtService.verify(tempToken);
    } catch {
      throw new UnauthorizedException('Sitzung abgelaufen. Bitte erneut anmelden.');
    }

    if (payload.purpose !== '2fa-validation') {
      throw new UnauthorizedException('Ungültiger Token');
    }

    const userId = payload.sub;

    // Use backup code
    await this.twoFactorService.useBackupCode(userId, backupCode);

    // Get user with company
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { company: true },
    });

    if (!user) {
      throw new UnauthorizedException('Benutzer nicht gefunden');
    }

    // Generate tokens and update last login in parallel for faster response
    const [tokens] = await Promise.all([
      this.generateTokens(user.id, user.role),
      this.prisma.user.update({
        where: { id: userId },
        data: { lastLoginAt: new Date() },
      }),
    ]);

    this.logger.log(`User ${userId} completed 2FA login with backup code`);

    return {
      user: this.sanitizeUser(user),
      company: user.company,
      tokens,
    };
  }

  async validateUser(userId: string): Promise<(User & { company: Company | null }) | null> {
    const startTime = Date.now();
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { company: true },
    });
    this.logger.log(`[VALIDATE_USER] DB query took ${Date.now() - startTime}ms`);

    if (!user || !user.isActive) {
      return null;
    }

    return user;
  }

  async getProfile(userId: string): Promise<ProfileResponse> {
    const startTime = Date.now();
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { company: true },
    });
    this.logger.log(`[GET_PROFILE] DB query took ${Date.now() - startTime}ms`);

    if (!user) {
      throw new UnauthorizedException('Benutzer nicht gefunden');
    }

    return {
      user: this.sanitizeUser(user),
      company: user.company,
    };
  }

  private async generateTokens(userId: string, role: UserRole): Promise<AuthTokens> {
    const payload = { sub: userId, role };

    const accessToken = this.jwtService.sign(payload);

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN') || '7d',
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  private sanitizeUser(user: User & { company?: Company | null }): SanitizedUser {
    const { passwordHash, avatarUrl, notificationSettings, ...sanitized } = user;
    return sanitized;
  }

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    try {
      const payload = this.jwtService.verify(refreshToken);
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        include: { company: true },
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedException('Ungültiger Token');
      }

      const tokens = await this.generateTokens(user.id, user.role);

      return {
        user: this.sanitizeUser(user),
        company: user.company,
        tokens,
      };
    } catch {
      throw new UnauthorizedException('Ungültiger oder abgelaufener Token');
    }
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return { message: 'Falls ein Konto mit dieser E-Mail existiert, wurde ein Link zum Zurücksetzen gesendet.' };
    }

    // Generate reset token
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = await bcrypt.hash(token, 10);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Delete existing reset tokens for this user
    await this.prisma.passwordReset.deleteMany({
      where: { userId: user.id },
    });

    // Create new reset token
    await this.prisma.passwordReset.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    // Send password reset email
    const resetLink = `${this.appUrl}/reset-password?token=${token}`;
    const emailResult = await this.emailService.sendPasswordResetEmail(
      user.email,
      resetLink,
      user.firstName,
    );

    if (emailResult.success) {
      this.logger.log(`Password reset email sent to ${user.email}`);
    } else {
      this.logger.error(`Failed to send password reset email to ${user.email}: ${emailResult.error}`);
    }

    return { message: 'Falls ein Konto mit dieser E-Mail existiert, wurde ein Link zum Zurücksetzen gesendet.' };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    // Find all non-expired reset tokens
    const resets = await this.prisma.passwordReset.findMany({
      where: {
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
    });

    // Find matching token
    let validReset = null;
    for (const reset of resets) {
      const isMatch = await bcrypt.compare(dto.token, reset.tokenHash);
      if (isMatch) {
        validReset = reset;
        break;
      }
    }

    if (!validReset) {
      throw new BadRequestException('Ungültiger oder abgelaufener Token');
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(dto.password, 10);

    // Update password and delete reset token
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: validReset.userId },
        data: { passwordHash },
      }),
      this.prisma.passwordReset.delete({
        where: { id: validReset.id },
      }),
    ]);

    return { message: 'Passwort wurde erfolgreich zurückgesetzt' };
  }

  async createInvitation(companyId: string, dto: InviteUserDto, invitedByUserId: string): Promise<InvitationResponse> {
    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    // Map role string to UserRole enum
    let role: UserRole;
    switch (dto.role) {
      case 'BROKER':
        role = UserRole.BROKER;
        break;
      case 'COMPANY_ADMIN':
        role = UserRole.COMPANY_ADMIN;
        break;
      default:
        role = UserRole.EMPLOYEE;
    }

    // Handle existing user case
    if (existingUser) {
      // If inviting as BROKER and user is already a BROKER, create broker request
      if (role === UserRole.BROKER && existingUser.role === UserRole.BROKER) {
        return this.createBrokerRequest(companyId, existingUser, invitedByUserId);
      }
      // User exists but with different role or not inviting as broker
      const roleDisplay = existingUser.role === UserRole.EMPLOYEE ? 'Mitarbeiter' :
                          existingUser.role === UserRole.COMPANY_ADMIN ? 'Firmen-Admin' :
                          existingUser.role === UserRole.BROKER ? 'Broker' : 'Superadmin';
      throw new ConflictException(`Diese Person ist bereits als ${roleDisplay} registriert`);
    }

    // Check for existing pending invitation
    const existingInvitation = await this.prisma.invitation.findFirst({
      where: {
        email: dto.email,
        companyId,
        acceptedAt: null,
        rejectedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (existingInvitation) {
      throw new ConflictException('Eine Einladung für diese E-Mail ist bereits ausstehend');
    }

    // Generate invitation token
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = await bcrypt.hash(token, 10);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const invitation = await this.prisma.invitation.create({
      data: {
        companyId,
        email: dto.email,
        role,
        tokenHash,
        invitedByUserId,
        expiresAt,
      },
    });

    // Get company and inviter info for email
    const [company, inviter] = await Promise.all([
      this.prisma.company.findUnique({ where: { id: companyId } }),
      this.prisma.user.findUnique({ where: { id: invitedByUserId } }),
    ]);

    // Send invitation email
    const invitationLink = `${this.appUrl}/accept-invitation?token=${token}`;
    const inviterName = inviter ? `${inviter.firstName} ${inviter.lastName}` : 'Ein Administrator';
    const companyName = company?.name || 'Unbekannte Firma';

    const emailResult = await this.emailService.sendInvitationEmail(
      dto.email,
      invitationLink,
      inviterName,
      companyName,
      role,
    );

    if (emailResult.success) {
      this.logger.log(`Invitation email sent to ${dto.email}`);
    } else {
      this.logger.error(`Failed to send invitation email to ${dto.email}: ${emailResult.error}`);
    }

    return {
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      expiresAt: invitation.expiresAt,
    };
  }

  /**
   * Create a broker request for an existing broker user
   */
  private async createBrokerRequest(companyId: string, existingBroker: any, invitedByUserId: string): Promise<InvitationResponse> {
    // Check if broker is already linked to this company
    const existingLink = await this.prisma.brokerCompanyLink.findUnique({
      where: {
        brokerUserId_companyId: {
          brokerUserId: existingBroker.id,
          companyId,
        },
      },
    });

    if (existingLink) {
      throw new ConflictException('Dieser Broker ist bereits mit Ihrer Firma verbunden');
    }

    // Check for existing pending broker request
    const existingRequest = await this.prisma.invitation.findFirst({
      where: {
        email: existingBroker.email,
        companyId,
        targetUserId: existingBroker.id,
        acceptedAt: null,
        rejectedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (existingRequest) {
      throw new ConflictException('Eine Anfrage an diesen Broker ist bereits ausstehend');
    }

    // Generate token (needed for schema but not used for existing users)
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = await bcrypt.hash(token, 10);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days for broker requests

    const invitation = await this.prisma.invitation.create({
      data: {
        companyId,
        email: existingBroker.email,
        role: UserRole.BROKER,
        tokenHash,
        invitedByUserId,
        targetUserId: existingBroker.id,
        expiresAt,
      },
    });

    // Get company and inviter info for email
    const [company, inviter] = await Promise.all([
      this.prisma.company.findUnique({ where: { id: companyId } }),
      this.prisma.user.findUnique({ where: { id: invitedByUserId } }),
    ]);

    const inviterName = inviter ? `${inviter.firstName} ${inviter.lastName}` : 'Ein Administrator';
    const companyName = company?.name || 'Unbekannte Firma';

    // Send broker request email
    const emailResult = await this.emailService.sendBrokerRequestEmail(
      existingBroker.email,
      existingBroker.firstName,
      inviterName,
      companyName,
      `${this.appUrl}/broker/requests`,
    );

    if (emailResult.success) {
      this.logger.log(`Broker request email sent to ${existingBroker.email}`);
    } else {
      this.logger.error(`Failed to send broker request email to ${existingBroker.email}: ${emailResult.error}`);
    }

    return {
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      expiresAt: invitation.expiresAt,
    };
  }

  async acceptInvitation(dto: AcceptInvitationDto): Promise<AuthResponse> {
    // Find all non-expired invitations
    const invitations = await this.prisma.invitation.findMany({
      where: {
        acceptedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: { company: true },
    });

    // Find matching invitation
    let validInvitation = null;
    for (const invitation of invitations) {
      const isMatch = await bcrypt.compare(dto.token, invitation.tokenHash);
      if (isMatch) {
        validInvitation = invitation;
        break;
      }
    }

    if (!validInvitation) {
      throw new BadRequestException('Ungültige oder abgelaufene Einladung');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(dto.password, 10);

    // Create user and mark invitation as accepted
    const result = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          companyId: validInvitation.companyId,
          email: validInvitation.email,
          passwordHash,
          firstName: dto.firstName,
          lastName: dto.lastName,
          role: validInvitation.role,
          isActive: true,
          emailVerifiedAt: new Date(),
        },
      });

      await tx.invitation.update({
        where: { id: validInvitation.id },
        data: { acceptedAt: new Date() },
      });

      // If broker, create broker-company link
      if (validInvitation.role === UserRole.BROKER) {
        await tx.brokerCompanyLink.create({
          data: {
            brokerUserId: user.id,
            companyId: validInvitation.companyId,
          },
        });
      }

      return user;
    });

    // Generate tokens
    const tokens = await this.generateTokens(result.id, result.role);

    return {
      user: this.sanitizeUser(result),
      company: validInvitation.company,
      tokens,
    };
  }

  async getInvitations(companyId: string) {
    return this.prisma.invitation.findMany({
      where: {
        companyId,
        acceptedAt: null,
        expiresAt: { gt: new Date() },
      },
      select: {
        id: true,
        email: true,
        role: true,
        expiresAt: true,
        createdAt: true,
        invitedBy: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async cancelInvitation(invitationId: string, companyId: string): Promise<{ message: string }> {
    const invitation = await this.prisma.invitation.findFirst({
      where: {
        id: invitationId,
        companyId,
        acceptedAt: null,
      },
    });

    if (!invitation) {
      throw new NotFoundException('Einladung nicht gefunden');
    }

    await this.prisma.invitation.delete({
      where: { id: invitationId },
    });

    return { message: 'Einladung wurde widerrufen' };
  }

  async changePassword(userId: string, dto: ChangePasswordDto): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('Benutzer nicht gefunden');
    }

    const isPasswordValid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!isPasswordValid) {
      throw new BadRequestException('Aktuelles Passwort ist falsch');
    }

    const newPasswordHash = await bcrypt.hash(dto.newPassword, 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });

    return { message: 'Passwort wurde erfolgreich geaendert' };
  }

  // ============================================
  // BROKER REQUEST METHODS
  // ============================================

  /**
   * Get pending broker requests for a broker user
   */
  async getBrokerRequests(brokerId: string) {
    return this.prisma.invitation.findMany({
      where: {
        targetUserId: brokerId,
        role: UserRole.BROKER,
        acceptedAt: null,
        rejectedAt: null,
        expiresAt: { gt: new Date() },
      },
      select: {
        id: true,
        email: true,
        createdAt: true,
        expiresAt: true,
        company: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
          },
        },
        invitedBy: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Accept a broker request (create BrokerCompanyLink)
   */
  async acceptBrokerRequest(requestId: string, brokerId: string): Promise<{ message: string }> {
    const request = await this.prisma.invitation.findFirst({
      where: {
        id: requestId,
        targetUserId: brokerId,
        role: UserRole.BROKER,
        acceptedAt: null,
        rejectedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: {
        company: true,
      },
    });

    if (!request) {
      throw new NotFoundException('Anfrage nicht gefunden oder bereits bearbeitet');
    }

    // Create broker-company link and mark invitation as accepted
    await this.prisma.$transaction([
      this.prisma.brokerCompanyLink.create({
        data: {
          brokerUserId: brokerId,
          companyId: request.companyId,
        },
      }),
      this.prisma.invitation.update({
        where: { id: requestId },
        data: { acceptedAt: new Date() },
      }),
    ]);

    this.logger.log(`Broker ${brokerId} accepted request from company ${request.company.name}`);

    return { message: `Sie sind jetzt als Broker für ${request.company.name} registriert` };
  }

  /**
   * Reject a broker request
   */
  async rejectBrokerRequest(requestId: string, brokerId: string): Promise<{ message: string }> {
    const request = await this.prisma.invitation.findFirst({
      where: {
        id: requestId,
        targetUserId: brokerId,
        role: UserRole.BROKER,
        acceptedAt: null,
        rejectedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: {
        company: true,
      },
    });

    if (!request) {
      throw new NotFoundException('Anfrage nicht gefunden oder bereits bearbeitet');
    }

    await this.prisma.invitation.update({
      where: { id: requestId },
      data: { rejectedAt: new Date() },
    });

    this.logger.log(`Broker ${brokerId} rejected request from company ${request.company.name}`);

    return { message: 'Anfrage wurde abgelehnt' };
  }

  /**
   * Get brokers linked to a company
   */
  async getCompanyBrokers(companyId: string) {
    const links = await this.prisma.brokerCompanyLink.findMany({
      where: { companyId },
      include: {
        broker: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            isActive: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return links.map((link) => ({
      id: link.broker.id,
      email: link.broker.email,
      firstName: link.broker.firstName,
      lastName: link.broker.lastName,
      avatarUrl: link.broker.avatarUrl,
      isActive: link.broker.isActive,
      linkedAt: link.createdAt,
    }));
  }

  /**
   * Remove a broker from a company
   */
  async removeBrokerFromCompany(brokerId: string, companyId: string): Promise<{ message: string }> {
    const link = await this.prisma.brokerCompanyLink.findUnique({
      where: {
        brokerUserId_companyId: {
          brokerUserId: brokerId,
          companyId,
        },
      },
    });

    if (!link) {
      throw new NotFoundException('Broker-Verbindung nicht gefunden');
    }

    await this.prisma.brokerCompanyLink.delete({
      where: {
        brokerUserId_companyId: {
          brokerUserId: brokerId,
          companyId,
        },
      },
    });

    this.logger.log(`Broker ${brokerId} removed from company ${companyId}`);

    return { message: 'Broker wurde entfernt' };
  }
}
