export interface PasswordResetEmailParams {
  resetUrl: string;
  expiresInMinutes: number;
}

export interface PasswordResetEmailContent {
  subject: string;
  text: string;
  html: string;
}

const COLORS = {
  orange: '#FF8000',
  violet: '#6B4A8E',
  teal: '#219B9D',
  lightTealBg: '#B8E6E7',
  gray: '#EEEEEE',
  white: '#FFFFFF',
  text: '#334155',
  textMuted: '#475569',
} as const;

const FONT_FAMILY =
  "'Space Grotesk', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

export function buildPasswordResetEmail(params: PasswordResetEmailParams): PasswordResetEmailContent {
  const { resetUrl, expiresInMinutes } = params;

  const subject = 'Restablecer contraseña - Tapa y Busca';
  const text =
    `Recibimos una solicitud para restablecer tu contraseña.\n\n` +
    `Abre este enlace para crear una nueva contraseña (expira en ${expiresInMinutes} minutos):\n` +
    `${resetUrl}\n\n` +
    `Si no solicitaste este cambio, puedes ignorar este mensaje.`;

  const html = buildHtml(resetUrl, expiresInMinutes);

  return { subject, text, html };
}

function buildHtml(resetUrl: string, expiresInMinutes: number): string {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="x-apple-disable-message-reformatting" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <title>Restablecer contraseña</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
  <style type="text/css">
    @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap');
    :root { color-scheme: light only; }
    body { margin: 0; padding: 0; -webkit-text-size-adjust: 100%; text-size-adjust: 100%; font-family: ${FONT_FAMILY}; font-weight: 400; letter-spacing: 0.005em; color: ${COLORS.text}; background-color: ${COLORS.lightTealBg} !important; }
    table { border-collapse: collapse; mso-table-lspace: 0; mso-table-rspace: 0; }
    img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    a { color: ${COLORS.teal}; text-decoration: none; }
    .font-app { font-family: ${FONT_FAMILY}; letter-spacing: 0.005em; }
    #mail-body { background-color: ${COLORS.lightTealBg} !important; color: ${COLORS.text}; }
    @media only screen and (max-width: 520px) {
      .wrapper-padding { padding-left: 20px !important; padding-right: 20px !important; }
      .card-padding { padding: 24px 20px 32px !important; }
    }
  </style>
</head>
<body id="mail-body" style="margin: 0; padding: 0; background-color: ${COLORS.lightTealBg} !important; color: ${COLORS.text}; font-family: ${FONT_FAMILY}; font-weight: 400; letter-spacing: 0.005em; -webkit-font-smoothing: antialiased;" class="font-app">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: ${COLORS.lightTealBg} !important; min-height: 100vh;">
    <tr>
      <td align="center" style="padding: 32px 24px;" class="wrapper-padding">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 480px; margin: 0 auto; width: 100%;">
          <tr>
            <td style="background-color: ${COLORS.white}; border: 2px solid ${COLORS.teal}; border-radius: 16px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1); overflow: hidden;">
              <!-- Violet accent bar -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="height: 4px; background-color: ${COLORS.violet};"></td>
                </tr>
              </table>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="padding: 28px 28px 36px; letter-spacing: 0.005em;" class="card-padding">
                <p style="margin: 0 0 6px; font-size: 22px; font-weight: 700; color: ${COLORS.teal}; font-family: ${FONT_FAMILY}; letter-spacing: 0.01em;">
                  Tapa y Busca
                </p>
                <p style="margin: 0 0 20px; font-size: 12px; color: ${COLORS.textMuted}; font-family: ${FONT_FAMILY};">
                  Aplicación educativa de matemáticas
                </p>
                <p style="margin: 0 0 8px; font-size: 18px; font-weight: 600; color: ${COLORS.teal}; font-family: ${FONT_FAMILY};">
                  Restablecer contraseña
                </p>
                <p style="margin: 0 0 24px; font-size: 14px; color: ${COLORS.textMuted}; line-height: 1.55; font-family: ${FONT_FAMILY};">
                  Recibimos una solicitud para restablecer tu contraseña. El enlace expira en <strong style="color: ${COLORS.violet}; font-weight: 600;">${expiresInMinutes} minutos</strong>.
                </p>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td align="center" style="padding: 8px 0 24px;">
                      <a href="${resetUrl}" target="_blank" rel="noopener" style="display: inline-block; padding: 14px 28px; background-color: ${COLORS.orange}; color: ${COLORS.white}; font-size: 15px; font-weight: 600; font-family: ${FONT_FAMILY}; border-radius: 8px; text-decoration: none; box-shadow: 0 2px 8px rgba(255, 128, 0, 0.3);">
                        Crear nueva contraseña
                      </a>
                    </td>
                  </tr>
                </table>
                <p style="margin: 0; font-size: 13px; color: ${COLORS.textMuted}; line-height: 1.5; font-family: ${FONT_FAMILY};">
                  Si el botón no funciona, copiá y pegá este enlace en el navegador:
                </p>
                <p style="margin: 8px 0 0; font-size: 12px; word-break: break-all; font-family: ${FONT_FAMILY};">
                  <a href="${resetUrl}" style="color: ${COLORS.teal}; text-decoration: underline;">${resetUrl}</a>
                </p>
                <p style="margin: 24px 0 0; padding-top: 20px; border-top: 1px solid ${COLORS.gray}; font-size: 12px; color: ${COLORS.textMuted}; line-height: 1.5; font-family: ${FONT_FAMILY};">
                  Si no solicitaste este cambio, podés ignorar este mensaje. Tu contraseña no se modificará.
                </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 16px; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: ${COLORS.textMuted}; font-family: ${FONT_FAMILY};">
                Tapa y Busca
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
