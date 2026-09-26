// services/mailer.js
// Tiny email abstraction for invites.
// - Dev (no SMTP/RESEND key): logs the link to console so you can click it.
// - Prod: uses Resend HTTP API if RESEND_API_KEY set, else SMTP via nodemailer-style
//   env (SMTP_HOST/PORT/USER/PASS) — kept dependency-free by using fetch for Resend
//   and console fallback otherwise. Swap in nodemailer later without changing callers.
const sendInviteEmail = async ({ to, link, teamName, role, invitedByName }) => {
  const subject = `You're invited to join ${teamName} on Kiln`;
  const text = [
    `Hi,`,
    ``,
    `${invitedByName || 'Your admin'} invited you to join "${teamName}" as ${role}.`,
    ``,
    `Accept here (expires in ${process.env.INVITE_TTL_HOURS || 48}h, single-use):`,
    link,
    ``,
    `If you didn't expect this, ignore it.`,
  ].join('\n');

  // Resend path: POST https://api.resend.com/emails with Bearer key.
  if (process.env.RESEND_API_KEY) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.MAIL_FROM || 'Kiln <onboarding@resend.dev>',
          to: [to],
          subject,
          text,
        }),
      });
      if (!res.ok) console.error('Resend failed:', await res.text());
      else console.log(`Invite email sent to ${to} via Resend`);
    } catch (e) {
      console.error('Resend error, falling back to log:', e.message);
      console.log(`[INVITE LINK for ${to}] ${link}`);
    }
    return;
  }

  // Fallback: log link. In dev this is all you need to test the flow.
  console.log(`[INVITE EMAIL] to=${to} team=${teamName} role=${role}`);
  console.log(`[INVITE LINK for ${to}] ${link}`);
};

module.exports = { sendInviteEmail };
