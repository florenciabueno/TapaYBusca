import { Buffer } from 'node:buffer';
import { config, GMAIL_SEND_URL, GOOGLE_OAUTH_TOKEN_URL } from '../../../config/env.js';
import { buildPasswordResetEmail } from './templates/password-reset.email.js';

export interface SendPasswordResetEmailParams {
  to: string;
  resetUrl: string;
  expiresInMinutes: number;
}

interface MimeMessageParams {
  from: string;
  to: string;
  subject: string;
  html: string;
}

interface AccessTokenResponse {
  access_token?: string;
  expires_in?: number;
}

interface GmailErrorBody {
  error?: { message?: string } | string;
  error_description?: string;
}

const ACCESS_TOKEN_SAFETY_MARGIN_MS = 60 * 1000;
const DEFAULT_TOKEN_LIFETIME_SECONDS = 3500;

let cachedAccessToken: { token: string; expiresAt: number } | null = null;

function assertGmailConfigured(): void {
  if (!config.mailFrom) throw new Error('MAIL_FROM is not configured');
  if (!config.google.oauthClientId) throw new Error('GMAIL_OAUTH_CLIENT_ID is not configured');
  if (!config.google.oauthClientSecret) throw new Error('GMAIL_OAUTH_CLIENT_SECRET is not configured');
  if (!config.google.oauthRefreshToken) throw new Error('GMAIL_OAUTH_REFRESH_TOKEN is not configured');
}

async function readErrorDetail(response: Response, prefix: string): Promise<string> {
  let detail = response.statusText;
  const rawBody = await response.text().catch(() => '');
  if (rawBody) {
    try {
      const parsed = JSON.parse(rawBody) as GmailErrorBody;
      const errorField = parsed?.error;
      if (typeof errorField === 'string') detail = errorField;
      else if (errorField?.message) detail = errorField.message;
      else if (parsed?.error_description) detail = parsed.error_description;
      else detail = rawBody;
    } catch {
      detail = rawBody;
    }
  }
  return `${prefix} ${response.status}: ${detail}`;
}

async function fetchAccessToken(): Promise<string> {
  const body = new URLSearchParams({
    client_id: config.google.oauthClientId!,
    client_secret: config.google.oauthClientSecret!,
    refresh_token: config.google.oauthRefreshToken!,
    grant_type: 'refresh_token',
  });

  const response = await fetch(GOOGLE_OAUTH_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  if (!response.ok) {
    throw new Error(await readErrorDetail(response, 'Google OAuth'));
  }

  const data = (await response.json()) as AccessTokenResponse;
  if (!data.access_token) {
    throw new Error('Google OAuth: response did not include access_token');
  }

  const lifetimeSeconds = data.expires_in ?? DEFAULT_TOKEN_LIFETIME_SECONDS;
  cachedAccessToken = {
    token: data.access_token,
    expiresAt: Date.now() + lifetimeSeconds * 1000 - ACCESS_TOKEN_SAFETY_MARGIN_MS,
  };
  return data.access_token;
}

async function getAccessToken(): Promise<string> {
  if (cachedAccessToken && Date.now() < cachedAccessToken.expiresAt) {
    return cachedAccessToken.token;
  }
  return fetchAccessToken();
}

function encodeMimeWordUtf8(value: string): string {
  if (/^[\x20-\x7E]*$/.test(value)) return value;
  return `=?UTF-8?B?${Buffer.from(value, 'utf-8').toString('base64')}?=`;
}

function toBase64Url(input: string): string {
  return Buffer.from(input, 'utf-8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function buildRawMimeMessage(params: MimeMessageParams): string {
  const message = [
    `From: ${params.from}`,
    `To: ${params.to}`,
    `Subject: ${encodeMimeWordUtf8(params.subject)}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset="UTF-8"',
    '',
    params.html,
  ].join('\r\n');
  return toBase64Url(message);
}

export class EmailService {
  async sendPasswordResetEmail(params: SendPasswordResetEmailParams): Promise<void> {
    assertGmailConfigured();

    const { subject, html } = buildPasswordResetEmail({
      resetUrl: params.resetUrl,
      expiresInMinutes: params.expiresInMinutes,
    });

    const raw = buildRawMimeMessage({
      from: config.mailFrom!,
      to: params.to,
      subject,
      html,
    });

    const accessToken = await getAccessToken();
    const response = await fetch(GMAIL_SEND_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw }),
    });

    if (response.ok) return;

    if (response.status === 401) {
      cachedAccessToken = null;
    }
    throw new Error(await readErrorDetail(response, 'Gmail'));
  }
}
