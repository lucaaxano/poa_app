import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { authenticator } from 'otplib';
import * as QRCode from 'qrcode';
import * as crypto from 'crypto';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';

export interface TwoFactorSetupResult {
  secret: string;
  qrCodeDataUrl: string;
  backupCodes: string[];
}

@Injectable()
export class TwoFactorService {
  private readonly logger = new Logger(TwoFactorService.name);
  private readonly APP_NAME = 'POA Platform';

  constructor(private prisma: PrismaService) {
    // Configure TOTP settings
    authenticator.options = {
      digits: 6,
      step: 30, // 30 seconds
      window: 1, // Allow 1 step before/after for clock drift
    };
  }

  /**
   * Generate a new TOTP secret and QR code for 2FA setup
   */
  async generateSetup(userId: string): Promise<TwoFactorSetupResult> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, twoFactorEnabled: true },
    });

    if (!user) {
      throw new BadRequestException('Benutzer nicht gefunden');
    }

    if (user.twoFactorEnabled) {
      throw new BadRequestException('2FA ist bereits aktiviert');
    }

    // Generate secret
    const secret = authenticator.generateSecret();

    // Generate OTP Auth URL for QR code
    const otpAuthUrl = authenticator.keyuri(user.email, this.APP_NAME, secret);

    // Generate QR code as data URL
    const qrCodeDataUrl = await QRCode.toDataURL(otpAuthUrl);

    // Generate backup codes
    const backupCodes = this.generateBackupCodes();

    // Store secret and backup codes (not enabled yet)
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorSecret: secret,
        twoFactorBackupCodes: backupCodes.map((code) => bcrypt.hashSync(code, 10)),
      },
    });

    return {
      secret,
      qrCodeDataUrl,
      backupCodes,
    };
  }

  /**
   * Enable 2FA after user verifies with TOTP token
   */
  async enable(userId: string, token: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        twoFactorSecret: true,
        twoFactorEnabled: true,
      },
    });

    if (!user) {
      throw new BadRequestException('Benutzer nicht gefunden');
    }

    if (user.twoFactorEnabled) {
      throw new BadRequestException('2FA ist bereits aktiviert');
    }

    if (!user.twoFactorSecret) {
      throw new BadRequestException('2FA Setup wurde nicht gestartet');
    }

    // Verify token
    const isValid = authenticator.verify({
      token,
      secret: user.twoFactorSecret,
    });

    if (!isValid) {
      throw new UnauthorizedException('Ungültiger 2FA-Code');
    }

    // Enable 2FA
    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: true },
    });

    this.logger.log(`2FA enabled for user ${userId}`);
    return true;
  }

  /**
   * Disable 2FA for a user
   */
  async disable(userId: string, password: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        passwordHash: true,
        twoFactorEnabled: true,
      },
    });

    if (!user) {
      throw new BadRequestException('Benutzer nicht gefunden');
    }

    if (!user.twoFactorEnabled) {
      throw new BadRequestException('2FA ist nicht aktiviert');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Ungültiges Passwort');
    }

    // Disable 2FA and clear secrets
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorBackupCodes: [],
      },
    });

    this.logger.log(`2FA disabled for user ${userId}`);
    return true;
  }

  /**
   * Validate a TOTP token for login
   */
  async validateToken(userId: string, token: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        twoFactorSecret: true,
        twoFactorEnabled: true,
      },
    });

    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      throw new BadRequestException('2FA ist nicht aktiviert');
    }

    const isValid = authenticator.verify({
      token,
      secret: user.twoFactorSecret,
    });

    if (!isValid) {
      throw new UnauthorizedException('Ungültiger 2FA-Code');
    }

    return true;
  }

  /**
   * Use a backup code for login
   */
  async useBackupCode(userId: string, backupCode: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        twoFactorEnabled: true,
        twoFactorBackupCodes: true,
      },
    });

    if (!user || !user.twoFactorEnabled) {
      throw new BadRequestException('2FA ist nicht aktiviert');
    }

    // Check each hashed backup code
    let matchedIndex = -1;
    for (let i = 0; i < user.twoFactorBackupCodes.length; i++) {
      const isMatch = await bcrypt.compare(
        backupCode.toUpperCase(),
        user.twoFactorBackupCodes[i],
      );
      if (isMatch) {
        matchedIndex = i;
        break;
      }
    }

    if (matchedIndex === -1) {
      throw new UnauthorizedException('Ungültiger Backup-Code');
    }

    // Remove used backup code
    const updatedBackupCodes = [...user.twoFactorBackupCodes];
    updatedBackupCodes.splice(matchedIndex, 1);

    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorBackupCodes: updatedBackupCodes },
    });

    this.logger.log(`Backup code used for user ${userId}. ${updatedBackupCodes.length} codes remaining.`);
    return true;
  }

  /**
   * Generate new backup codes (replaces existing ones)
   */
  async regenerateBackupCodes(userId: string): Promise<string[]> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { twoFactorEnabled: true },
    });

    if (!user || !user.twoFactorEnabled) {
      throw new BadRequestException('2FA ist nicht aktiviert');
    }

    const backupCodes = this.generateBackupCodes();

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorBackupCodes: backupCodes.map((code) => bcrypt.hashSync(code, 10)),
      },
    });

    this.logger.log(`Backup codes regenerated for user ${userId}`);
    return backupCodes;
  }

  /**
   * Check if user has 2FA enabled
   */
  async isTwoFactorEnabled(userId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { twoFactorEnabled: true },
    });

    return user?.twoFactorEnabled ?? false;
  }

  /**
   * Generate 10 random backup codes
   */
  private generateBackupCodes(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < 10; i++) {
      // Generate 8-character alphanumeric code
      const code = crypto.randomBytes(4).toString('hex').toUpperCase();
      codes.push(code);
    }
    return codes;
  }
}
