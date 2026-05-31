/**
 * Email preview & send test
 * Usage:  node scripts/testEmail.js [type]
 *   types: digest | contest | productivity | reset | all (default: all)
 *
 * Run from: c:\DevProjects\ProYou\backend
 */

import 'dotenv/config'
import {
  sendDigest,
  sendContestReminder,
  sendProductivityAlert,
  sendPasswordReset,
} from '../services/emailService.js'

const to   = process.env.GMAIL_USER
const name = 'Sri Vyshnavi'   // your display name in test emails
const type = process.argv[2] || 'all'

if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
  console.error('❌ GMAIL_USER or GMAIL_PASS missing from .env')
  process.exit(1)
}

console.log(`\n📧  Sending [${type}] test email(s) → ${to}\n`)

const tests = {
  digest: async () => {
    await sendDigest(
      to,
      `You had a productive week! Here's your AI-generated placement summary:\n\n` +
      `→ GitHub: 12 commits across 4 repos this week. Streak: 6 days.\n` +
      `→ LeetCode: 8 problems solved (4E · 3M · 1H). Streak: 4 days.\n` +
      `→ Placement Score: 72/100 — Growing 📈\n\n` +
      `Key action for next week: Focus on medium-difficulty graph problems and try to push one project to GitHub.`,
      name
    )
    console.log('✅  Digest sent')
  },

  contest: async () => {
    await sendContestReminder(
      to,
      {
        name:      'LeetCode Weekly Contest 401',
        platform:  'LeetCode',
        startTime: new Date(Date.now() + 24 * 3600000).toISOString(),
        duration:  '90 min',
        url:       'https://leetcode.com/contest/',
      },
      name
    )
    console.log('✅  Contest reminder sent')
  },

  productivity: async () => {
    await sendProductivityAlert(
      to,
      `GitHub commits dropped from 15 → 3 (80% drop).\nLeetCode submissions dropped from 12 → 2 (83% drop).\nLog in to ProYou to get back on track! 🚀`,
      name
    )
    console.log('✅  Productivity alert sent')
  },

  reset: async () => {
    await sendPasswordReset(
      to,
      `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=test_token_12345`
    )
    console.log('✅  Password reset sent')
  },
}

try {
  if (type === 'all') {
    for (const [key, fn] of Object.entries(tests)) {
      console.log(`Sending: ${key}…`)
      await fn()
      await new Promise(r => setTimeout(r, 1000)) // small gap between sends
    }
    console.log('\n🎉  All 4 email types sent! Check your inbox.')
  } else if (tests[type]) {
    await tests[type]()
    console.log(`\n📬  Check your inbox at: ${to}`)
  } else {
    console.error(`❌  Unknown type "${type}". Use: digest | contest | productivity | reset | all`)
  }
} catch (err) {
  console.error('❌  Error:', err.message)
}
