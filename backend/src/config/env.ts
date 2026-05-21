import path from 'path';
import { fileURLToPath } from 'url';
import { config as dotenvConfig } from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPaths = [
  path.resolve(__dirname, '../../.env'),
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), 'backend', '.env'),
];
for (const envPath of envPaths) {
  const result = dotenvConfig({ path: envPath, override: true });
  if (result.parsed && Object.keys(result.parsed).length > 0) break;
}

/** Google OAuth2 token endpoint (exchanges refresh tokens for access tokens). */
export const GOOGLE_OAUTH_TOKEN_URL = 'https://oauth2.googleapis.com/token' as const;

/** Gmail API endpoint used to send messages on behalf of the authenticated user. */
export const GMAIL_SEND_URL = 'https://gmail.googleapis.com/gmail/v1/users/me/messages/send' as const;

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  apiBaseUrl: process.env.API_BASE_URL || null,
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'default-secret',
  jwtExpireIn: process.env.JWT_EXPIRE_IN || '24h',
  databaseUrl: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/mydb',

  frontendBaseUrl: process.env.FRONTEND_BASE_URL || 'http://localhost:5173',
  passwordResetTokenTtlMinutes: parseInt(process.env.PASSWORD_RESET_TOKEN_TTL_MINUTES || '60', 10),

  /**
   * Sender shown to recipients. The email part MUST equal the Gmail account
   * that issued the OAuth refresh token, otherwise Gmail rewrites or rejects.
   */
  mailFrom: process.env.MAIL_FROM,

  /** Gmail HTTPS API credentials (used instead of SMTP, which Render blocks). */
  google: {
    oauthClientId: process.env.GMAIL_OAUTH_CLIENT_ID,
    oauthClientSecret: process.env.GMAIL_OAUTH_CLIENT_SECRET,
    oauthRefreshToken: process.env.GMAIL_OAUTH_REFRESH_TOKEN,
  },
};
