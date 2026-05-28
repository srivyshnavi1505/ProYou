const express = require('express')
const router  = express.Router()

// In-memory LinkedIn activity log — swap with DB later
const log = []

router.post('/checkin', (req, res) => {
  const { type, note } = req.body
  if (!type) return res.status(400).json({ message: 'type required' })
  const entry = { id: Date.now(), type, note: note || '', date: new Date().toISOString() }
  log.unshift(entry)
  res.status(201).json(entry)
})

router.get('/log', (req, res) => {
  res.json(log.slice(0, 30))
})

// Streak computed from log
router.get('/streak', (req, res) => {
  const dates = [...new Set(log.map(l => l.date.split('T')[0]))].sort().reverse()
  let streak = 0
  let cur = new Date()
  cur.setHours(0, 0, 0, 0)
  for (const d of dates) {
    const diff = Math.round((cur - new Date(d)) / 86400000)
    if (diff <= 1) { streak++; cur = new Date(d) }
    else break
  }
  res.json({ streak, totalEntries: log.length })
})

module.exports = router
