import cron from 'node-cron'
import axios from 'axios'
import { generateEmailDigest, generatePlacementScore } from '../services/aiService.js'
import { sendDigest, sendContestReminder, sendProductivityAlert } from '../services/emailService.js'

// Simulated user store (in prod, pull from DB)
const getUserSettings = () => ({
  email: process.env.DEMO_EMAIL || null,
  githubUsername: process.env.DEMO_GITHUB || null,
  leetcodeUsername: process.env.DEMO_LEETCODE || null,
  role: 'SWE',
  targetCompanies: ['Google', 'Microsoft', 'Amazon'],
  emailNotifications: true,
})

// ── Every day at 8 PM — check productivity drop ─────────
cron.schedule('0 20 * * *', async () => {
  console.log('[CRON] Productivity check running...')
  try {
    const s = getUserSettings()
    if (!s.email || !s.emailNotifications) return

    if (s.githubUsername) {
      const r = await axios.get(`http://localhost:${process.env.PORT || 3001}/api/github/${s.githubUsername}`)
      const { streak } = r.data
      if (streak === 0) {
        const msg = await generateEmailDigest({ ...s, score: null, contests: [] }).catch(() => 'Your GitHub streak broke today. Get back on track! 💪')
        await sendProductivityAlert(s.email, `Your GitHub streak broke! ${msg}`)
        console.log('[CRON] Productivity alert sent to', s.email)
      }
    }
  } catch (err) { console.error('[CRON] Productivity check error:', err.message) }
})

// ── Every Monday at 7 AM — weekly digest ────────────────
cron.schedule('0 7 * * 1', async () => {
  console.log('[CRON] Weekly digest running...')
  try {
    const s = getUserSettings()
    if (!s.email || !s.emailNotifications) return

    let github = null, leetcode = null, contests = []
    const base = `http://localhost:${process.env.PORT || 3001}/api`

    if (s.githubUsername) {
      const r = await axios.get(`${base}/github/${s.githubUsername}`).catch(() => null)
      github = r?.data
    }
    if (s.leetcodeUsername) {
      const r = await axios.get(`${base}/leetcode/${s.leetcodeUsername}`).catch(() => null)
      leetcode = r?.data
    }
    const cr = await axios.get(`${base}/contests`).catch(() => null)
    contests = cr?.data?.slice(0, 3) || []

    const score = github || leetcode ? await generatePlacementScore({ role: s.role, github, leetcode }).catch(() => null) : null
    const body  = await generateEmailDigest({ user: { name: 'ProYou User' }, github, leetcode, score, contests })
    await sendDigest(s.email, body)
    console.log('[CRON] Weekly digest sent to', s.email)
  } catch (err) { console.error('[CRON] Digest error:', err.message) }
})

// ── Every day at 9 AM — contest reminders (24h ahead) ───
cron.schedule('0 9 * * *', async () => {
  console.log('[CRON] Contest reminder check...')
  try {
    const s = getUserSettings()
    if (!s.email || !s.emailNotifications) return

    const r = await axios.get(`http://localhost:${process.env.PORT || 3001}/api/contests`).catch(() => null)
    const contests = r?.data || []

    for (const c of contests) {
      const diffH = (new Date(c.startTime) - new Date()) / 3600000
      if (diffH >= 20 && diffH <= 28) {
        await sendContestReminder(s.email, c)
        console.log('[CRON] Contest reminder sent:', c.name)
      }
    }
  } catch (err) { console.error('[CRON] Contest reminder error:', err.message) }
})

console.log('✅ Cron jobs scheduled: productivity (8PM), digest (Mon 7AM), contests (9AM daily)')
