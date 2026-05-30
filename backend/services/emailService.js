import { Resend } from 'resend'

let resend = null
function getResend() {
  if (!resend && process.env.RESEND_API_KEY) {
    resend = new Resend(process.env.RESEND_API_KEY)
  }
  return resend
}

async function sendDigest(to, body) {
  const r = getResend()
  if (!r) {
    console.log('[Email] Resend not configured — would have sent:\n', body)
    return
  }
  await r.emails.send({
    from: process.env.EMAIL_FROM || 'ProYou <noreply@poyou.app>',
    to,
    subject: `ProYou Weekly Digest — ${new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'short', day: 'numeric' })}`,
    text: body,
    html: `<div style="font-family:sans-serif;max-width:600px;margin:auto;padding:32px;background:#030027;color:#fff1e6;border-radius:16px">
      <h2 style="color:#028090;margin-bottom:16px">📊 ProYou Weekly Digest</h2>
      <div style="background:#151e3f;border-radius:12px;padding:24px;border:1px solid rgba(254,200,154,0.15)">
        <pre style="white-space:pre-wrap;font-family:sans-serif;font-size:15px;line-height:1.7;color:#eddcd2">${body}</pre>
      </div>
      <p style="margin-top:24px;font-size:13px;color:rgba(237,220,210,0.5)">Sent by ProYou · <a href="http://localhost:5173" style="color:#028090">Open Dashboard</a></p>
    </div>`,
  })
}

async function sendContestReminder(to, contest) {
  const r = getResend()
  if (!r) { console.log('[Email] Contest reminder (no Resend):', contest.name); return }
  await r.emails.send({
    from: process.env.EMAIL_FROM || 'ProYou <noreply@poyou.app>',
    to,
    subject: `⭐ Contest in 24h: ${contest.name}`,
    html: `<div style="font-family:sans-serif;max-width:500px;margin:auto;padding:24px;background:#030027;color:#fff1e6;border-radius:12px">
      <h3 style="color:#1e88e5">Contest Tomorrow!</h3>
      <p style="color:#eddcd2;margin:12px 0"><strong>${contest.name}</strong></p>
      <p style="color:#eddcd2">Platform: ${contest.platform}</p>
      <p style="color:#eddcd2">Start: ${new Date(contest.startTime).toLocaleString()}</p>
      <p style="color:#eddcd2">Duration: ${contest.duration}</p>
      <a href="${contest.url}" style="display:inline-block;margin-top:16px;padding:10px 20px;background:#1e88e5;color:#fff;border-radius:8px;text-decoration:none">Register →</a>
    </div>`,
  })
}

async function sendProductivityAlert(to, message) {
  const r = getResend()
  if (!r) { console.log('[Email] Productivity alert (no Resend):', message); return }
  await r.emails.send({
    from: process.env.EMAIL_FROM || 'ProYou <noreply@poyou.app>',
    to,
    subject: '⚠️ ProYou: Productivity Alert',
    html: `<div style="font-family:sans-serif;max-width:500px;margin:auto;padding:24px;background:#030027;color:#fff1e6;border-radius:12px">
      <h3 style="color:#f4978e">Heads Up!</h3>
      <p style="color:#eddcd2;margin:12px 0">${message}</p>
      <a href="http://localhost:5173" style="display:inline-block;margin-top:16px;padding:10px 20px;background:#028090;color:#fff;border-radius:8px;text-decoration:none">Open Dashboard →</a>
    </div>`,
  })
}

export { sendDigest, sendContestReminder, sendProductivityAlert }
