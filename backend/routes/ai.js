const express = require('express')
const router  = express.Router()
const {
  generatePlacementScore,
  generateWeeklyInsight,
  generateFlashcards,
  tutorResponse,
  generateEmailDigest,
} = require('../services/aiService')
const emailService = require('../services/emailService')

// Score
router.post('/score', async (req, res) => {
  try {
    const result = await generatePlacementScore(req.body)
    res.json(result)
  } catch (err) {
    console.error('AI score error:', err.message)
    res.status(500).json({ message: err.message })
  }
})

// Weekly insight
router.post('/insight', async (req, res) => {
  try {
    const insight = await generateWeeklyInsight(req.body)
    res.json({ insight })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Flashcards
router.post('/flashcards', async (req, res) => {
  try {
    const cards = await generateFlashcards(req.body)
    res.json(Array.isArray(cards) ? cards : [])
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// LeetCode AI tutor
router.post('/tutor', async (req, res) => {
  try {
    const reply = await tutorResponse(req.body)
    res.json({ reply })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Trigger weekly email digest
router.post('/email-digest', async (req, res) => {
  try {
    const { user, github, leetcode, score, contests, email } = req.body
    const body = await generateEmailDigest({ user, github, leetcode, score, contests })
    if (email) {
      await emailService.sendDigest(email, body)
    }
    res.json({ message: 'Digest sent', body })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router
