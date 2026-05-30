import express     from 'express'
import jwt         from 'jsonwebtoken'
import LinkedInLog from '../models/LinkedInLog.js'

const router = express.Router()

// Simple auth middleware
function auth(req, res, next) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ message: 'No token' })
  try {
    req.user = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET || 'secret')
    next()
  } catch { res.status(401).json({ message: 'Invalid token' }) }
}

// POST log a LinkedIn activity
router.post('/checkin', auth, async (req, res) => {
  try {
    const { type, note } = req.body
    if (!type) return res.status(400).json({ message: 'type required' })
    const entry = await LinkedInLog.create({
      userId: req.user.id,
      type,
      note: note || '',
      date: new Date().toISOString(),
    })
    res.status(201).json(entry)
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// GET last 30 entries
router.get('/log', auth, async (req, res) => {
  try {
    const log = await LinkedInLog.find({ userId: req.user.id }).sort({ createdAt: -1 }).limit(30)
    res.json(log)
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// GET streak computed from log
router.get('/streak', auth, async (req, res) => {
  try {
    const log = await LinkedInLog.find({ userId: req.user.id }).sort({ createdAt: -1 })
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
