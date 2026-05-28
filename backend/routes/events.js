const express = require('express')
const router  = express.Router()

// In-memory store — swap with PostgreSQL (events table) later
const events = []
let nextId = 1

router.get('/', (req, res) => {
  res.json(events.sort((a, b) => new Date(a.date) - new Date(b.date)))
})

router.post('/', (req, res) => {
  const { title, date, type, note } = req.body
  if (!title || !date) return res.status(400).json({ message: 'title and date required' })
  const ev = { id: nextId++, title, date, type: type || 'other', note: note || '', createdAt: new Date() }
  events.push(ev)
  res.status(201).json(ev)
})

router.delete('/:id', (req, res) => {
  const id = parseInt(req.params.id)
  const idx = events.findIndex(e => e.id === id)
  if (idx === -1) return res.status(404).json({ message: 'Not found' })
  events.splice(idx, 1)
  res.json({ message: 'Deleted' })
})

module.exports = router
