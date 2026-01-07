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
    this.appUrl = this.configService.get<string>('APP_URL', 'http://localhost:3000');
  }

  async register(dto: RegisterDto): Promise<AuthResponse> {
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

      // Create admin user
      const user = await tx.user.create({
        data: {
          companyId: company.id,
          email: dto.email,
          passwordHash,
          firstName: dto.firstName,
          lastName: dto.lastName,
          role: UserRole.COMPANY_ADMIN,
          isActive: true,
          // In production, set emailVerifiedAt to null and send verification email
          emailVerifiedAt: new Date(),
        },
      });

      return { company, user };
    });

    // Generate tokens
    const tokens = await this.generateTokens(result.user.id, result.user.role);

    return {
      user: this.sanitizeUser(result.user),
      company: result.company,
      tokens,
    };
  }

  async login(dto: LoginDto): Promise<AuthResponse | TwoFactorRequiredResponse> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { company: true },
    });

    if (!user) {
      throw new UnauthorizedException('Ungueltige Anmeldedaten');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Konto ist deaktiviert');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Ungueltige Anmeldedaten');
    }

    // Check if 2FA is enabled
    if (user.twoFactorEnabled) {
      // Generate a temporary token for 2FA validation
      const tempToken = this.jwtService.sign(
        { sub: user.id, purpose: '2fa-validation' },
        { expiresIn: '5m' }, // 5 minutes to complete 2FA
      );

      return {
        requires2FA: true,
        tempToken,
        userId: user.id,
      };
    }

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.role);

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

    // Update last login
    await this.prisma.user.update({
      where: { id: userId },
      data: { lastLoginAt: new Date() },
    });

    // Generate full tokens
    const tokens = await this.generateTokens(user.id, user.role);

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

    // Update last login
    await this.prisma.user.update({
      where: { id: userId },
      data: { lastLoginAt: new Date() },
    });

    // Generate full tokens
    const tokens = await this.generateTokens(user.id, user.role);

    this.logger.log(`User ${userId} completed 2FA login with backup code`);

    return {
      user: this.sanitizeUser(user),
      company: user.company,
      tokens,
    };
  }

  async validateUser(userId: string): Promise<(User & { company: Company | null }) | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { company: true },
    });

    if (!user || !user.isActive) {
      return null;
    }

    return user;
  }

  async getProfile(userId: string): Promise<ProfileResponse> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { company: true },
    });

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

    if (existingUser) {
      throw new ConflictException('Ein Benutzer mit dieser E-Mail existiert bereits');
    }

    // Check for existing pending invitation
    const existingInvitation = await this.prisma.invitation.findFirst({
      where: {
        email: dto.email,
        companyId,
        acceptedAt: null,
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
}
