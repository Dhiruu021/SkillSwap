import nodemailer from 'nodemailer';

const trim = (v) => (typeof v === 'string' ? v.trim() : v);

const user =
  trim(process.env.EMAIL_USER) ||
  trim(process.env.EMAIL_ADDRESS) ||
  trim(process.env.SMTP_USER) ||
  trim(process.env.MAIL_USERNAME);

const pass =
  trim(process.env.EMAIL_PASS) ||
  trim(process.env.EMAIL_PASS_KEY) ||
  trim(process.env.SMTP_PASS) ||
  trim(process.env.MAIL_PASSWORD);

const from =
  trim(process.env.EMAIL_FROM) || 'SkillSwap <no-reply@skillswap.com>';

const service = trim(process.env.EMAIL_SERVICE);

const host =
  trim(process.env.EMAIL_HOST) ||
  trim(process.env.SMTP_HOST) ||
  (service && String(service).toLowerCase() === 'gmail' ? 'smtp.gmail.com' : undefined);

const portRaw = process.env.EMAIL_PORT || process.env.SMTP_PORT;
const port = portRaw !== undefined && portRaw !== '' ? Number(portRaw) : host ? 587 : undefined;

const secureExplicit = process.env.EMAIL_SECURE ?? process.env.SMTP_SECURE;
const secure =
  secureExplicit === 'true' ||
  secureExplicit === '1' ||
  port === 465;

const hasEmailConfig = Boolean(user && pass && (service || host));

if (!hasEmailConfig) {
  console.warn(
    '[email] SMTP not configured. Set EMAIL_USER (or SMTP_USER) + EMAIL_PASS (or SMTP_PASS) and EMAIL_HOST (or SMTP_HOST), or EMAIL_SERVICE (e.g. Gmail) + credentials. Reset links will only appear in server logs (and in dev API response if enabled).'
  );
}

const createTransporter = () => {
  if (!hasEmailConfig) return null;

  if (service) {
    return nodemailer.createTransport({
      service,
      auth: { user, pass },
    });
  }

  const resolvedPort = Number.isFinite(port) ? port : 587;
  const useTlsStart = !secure && resolvedPort === 587;

  return nodemailer.createTransport({
    host,
    port: resolvedPort,
    secure,
    requireTLS: useTlsStart,
    auth: { user, pass },
  });
};

const transporter = createTransporter();

/**
 * @returns {{ sent: true } | { sent: false, reason: 'no_config' }}
 */
export const sendPasswordResetEmail = async ({ email, name, resetUrl }) => {
  const fromEmail = from || 'SkillSwap <no-reply@skillswap.com>';
  const text = `Hi ${name || 'there'},\n\nWe received a request to reset your SkillSwap password. Click the link below to set a new password:\n\n${resetUrl}\n\nIf you did not request this, you can ignore this email.\n\nThanks,\nSkillSwap Team`;
  const html = `
    <div style="font-family:Arial,sans-serif;color:#111;line-height:1.5;">
      <h2>SkillSwap Password Reset</h2>
      <p>Hi ${name || 'there'},</p>
      <p>We received a request to reset your password. Click the button below to create a new password.</p>
      <a href="${resetUrl}" style="display:inline-block;padding:12px 20px;background:#4f46e5;color:white;border-radius:8px;text-decoration:none;">Reset Password</a>
      <p style="margin-top:24px;">If you did not request this, you can safely ignore this message.</p>
      <p style="margin-top:12px;color:#6b7280;">SkillSwap Team</p>
    </div>
  `;

  if (!transporter) {
    console.warn('[email] Password reset link (no SMTP):', resetUrl);
    return { sent: false, reason: 'no_config' };
  }

  try {
    await transporter.sendMail({
      from: fromEmail,
      to: email,
      subject: 'SkillSwap Password Reset',
      text,
      html,
    });
    return { sent: true };
  } catch (error) {
    console.error('[email] Password reset send failed:', error?.message || error);
    const hint =
      String(error?.message || '').includes('Invalid login') ||
      String(error?.response || '').includes('535')
        ? ' Check EMAIL_USER / EMAIL_PASS (Gmail needs an App Password).'
        : '';
    throw new Error(`Unable to send reset email.${hint}`);
  }
};
