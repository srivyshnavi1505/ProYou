/**
 * ProYou Cron Scheduler
 *
 * All times are in IST (Asia/Kolkata) via the `timezone` option.
 * Three jobs:
 *   1. Daily 8 PM  — productivity drop check  (rolling 7-day GitHub + LeetCode)
 *   2. Monday 7 AM — weekly AI digest          (all users with emailNotifications)
 *   3. Daily 9 AM  — contest reminders 24h out (deduped per contest+date)
 */

import cron  from 'node-cron'
import User  from '../models/User.js'
import { fetchGithubData }               from '../services/githubService.js'
import { fetchLeetcodeData }             from '../services/leetcodeService.js'
import { fetchContests }                 from '../services/contestService.js'
import { generateEmailDigest, generatePlacementScore } from '../services/aiService.js'
import { sendDigest, sendContestReminder, sendProductivityAlert } from '../services/emailService.js'

const TIMEZONE    = 'Asia/Kolkata'
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || null

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Fire-and-forget admin alert on critical cron failures */
async function alertAdmin(jobName, err) {
  console.error(`[CRON][${jobName}] Error:`, err.message)
  if (ADMIN_EMAIL) {
    await sendProductivityAlert(
      ADMIN_EMAIL,
      `[CRON FAIL] ${jobName}: ${err.message}`
    ).catch(() => null)
  }
}

/** Count GitHub commits in the last N days from the contributions array */
function commitsInLastNDays(contributions = [], days = 7) {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)
  return contributions
    .filter(c => new Date(c.date) >= cutoff)
    .reduce((sum, c) => sum + c.count, 0)
}

/** Count LeetCode submissions in the last N days from the calendar array */
function lcSubmissionsInLastNDays(calendar = [], days = 7) {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)
  return calendar
    .filter(c => new Date(c.date) >= cutoff)
    .reduce((sum, c) => sum + c.count, 0)
}

// ── Job 1 — Daily 8 PM: Productivity Drop Check ───────────────────────────────
// Alert if activity this week is >20% below the prior week on GitHub OR LeetCode
cron.schedule('0 20 * * *', async () => {
  console.log('[CRON] Productivity check running…')
  try {
    const users = await User.find({ emailNotifications: true, email: { $exists: true, $ne: '' } })
      .select('email githubUsername leetcodeUsername')
      .lean()

    for (const u of users) {
      try {
        const [github, leetcode] = await Promise.all([
          u.githubUsername  ? fetchGithubData(u.githubUsername).catch(() => null)   : null,
          u.leetcodeUsername? fetchLeetcodeData(u.leetcodeUsername).catch(() => null): null,
        ])

        const ghThis  = commitsInLastNDays(github?.contributions,  7)
        const ghPrior = commitsInLastNDays(github?.contributions, 14) - ghThis
        const lcThis  = lcSubmissionsInLastNDays(leetcode?.calendar,  7)
        const lcPrior = lcSubmissionsInLastNDays(leetcode?.calendar, 14) - lcThis

        const ghDrop  = ghPrior  > 0 && ghThis  < ghPrior  * 0.8
        const lcDrop  = lcPrior  > 0 && lcThis  < lcPrior  * 0.8
        const noActivity = (ghThis === 0 && lcThis === 0)

        if (ghDrop || lcDrop || noActivity) {
          const lines = []
          if (noActivity)    lines.push('No GitHub commits or LeetCode submissions this week.')
          else {
            if (ghDrop) lines.push(`GitHub commits dropped from ${ghPrior} → ${ghThis} (${Math.round((1-ghThis/ghPrior)*100)}% drop).`)
            if (lcDrop) lines.push(`LeetCode submissions dropped from ${lcPrior} → ${lcThis} (${Math.round((1-lcThis/lcPrior)*100)}% drop).`)
          }
          lines.push('Log in to ProYou to get back on track! 🚀')

        await sendProductivityAlert(u.email, lines.join('\n'), u.name || 'Coder').catch(() => null)
          console.log(`[CRON] Productivity alert → ${u.email}`)
        }
      } catch (userErr) {
        console.warn(`[CRON] Productivity skip (${u.email}):`, userErr.message)
      }
    }
  } catch (err) { await alertAdmin('ProductivityCheck', err) }
}, { timezone: TIMEZONE })


// ── Job 2 — Monday 7 AM: Weekly Digest ────────────────────────────────────────
// Uses cached lastPlacementScore if <7 days old to avoid burning Groq quota
cron.schedule('0 7 * * 1', async () => {
  console.log('[CRON] Weekly digest running…')
  try {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    const users = await User.find({ emailNotifications: true, email: { $exists: true, $ne: '' } })
      .select('name email githubUsername leetcodeUsername role targetCompanies lastPlacementScore')
      .lean()

    // Fetch contests once — shared across all users
    let contests = []
    try { contests = await fetchContests() } catch { /* non-fatal */ }

    for (const u of users) {
      try {
        const [github, leetcode] = await Promise.all([
          u.githubUsername  ? fetchGithubData(u.githubUsername).catch(() => null)   : null,
          u.leetcodeUsername? fetchLeetcodeData(u.leetcodeUsername).catch(() => null): null,
        ])

        // Use cached score if it was generated within the last 7 days
        const cachedScore     = u.lastPlacementScore
        const cacheIsFresh    = cachedScore?.generatedAt && new Date(cachedScore.generatedAt) > weekAgo
        const score = cacheIsFresh
          ? cachedScore
          : await generatePlacementScore({
              role:            u.role || 'SWE',
              github,
              leetcode,
              targetCompanies: u.targetCompanies || [],
            }).catch(() => null)

        const body = await generateEmailDigest({
          user:     { name: u.name || 'ProYou User' },
          github,
          leetcode,
          score,
          contests: contests.slice(0, 3),
        })

        await sendDigest(u.email, body, u.name || 'Coder')
        console.log(`[CRON] Weekly digest → ${u.email}${cacheIsFresh ? ' (cached score)' : ''}`)
      } catch (userErr) {
        console.warn(`[CRON] Digest skip (${u.email}):`, userErr.message)
      }
    }
  } catch (err) { await alertAdmin('WeeklyDigest', err) }
}, { timezone: TIMEZONE })


// ── Job 3 — Daily 9 AM: Contest Reminders ─────────────────────────────────────
// Deduped per user+contest using an in-process Set (resets on server restart,
// which is acceptable — the 24h window means at most one fire per contest anyway)
const sentReminders = new Set()   // key: `${userId}:${contestName}:${dateStr}`

cron.schedule('0 9 * * *', async () => {
  console.log('[CRON] Contest reminder check…')
  try {
    let contests = []
    try { contests = await fetchContests() } catch { return }

    const upcoming = contests.filter(c => {
      const diffH = (new Date(c.startTime) - new Date()) / 3600000
      return diffH >= 20 && diffH <= 28
    })
    if (upcoming.length === 0) return

    const users = await User.find({ emailNotifications: true, email: { $exists: true, $ne: '' } })
      .select('email')
      .lean()

    for (const u of users) {
      for (const c of upcoming) {
        const dateStr = new Date(c.startTime).toISOString().split('T')[0]
        const key     = `${u._id}:${c.name}:${dateStr}`
        if (sentReminders.has(key)) continue

        await sendContestReminder(u.email, c, u.name || 'Coder').catch(() => null)
        sentReminders.add(key)
        console.log(`[CRON] Contest reminder → ${u.email} | ${c.name}`)
      }
    }
  } catch (err) { await alertAdmin('ContestReminders', err) }
}, { timezone: TIMEZONE })


console.log('✅ Cron jobs scheduled (IST): productivity (8PM daily), digest (Mon 7AM), contests (9AM daily)')
