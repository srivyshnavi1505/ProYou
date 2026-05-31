import express     from 'express'
import LinkedInLog from '../models/LinkedInLog.js'
import { requireAuth } from '../middleware/auth.js'

const router = express.Router()

// POST log a LinkedIn activity
router.post('/checkin', requireAuth, async (req, res) => {
  try {
    const { type, note } = req.body
    if (!type) return res.status(400).json({ message: 'type required' })
    const entry = await LinkedInLog.create({
      userId: req.userId,
      type,
      note: note || '',
      date: new Date().toISOString(),
    })
    res.status(201).json(entry)
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// GET last 30 entries
router.get('/log', requireAuth, async (req, res) => {
  try {
    const log = await LinkedInLog.find({ userId: req.userId }).sort({ createdAt: -1 }).limit(30)
    res.json(log)
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// GET streak computed from log
router.get('/streak', requireAuth, async (req, res) => {
  try {
    const log = await LinkedInLog.find({ userId: req.userId }).sort({ createdAt: -1 })
    const dates = [...new Set(log.map(l => l.date.split('T')[0]))].sort().reverse()
    let streak = 0
    let cur = new Date(); cur.setHours(0, 0, 0, 0)
    for (const d of dates) {
      const diff = Math.round((cur - new Date(d)) / 86400000)
      if (diff <= 1) { streak++; cur = new Date(d) }
      else break
    }
    res.json({ streak, totalEntries: log.length })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

export default router