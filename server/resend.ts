import { Resend } from 'resend';

let connectionSettings: any;

async function getCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? 'repl ' + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
    ? 'depl ' + process.env.WEB_REPL_RENEWAL
    : null;

  if (!xReplitToken) {
    throw new Error('X-Replit-Token not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=resend',
    {
      headers: {
        'Accept': 'application/json',
        'X-Replit-Token': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  if (!connectionSettings || (!connectionSettings.settings.api_key)) {
    throw new Error('Resend not connected');
  }
  return {
    apiKey: connectionSettings.settings.api_key,
    fromEmail: connectionSettings.settings.from_email
  };
}

export async function getUncachableResendClient() {
  const { apiKey, fromEmail } = await getCredentials();
  return {
    client: new Resend(apiKey),
    fromEmail
  };
}

export async function sendVerificationEmail(toEmail: string, displayName: string, token: string) {
  const { client, fromEmail } = await getUncachableResendClient();

  const verifyUrl = `https://${process.env.REPLIT_DEV_DOMAIN || 'trustgolf.replit.app'}/api/auth/verify?token=${token}`;

  await client.emails.send({
    from: fromEmail || 'Trust Golf <noreply@resend.dev>',
    to: toEmail,
    subject: 'Verify your Trust Golf account',
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 500px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="width: 60px; height: 60px; background: #1B5E20; border-radius: 16px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 12px;">
            <span style="font-size: 28px;">⛳</span>
          </div>
          <h1 style="color: #1B5E20; font-size: 24px; margin: 0;">Trust Golf</h1>
          <p style="color: #666; font-size: 12px; letter-spacing: 2px; margin: 4px 0 0;">BY DARKWAVE STUDIOS LLC</p>
        </div>
        <h2 style="color: #333; font-size: 20px; text-align: center;">Welcome, ${displayName || 'Golfer'}!</h2>
        <p style="color: #555; font-size: 15px; line-height: 1.6; text-align: center;">
          Verify your email to unlock AI swing analysis, score tracking, and exclusive course deals.
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verifyUrl}" style="background: #1B5E20; color: #fff; padding: 14px 36px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 16px; display: inline-block;">
            Verify Email
          </a>
        </div>
        <p style="color: #999; font-size: 12px; text-align: center;">
          If you didn't create this account, you can safely ignore this email.
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
        <p style="color: #bbb; font-size: 11px; text-align: center;">
          &copy; 2026 DarkWave Studios LLC — darkwavestudios.io
        </p>
      </div>
    `,
  });
}
