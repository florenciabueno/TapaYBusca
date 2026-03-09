import nodemailer from 'nodemailer';
import { config } from '../../../config/env.js';
import { buildPasswordResetEmail } from './templates/password-reset.email.js';

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

export class EmailService {
  async sendPasswordResetEmail(params: SendPasswordResetEmailParams): Promise<void> {
    assertSmtpConfigured();

    const transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.secure,
      auth: { user: config.smtp.user!, pass: config.smtp.pass! },
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
