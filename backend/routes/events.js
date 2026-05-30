import express from 'express'
import jwt     from 'jsonwebtoken'
import Event   from '../models/Event.js'

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

// GET all events for current user
router.get('/', auth, async (req, res) => {
  try {
    const events = await Event.find({ userId: req.user.id }).sort({ date: 1 })
    res.json(events)
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// POST create event
router.post('/', auth, async (req, res) => {
  try {
    const { title, date, type, note } = req.body
    if (!title || !date) return res.status(400).json({ message: 'title and date required' })
    const ev = await Event.create({ userId: req.user.id, title, date, type: type || 'other', note: note || '' })
    res.status(201).json(ev)
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// DELETE event by id
router.delete('/:id', auth, async (req, res) => {
  try {
    const ev = await Event.findOneAndDelete({ _id: req.params.id, userId: req.user.id })
    if (!ev) return res.status(404).json({ message: 'Not found' })
    res.json({ message: 'Deleted' })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

export default router
