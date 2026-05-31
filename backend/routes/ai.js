import express from 'express'
import {
  generatePlacementScore,
  generateWeeklyInsight,
  generateFlashcards,
  tutorResponse,
  generateEmailDigest,
} from '../services/aiService.js'
import { sendDigest } from '../services/emailService.js'
import { requireAuth } from '../middleware/auth.js'
import User from '../models/User.js'

const router = express.Router()

router.use(requireAuth)

//Placement Score 
router.post('/score', async (req, res) => {
  try {
    // Fetch LinkedIn activity count for this user to feed into score
    const LinkedInLog = (await import('../models/LinkedInLog.js')).default
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const linkedinActivity = await LinkedInLog.countDocuments({
      userId: req.userId,
      createdAt: { $gte: thirtyDaysAgo }
    }).catch(() => null)

    const result = await generatePlacementScore({ ...req.body, linkedinActivity })

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

router.post('/email-digest', async (req, res) => {
  try {
    const { user, github, leetcode, score, contests, email } = req.body
    console.log('[Digest] Starting for email:', email)
    
    const body = await generateEmailDigest({ user, github, leetcode, score, contests })
    console.log('[Digest] AI generated, sending email...')
    
    if (email) {
      await sendDigest(email, body)
      console.log('[Digest] Email sent!')
    }
    res.json({ message: 'Digest sent', body })
  } catch (err) {
    console.error('[Digest] ERROR:', err.message, err.stack)
    res.status(500).json({ message: err.message })
  }
})
export default router
