import nodemailer from 'nodemailer'

// ── Transporter ───────────────────────────────────────────────────────────────
let _transporter = null
function getTransporter() {
  if (_transporter) return _transporter
  const user = process.env.GMAIL_USER
  const pass = process.env.GMAIL_PASS
  if (!user || !pass) {
    console.warn('[Email] GMAIL_USER or GMAIL_PASS not set — emails will be logged only')
    return null
  }
  _transporter = nodemailer.createTransport({ service: 'gmail', auth: { user, pass } })
  return _transporter
}

const FROM         = () => process.env.EMAIL_FROM || `ProYou <${process.env.GMAIL_USER}>`
const DASHBOARD    = () => process.env.FRONTEND_URL || 'http://localhost:5173'

// ── Shared HTML helpers ───────────────────────────────────────────────────────
const emailWrapper = (content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
</head>
<body style="margin:0;padding:24px 0;background:#0f0f1a;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:580px;margin:auto;">

    <!-- Header -->
    <div style="text-align:center;padding:28px 0 20px;">
      <span style="font-size:22px;font-weight:800;letter-spacing:-0.5px;color:#fff1e6;">
        Pro<span style="color:#22c55e;">You</span>
      </span>
      <p style="margin:6px 0 0;font-size:12px;color:rgba(255,241,230,0.4);letter-spacing:.08em;text-transform:uppercase;">
        AI Placement OS
      </p>
    </div>

    <!-- Card -->
    <div style="background:#1a1a2e;border-radius:16px;padding:36px 32px;border:1px solid rgba(255,255,255,0.07);">
      ${content}
    </div>

    <!-- Footer -->
    <div style="text-align:center;padding:24px 0;font-size:12px;color:rgba(255,241,230,0.3);">
      ProYou · AI-Powered Placement OS ·
      <a href="${DASHBOARD()}" style="color:#22c55e;text-decoration:none;">Open Dashboard</a>
    </div>

  </div>
</body>
</html>`

const btn = (href, text, color = '#22c55e', textColor = '#030027') =>
  `<a href="${href}" style="display:inline-block;margin-top:24px;padding:13px 30px;
    background:${color};color:${textColor};font-weight:700;font-size:15px;
    border-radius:8px;text-decoration:none;letter-spacing:-0.2px;">${text}</a>`

const divider = `<div style="height:1px;background:rgba(255,255,255,0.07);margin:24px 0;"></div>`

// ── Core send ─────────────────────────────────────────────────────────────────
async function sendMail(to, subject, html, text) {
  const transport = getTransporter()
  if (!transport) { console.log(`[Email] Would send "${subject}" → ${to}`); return }
  await transport.sendMail({ from: FROM(), to, subject, html, text })
  console.log(`[Email] ✅ Sent "${subject}" → ${to}`)
}

// ── 1. Weekly Digest ──────────────────────────────────────────────────────────
// Called by cron every Monday at 7 AM for all users
async function sendDigest(to, body, userName = 'Coder') {
  const dateLabel = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', month: 'long', day: 'numeric',
  })

  const content = `
    <p style="font-size:13px;color:#22c55e;font-weight:700;letter-spacing:.08em;text-transform:uppercase;margin:0 0 12px;">
      📊 Weekly Digest · ${dateLabel}
    </p>
    <h2 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#fff1e6;letter-spacing:-0.5px;">
      Your week in review, ${userName} 👋
    </h2>
    <p style="color:rgba(255,241,230,0.55);font-size:14px;margin:0 0 24px;line-height:1.6;">
      Here's your personalized AI-drafted placement summary.
    </p>
    ${divider}
    <div style="background:#0f0f1a;border-radius:12px;padding:20px 22px;border:1px solid rgba(255,255,255,0.05);">
      <pre style="white-space:pre-wrap;font-family:'Segoe UI',Arial,sans-serif;font-size:14px;
                  line-height:1.8;color:rgba(255,241,230,0.85);margin:0;">${body}</pre>
    </div>
    ${divider}
    <p style="font-size:13px;color:rgba(255,241,230,0.45);margin:0;line-height:1.7;">
      Keep the streak going! Every day of consistent practice brings you closer to your target company.
    </p>
    ${btn(DASHBOARD(), 'Open Dashboard →')}`

  await sendMail(
    to,
    `📊 ProYou Weekly Digest — ${dateLabel}`,
    emailWrapper(content),
    `Your ProYou weekly digest:\n\n${body}`
  )
}

// ── 2. Contest Reminder ───────────────────────────────────────────────────────
// Sent 24h before a contest to all users with emailNotifications: true
async function sendContestReminder(to, contest, userName = 'Coder') {
  const startIST = new Date(contest.startTime).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata', weekday: 'short',
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
  const platformColor = contest.platform === 'LeetCode' ? '#FFA116' : '#1F8ACB'

  const content = `
    <p style="font-size:13px;color:${platformColor};font-weight:700;letter-spacing:.08em;text-transform:uppercase;margin:0 0 12px;">
      ⭐ Contest Reminder · ${contest.platform}
    </p>
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#fff1e6;letter-spacing:-0.5px;">
      ${contest.name}
    </h2>
    <p style="color:rgba(255,241,230,0.55);font-size:14px;margin:0 0 24px;">
      Hey ${userName}, this contest starts in ~24 hours. Register now!
    </p>
    ${divider}
    <table style="width:100%;border-collapse:collapse;">
      ${[
        ['📅 Date & Time', startIST + ' IST'],
        ['⏱ Duration', contest.duration],
        ['🏆 Platform', contest.platform],
      ].map(([label, val]) => `
        <tr>
          <td style="padding:10px 0;font-size:13px;color:rgba(255,241,230,0.45);width:130px;">${label}</td>
          <td style="padding:10px 0;font-size:14px;color:#fff1e6;font-weight:600;">${val}</td>
        </tr>
        <tr><td colspan="2" style="height:1px;background:rgba(255,255,255,0.05);padding:0;"></td></tr>
      `).join('')}
    </table>
    ${btn(contest.url, 'Register Now →', platformColor, '#fff')}`

  await sendMail(
    to,
    `⭐ Contest in 24h: ${contest.name} (${contest.platform})`,
    emailWrapper(content),
    `Contest tomorrow: ${contest.name}\nStart: ${startIST} IST\nDuration: ${contest.duration}\nLink: ${contest.url}`
  )
}

// ── 3. Productivity Alert ─────────────────────────────────────────────────────
// Sent when activity drops >20% vs previous week
async function sendProductivityAlert(to, message, userName = 'Coder') {
  const lines = message.split('\n').filter(Boolean)

  const content = `
    <p style="font-size:13px;color:#f87171;font-weight:700;letter-spacing:.08em;text-transform:uppercase;margin:0 0 12px;">
      ⚠️ Productivity Alert
    </p>
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#fff1e6;letter-spacing:-0.5px;">
      Hey ${userName}, your activity dipped this week
    </h2>
    <p style="color:rgba(255,241,230,0.55);font-size:14px;margin:0 0 24px;">
      We noticed a drop in your coding consistency. Here's the breakdown:
    </p>
    ${divider}
    <div style="display:flex;flex-direction:column;gap:10px;">
      ${lines.map(line => `
        <div style="background:#0f0f1a;border-radius:10px;padding:14px 18px;
                    border-left:3px solid #f87171;font-size:14px;color:rgba(255,241,230,0.8);">
          ${line}
        </div>
      `).join('')}
    </div>
    ${divider}
    <p style="font-size:13px;color:rgba(255,241,230,0.45);margin:0;line-height:1.7;">
      Consistency beats intensity. Even 30 minutes a day keeps your streak alive.
    </p>
    ${btn(DASHBOARD(), 'Get Back on Track →', '#f87171', '#fff')}`

  await sendMail(
    to,
    '⚠️ ProYou: Your coding activity dropped this week',
    emailWrapper(content),
    `ProYou Productivity Alert:\n\n${message}`
  )
}

// ── 4. Password Reset ─────────────────────────────────────────────────────────
// Triggered by forgot-password flow — link expires in 15 min
async function sendPasswordReset(to, resetUrl) {
  const content = `
    <p style="font-size:13px;color:#22c55e;font-weight:700;letter-spacing:.08em;text-transform:uppercase;margin:0 0 12px;">
      🔑 Password Reset
    </p>
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#fff1e6;letter-spacing:-0.5px;">
      Reset your password
    </h2>
    <p style="color:rgba(255,241,230,0.55);font-size:14px;margin:0 0 6px;line-height:1.7;">
      We received a request to reset your ProYou password.
    </p>
    <p style="color:rgba(255,241,230,0.55);font-size:14px;margin:0 0 24px;line-height:1.7;">
      Click the button below — this link expires in <strong style="color:#fff1e6;">15 minutes</strong>.
    </p>
    ${divider}
    ${btn(resetUrl, 'Reset Password →')}
    ${divider}
    <p style="font-size:12px;color:rgba(255,241,230,0.3);margin:0;line-height:1.7;">
      If you didn't request a password reset, you can safely ignore this email.
      Your password will not be changed.
    </p>`

  await sendMail(
    to,
    '🔑 ProYou — Reset your password',
    emailWrapper(content),
    `Reset your ProYou password: ${resetUrl}\n\nThis link expires in 15 minutes.`
  )
}

export { sendDigest, sendContestReminder, sendProductivityAlert, sendPasswordReset }
