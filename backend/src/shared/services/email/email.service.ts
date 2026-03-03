import nodemailer from 'nodemailer';
import { config } from '../../../config/env.js';

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

    const subject = 'Restablecer contraseña';
    const text =
      `Recibimos una solicitud para restablecer tu contraseña.\n\n` +
      `Abre este enlace para crear una nueva contraseña (expira en ${params.expiresInMinutes} minutos):\n` +
      `${params.resetUrl}\n\n` +
      `Si no solicitaste este cambio, puedes ignorar este mensaje.`;

    const html = `
      <p>Recibimos una solicitud para restablecer tu contraseña.</p>
      <p>
        Abre este enlace para crear una nueva contraseña (expira en <b>${params.expiresInMinutes}</b> minutos):
      </p>
      <p><a href="${params.resetUrl}">${params.resetUrl}</a></p>
      <p>Si no solicitaste este cambio, puedes ignorar este mensaje.</p>
    `;

    await transporter.sendMail({
      from: config.smtp.from,
      to: params.to,
      subject,
      text,
      html,
    });
  }
}

