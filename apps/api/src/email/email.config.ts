import { ConfigService } from '@nestjs/config';

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  } | null;
  from: string;
  fromName: string;
}

export const getEmailConfig = (configService: ConfigService): EmailConfig => {
  const provider = configService.get<string>('EMAIL_PROVIDER', 'smtp');

  if (provider === 'smtp') {
    const secureValue = configService.get<string>('SMTP_SECURE', 'false');
    const isSecure = secureValue === 'true' || secureValue === '1';

    return {
      host: configService.get<string>('SMTP_HOST', 'localhost'),
      port: configService.get<number>('SMTP_PORT', 1025),
      secure: isSecure,
      auth: configService.get<string>('SMTP_USER')
        ? {
            user: configService.get<string>('SMTP_USER', ''),
            pass: configService.get<string>('SMTP_PASS', ''),
          }
        : null,
      from: configService.get<string>('EMAIL_FROM', 'noreply@poa-local.dev'),
      fromName: configService.get<string>('EMAIL_FROM_NAME', 'POA System'),
    };
  }

  // Für Production mit Resend oder anderen Providern
  return {
    host: configService.get<string>('SMTP_HOST', 'smtp.resend.com'),
    port: configService.get<number>('SMTP_PORT', 465),
    secure: true,
    auth: {
      user: 'resend',
      pass: configService.get<string>('RESEND_API_KEY', ''),
    },
    from: configService.get<string>('EMAIL_FROM', 'noreply@poa-app.de'),
    fromName: configService.get<string>('EMAIL_FROM_NAME', 'POA System'),
  };
};
