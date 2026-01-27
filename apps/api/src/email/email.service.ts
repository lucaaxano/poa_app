import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';
import { getEmailConfig, EmailConfig } from './email.config';

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  template: string;
  context: Record<string, unknown>;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

@Injectable()
export class EmailService implements OnModuleInit {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;
  private config: EmailConfig;
  private templates: Map<string, handlebars.TemplateDelegate> = new Map();
  private layoutTemplate: handlebars.TemplateDelegate | null = null;

  constructor(private configService: ConfigService) {
    this.config = getEmailConfig(configService);
  }

  async onModuleInit() {
    await this.initializeTransporter();
    this.loadTemplates();
  }

  private async initializeTransporter() {
    const transportOptions: nodemailer.TransportOptions = {
      host: this.config.host,
      port: this.config.port,
      secure: this.config.secure,
    } as nodemailer.TransportOptions;

    if (this.config.auth) {
      (transportOptions as any).auth = this.config.auth;
    }

    this.transporter = nodemailer.createTransport(transportOptions);

    try {
      await this.transporter.verify();
      this.logger.log(
        `Email transporter initialized: ${this.config.host}:${this.config.port}`,
      );
    } catch (error) {
      this.logger.warn(
        `Email transporter verification failed: ${error.message}. Emails may not be sent.`,
      );
    }
  }

  private loadTemplates() {
    const templatesDir = path.join(__dirname, 'templates');

    // Layout laden
    const layoutPath = path.join(templatesDir, 'layouts', 'base.hbs');
    if (fs.existsSync(layoutPath)) {
      const layoutSource = fs.readFileSync(layoutPath, 'utf-8');
      this.layoutTemplate = handlebars.compile(layoutSource);
      this.logger.log('Base layout template loaded');
    }

    // Alle Templates im Hauptverzeichnis laden
    if (fs.existsSync(templatesDir)) {
      const files = fs.readdirSync(templatesDir);
      for (const file of files) {
        if (file.endsWith('.hbs') && !fs.statSync(path.join(templatesDir, file)).isDirectory()) {
          const templateName = file.replace('.hbs', '');
          const templatePath = path.join(templatesDir, file);
          const templateSource = fs.readFileSync(templatePath, 'utf-8');
          this.templates.set(templateName, handlebars.compile(templateSource));
          this.logger.log(`Template loaded: ${templateName}`);
        }
      }
    }
  }

  private renderTemplate(
    templateName: string,
    context: Record<string, unknown>,
  ): string {
    const template = this.templates.get(templateName);
    if (!template) {
      throw new Error(`Template not found: ${templateName}`);
    }

    const content = template(context);

    // Wenn Layout vorhanden, Content einbetten
    if (this.layoutTemplate) {
      return this.layoutTemplate({
        ...context,
        content,
        year: new Date().getFullYear(),
      });
    }

    return content;
  }

  async sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
    try {
      const html = this.renderTemplate(options.template, options.context);

      const mailOptions: nodemailer.SendMailOptions = {
        from: `"${this.config.fromName}" <${this.config.from}>`,
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject,
        html,
        attachments: options.attachments,
      };

      const result = await this.transporter.sendMail(mailOptions);

      this.logger.log(
        `Email sent: ${options.subject} to ${options.to} (${result.messageId})`,
      );

      return {
        success: true,
        messageId: result.messageId,
      };
    } catch (error) {
      this.logger.error(
        `Failed to send email: ${options.subject} to ${options.to}`,
        error.stack,
      );

      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Hilfsmethoden für spezifische E-Mail-Typen

  async sendPasswordResetEmail(
    to: string,
    resetLink: string,
    userName: string,
  ): Promise<SendEmailResult> {
    return this.sendEmail({
      to,
      subject: 'Passwort zurücksetzen - POA',
      template: 'password-reset',
      context: {
        userName,
        resetLink,
        expiresIn: '1 Stunde',
      },
    });
  }

  async sendInvitationEmail(
    to: string,
    invitationLink: string,
    inviterName: string,
    companyName: string,
    role: string,
  ): Promise<SendEmailResult> {
    return this.sendEmail({
      to,
      subject: `Einladung zu ${companyName} - POA`,
      template: 'invitation',
      context: {
        inviterName,
        companyName,
        invitationLink,
        role: role === 'EMPLOYEE' ? 'Mitarbeiter' : 'Broker',
        expiresIn: '7 Tage',
      },
    });
  }

  async sendEmailVerification(
    to: string,
    verificationLink: string,
    userName: string,
  ): Promise<SendEmailResult> {
    return this.sendEmail({
      to,
      subject: 'E-Mail bestätigen - POA',
      template: 'email-verification',
      context: {
        userName,
        verificationLink,
      },
    });
  }

  async sendClaimToInsurer(
    to: string,
    subject: string,
    claimData: Record<string, unknown>,
    attachments?: Array<{
      filename: string;
      content: Buffer | string;
      contentType?: string;
    }>,
  ): Promise<SendEmailResult> {
    return this.sendEmail({
      to,
      subject,
      template: 'claim-to-insurer',
      context: claimData,
      attachments,
    });
  }

  async sendClaimNotification(
    to: string,
    type: 'submitted' | 'approved' | 'rejected',
    claimData: Record<string, unknown>,
  ): Promise<SendEmailResult> {
    const templates = {
      submitted: 'claim-submitted',
      approved: 'claim-approved',
      rejected: 'claim-rejected',
    };

    const subjects = {
      submitted: `Neuer Schaden eingegangen: ${claimData.claimNumber}`,
      approved: `Schaden freigegeben: ${claimData.claimNumber}`,
      rejected: `Schaden abgelehnt: ${claimData.claimNumber}`,
    };

    return this.sendEmail({
      to,
      subject: subjects[type],
      template: templates[type],
      context: claimData,
    });
  }

  async sendNewCommentNotification(
    to: string,
    claimData: Record<string, unknown>,
  ): Promise<SendEmailResult> {
    return this.sendEmail({
      to,
      subject: `Neuer Kommentar zu Schaden ${claimData.claimNumber}`,
      template: 'new-comment',
      context: claimData,
    });
  }

  async sendBrokerRequestEmail(
    to: string,
    brokerName: string,
    inviterName: string,
    companyName: string,
    requestsLink: string,
  ): Promise<SendEmailResult> {
    return this.sendEmail({
      to,
      subject: `Neue Broker-Anfrage von ${companyName} - POA`,
      template: 'broker-request',
      context: {
        brokerName,
        inviterName,
        companyName,
        requestsLink,
      },
    });
  }

  async sendInvitationAcceptedNotification(
    to: string,
    adminName: string,
    inviteeName: string,
    inviteeEmail: string,
    role: string,
    companyName: string,
    dashboardLink: string,
  ): Promise<SendEmailResult> {
    return this.sendEmail({
      to,
      subject: `Einladung angenommen: ${inviteeName} - POA`,
      template: 'invitation-accepted',
      context: {
        adminName,
        inviteeName,
        inviteeEmail,
        role: role === 'EMPLOYEE' ? 'Mitarbeiter' : 'Broker',
        companyName,
        dashboardLink,
      },
    });
  }
}
