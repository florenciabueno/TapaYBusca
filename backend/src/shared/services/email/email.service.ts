import dns from 'node:dns';
import nodemailer from 'nodemailer';
import { config } from '../../../config/env.js';
import { buildPasswordResetEmail } from './templates/password-reset.email.js';

const dnsResolve4 = dns.promises.resolve4;

export interface SendPasswordResetEmailParams {
  to: string;
  resetUrl: string;
  expiresInMinutes: number;
}

function assertSmtpConfigured(): void {
  const smtp = config.smtp;
  if (!smtp.host) throw new Error('SMTP_HOST no configurado');
  if (!smtp.user) throw new Error('SMTP_USER no configurado');
  if (!smtp.pass) throw new Error('SMTP_PASS no configurado');
  if (!smtp.from) throw new Error('MAIL_FROM no configurado');
}

async function resolveSmtpHostIPv4(host: string): Promise<string> {
  const [first] = await dnsResolve4(host);
  return first ?? host;
}

export class EmailService {
  async sendPasswordResetEmail(params: SendPasswordResetEmailParams): Promise<void> {
    assertSmtpConfigured();

    const smtpHost = config.smtp.host!;
    const connectHost = await resolveSmtpHostIPv4(smtpHost);

    const transporter = nodemailer.createTransport({
      host: connectHost,
      port: config.smtp.port,
      secure: config.smtp.secure,
      auth: { user: config.smtp.user!, pass: config.smtp.pass! },
      tls: { servername: smtpHost },
    });

    const { subject, text, html } = buildPasswordResetEmail({
      resetUrl: params.resetUrl,
      expiresInMinutes: params.expiresInMinutes,
    });

    await transporter.sendMail({
      from: config.smtp.from,
      to: params.to,
      subject,
      text,
      html,
    });
  }
}
