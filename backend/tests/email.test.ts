import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { buildPasswordResetEmail } from '../src/shared/services/email/templates/password-reset.email.js';

const envMock = {
  mailFrom: 'sender@example.com',
  google: {
    oauthClientId: 'client-id',
    oauthClientSecret: 'client-secret',
    oauthRefreshToken: 'refresh-token',
  },
};

vi.mock('../src/config/env.js', () => ({
  GOOGLE_OAUTH_TOKEN_URL: 'https://oauth.test/token',
  GMAIL_SEND_URL: 'https://gmail.test/send',
  get config() {
    return {
      mailFrom: envMock.mailFrom,
      google: envMock.google,
    };
  },
}));

type FetchResponseSpec = {
  ok: boolean;
  status?: number;
  statusText?: string;
  json?: unknown;
  text?: string;
};

function createFetchMock(responses: FetchResponseSpec[]) {
  let callIndex = 0;
  return vi.fn(async () => {
    const spec = responses[callIndex] ?? responses[responses.length - 1]!;
    callIndex += 1;
    return {
      ok: spec.ok,
      status: spec.status ?? (spec.ok ? 200 : 500),
      statusText: spec.statusText ?? (spec.ok ? 'OK' : 'Error'),
      json: async () => spec.json ?? {},
      text: async () => spec.text ?? JSON.stringify(spec.json ?? {}),
    };
  });
}

async function loadEmailService() {
  vi.resetModules();
  const module = await import('../src/shared/services/email/email.service.js');
  return module.EmailService;
}

describe('buildPasswordResetEmail', () => {
  it('builds subject, plain text and html with reset URL and expiry', () => {
    const resetUrl = 'https://app.example/reset-password/abc123';
    const content = buildPasswordResetEmail({ resetUrl, expiresInMinutes: 45 });

    expect(content.subject).toBe('Restablecer contraseña - Tapa y Busca');
    expect(content.text).toContain(resetUrl);
    expect(content.text).toContain('45 minutos');
    expect(content.html).toContain(resetUrl);
    expect(content.html).toContain('45 minutos');
    expect(content.html).toContain('Tapa y Busca');
  });
});

describe('EmailService', () => {
  const originalEnv = structuredClone(envMock);

  beforeEach(() => {
    Object.assign(envMock, structuredClone(originalEnv));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('throws when Gmail OAuth is not configured', async () => {
    envMock.mailFrom = undefined;
    const EmailService = await loadEmailService();
    const service = new EmailService();

    await expect(
      service.sendPasswordResetEmail({
        to: 'user@example.com',
        resetUrl: 'https://app.example/reset',
        expiresInMinutes: 60,
      })
    ).rejects.toThrow('MAIL_FROM is not configured');
  });

  it('sends password reset email when OAuth and Gmail succeed', async () => {
    const fetchMock = createFetchMock([
      { ok: true, json: { access_token: 'access-token', expires_in: 3600 } },
      { ok: true },
    ]);
    vi.stubGlobal('fetch', fetchMock);

    const EmailService = await loadEmailService();
    const service = new EmailService();

    await service.sendPasswordResetEmail({
      to: 'user@example.com',
      resetUrl: 'https://app.example/reset-password/token',
      expiresInMinutes: 30,
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0]?.[0]).toBe('https://oauth.test/token');
    expect(fetchMock.mock.calls[1]?.[0]).toBe('https://gmail.test/send');

    const gmailInit = fetchMock.mock.calls[1]?.[1] as RequestInit;
    expect(gmailInit.headers).toMatchObject({
      Authorization: 'Bearer access-token',
      'Content-Type': 'application/json',
    });

    const body = JSON.parse(String(gmailInit.body)) as { raw: string };
    expect(body.raw).toBeTruthy();
  });

  it('reuses cached OAuth access token across sends', async () => {
    const fetchMock = createFetchMock([
      { ok: true, json: { access_token: 'cached-token', expires_in: 3600 } },
      { ok: true },
      { ok: true },
    ]);
    vi.stubGlobal('fetch', fetchMock);

    const EmailService = await loadEmailService();
    const service = new EmailService();
    const params = {
      to: 'user@example.com',
      resetUrl: 'https://app.example/reset',
      expiresInMinutes: 15,
    };

    await service.sendPasswordResetEmail(params);
    await service.sendPasswordResetEmail(params);

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls.filter(([url]) => url === 'https://oauth.test/token')).toHaveLength(1);
  });

  it('throws with OAuth error detail when token exchange fails', async () => {
    vi.stubGlobal(
      'fetch',
      createFetchMock([
        {
          ok: false,
          status: 400,
          statusText: 'Bad Request',
          text: JSON.stringify({ error: 'invalid_grant', error_description: 'Token expired' }),
        },
      ])
    );

    const EmailService = await loadEmailService();
    const service = new EmailService();

    await expect(
      service.sendPasswordResetEmail({
        to: 'user@example.com',
        resetUrl: 'https://app.example/reset',
        expiresInMinutes: 60,
      })
    ).rejects.toThrow('Google OAuth 400: invalid_grant');
  });

  it('throws when OAuth response has no access_token', async () => {
    vi.stubGlobal(
      'fetch',
      createFetchMock([{ ok: true, json: { expires_in: 3600 } }])
    );

    const EmailService = await loadEmailService();
    const service = new EmailService();

    await expect(
      service.sendPasswordResetEmail({
        to: 'user@example.com',
        resetUrl: 'https://app.example/reset',
        expiresInMinutes: 60,
      })
    ).rejects.toThrow('Google OAuth: response did not include access_token');
  });

  it('clears cached token and throws when Gmail returns 401', async () => {
    const fetchMock = createFetchMock([
      { ok: true, json: { access_token: 'stale-token', expires_in: 3600 } },
      {
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        text: JSON.stringify({ error: { message: 'Invalid Credentials' } }),
      },
    ]);
    vi.stubGlobal('fetch', fetchMock);

    const EmailService = await loadEmailService();
    const service = new EmailService();

    await expect(
      service.sendPasswordResetEmail({
        to: 'user@example.com',
        resetUrl: 'https://app.example/reset',
        expiresInMinutes: 60,
      })
    ).rejects.toThrow('Gmail 401: Invalid Credentials');
  });

  it('encodes non-ASCII subject lines in the MIME payload', async () => {
    const fetchMock = createFetchMock([
      { ok: true, json: { access_token: 'access-token', expires_in: 3600 } },
      { ok: true },
    ]);
    vi.stubGlobal('fetch', fetchMock);

    const EmailService = await loadEmailService();
    const service = new EmailService();

    await service.sendPasswordResetEmail({
      to: 'user@example.com',
      resetUrl: 'https://app.example/reset',
      expiresInMinutes: 60,
    });

    const gmailInit = fetchMock.mock.calls[1]?.[1] as RequestInit;
    const body = JSON.parse(String(gmailInit.body)) as { raw: string };
    const decoded = Buffer.from(body.raw.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString(
      'utf-8'
    );
    expect(decoded).toContain('Subject: =?UTF-8?B?');
    expect(decoded).toContain('To: user@example.com');
  });
});
