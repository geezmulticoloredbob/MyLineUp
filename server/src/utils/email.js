const { Resend } = require('resend');
const env = require('../config/env');
const ApiError = require('./apiError');

const resend = env.resendApiKey ? new Resend(env.resendApiKey) : null;

function resetEmailHtml(resetUrl) {
  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2>Reset your MyLineUp password</h2>
      <p>We received a request to reset your password. This link expires in 30 minutes.</p>
      <p><a href="${resetUrl}" style="display:inline-block;padding:10px 20px;background:#111;color:#fff;border-radius:6px;text-decoration:none;">Reset password</a></p>
      <p>If you didn't request this, you can safely ignore this email — your password won't change.</p>
    </div>
  `;
}

// Sends the reset link by email via Resend. Falls back to logging the link to
// the server console when no RESEND_API_KEY is configured (e.g. local dev
// that hasn't set one up yet), so the flow still works end to end without a
// real provider. Tests mock this module directly rather than relying on the
// nodeEnv check, so nothing here needs to special-case NODE_ENV === 'test'.
async function sendPasswordResetEmail(to, resetUrl) {
  if (!resend) {
    console.log(`[email] RESEND_API_KEY not set — password reset link for ${to}: ${resetUrl}`);
    return;
  }

  const { error } = await resend.emails.send({
    from: env.emailFrom,
    to,
    subject: 'Reset your MyLineUp password',
    html: resetEmailHtml(resetUrl),
  });

  if (error) {
    console.error('Failed to send password reset email:', error);
    throw new ApiError(500, 'Failed to send the password reset email — please try again shortly');
  }
}

module.exports = { sendPasswordResetEmail };
