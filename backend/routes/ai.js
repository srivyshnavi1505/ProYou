import express from 'express'
import {
  generatePlacementScore,
  generateWeeklyInsight,
  generateFlashcards,
  tutorResponse,
  generateEmailDigest,
} from '../services/aiService.js'
import { sendDigest } from '../services/emailService.js'
import { fetchGithubData }   from '../services/githubService.js'
import { fetchLeetcodeData } from '../services/leetcodeService.js'
import { requireAuth } from '../middleware/auth.js'
import User from '../models/User.js'
import LinkedInLog from '../models/LinkedInLog.js'

const router = express.Router()

router.use(requireAuth)

//Placement Score 
router.post('/score', async (req, res) => {
  try {
    // ── Server is the source of truth ─────────────────────────────────
    // Fetch the authenticated user's profile to get their *real* usernames
    // and role. Client-submitted stats (github, leetcode) are ignored.
    const user = await User.findById(req.userId)
      .select('githubUsername leetcodeUsername role targetCompanies')
      .lean()
    if (!user) return res.status(404).json({ message: 'User not found' })

    // Re-fetch real data server-side — never trust client payloads
    const [github, leetcode] = await Promise.all([
      user.githubUsername
        ? fetchGithubData(user.githubUsername).catch(() => null)
        : Promise.resolve(null),
      user.leetcodeUsername
        ? fetchLeetcodeData(user.leetcodeUsername).catch(() => null)
        : Promise.resolve(null),
    ])

    // Fetch LinkedIn activity count for this user to feed into score
    // LinkedInLog is imported at the top of the file
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const linkedinActivity = await LinkedInLog.countDocuments({
      userId: req.userId,
      createdAt: { $gte: thirtyDaysAgo }
    }).catch(() => null)

    const result = await generatePlacementScore({
      role:            user.role || 'SWE',
      github,
      leetcode,
      targetCompanies: user.targetCompanies || [],
      linkedinActivity,
    })

    User.findByIdAndUpdate(req.userId, {
      $set: {
        lastPlacementScore: {
          total:       result.total,
          breakdown:   result.breakdown,
          advice:      result.advice,
          dataWarning: result.dataWarning,
          generatedAt: new Date(),
        },
      },
    }).catch(err => console.warn('[AI] Could not persist score to DB:', err.message))

    res.json(result)
  } catch (err) {
    console.error('AI score error:', err.message)
    const status = err?.status === 429 ? 429 : 500
    res.status(status).json({ message: err.message })
  }
})


// ── Weekly Insight 
router.post('/insight', async (req, res) => {
  try {
    const insight = await generateWeeklyInsight(req.body)
    res.json({ insight })
  } catch (err) {
    const status = err?.status === 429 ? 429 : 500
    res.status(status).json({ message: err.message })
  }
})

// ── Flashcards ────────────────────────────────────────────────────────────────
router.post('/flashcards', async (req, res) => {
  try {
    const cards = await generateFlashcards(req.body)
    res.json(Array.isArray(cards) ? cards : [])
  } catch (err) {
    const status = err?.status === 429 ? 429 : 500
    res.status(status).json({ message: err.message })
  }
})

// ── AI Tutor ──────────────────────────────────────────────────────────────────
router.post('/tutor', async (req, res) => {
  try {
    const reply = await tutorResponse(req.body)
    res.json({ reply })
  } catch (err) {
    const status = err?.status === 429 ? 429 : 500
    res.status(status).json({ message: err.message })
  }
})

// ── Weekly Email Digest ───────────────────────────────────────────────────────
// SECURITY: Email is taken from the JWT (req.userEmail), NOT from the request
// body. This prevents authenticated users from using the endpoint as a
// spam/phishing relay by specifying an arbitrary recipient address.

router.post('/email-digest', async (req, res) => {
  try {
    const { user, github, leetcode, score, contests } = req.body
    const recipientEmail = req.userEmail  // from JWT — never trust req.body

    console.log('[Digest] Starting for email:', recipientEmail)
    
    const body = await generateEmailDigest({ user, github, leetcode, score, contests })
    console.log('[Digest] AI generated, sending email...')
    
    if (recipientEmail) {
      await sendDigest(recipientEmail, body)
      console.log('[Digest] Email sent!')
    }
    res.json({ message: 'Digest sent', body })
  } catch (err) {
    console.error('[Digest] ERROR:', err.message, err.stack)
    res.status(500).json({ message: err.message })
  }
})
export default router
