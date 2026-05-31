import express from 'express'
import Event   from '../models/Event.js'
import { requireAuth } from '../middleware/auth.js'

const router = express.Router()

// GET all events for current user
router.get('/', requireAuth, async (req, res) => {
  try {
    const events = await Event.find({ userId: req.userId }).sort({ date: 1 })
    res.json(events)
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// POST create event
router.post('/', requireAuth, async (req, res) => {
  try {
    const { title, date, type, note } = req.body
    if (!title || !date) return res.status(400).json({ message: 'title and date required' })
    const ev = await Event.create({ userId: req.userId, title, date, type: type || 'other', note: note || '' })
    res.status(201).json(ev)
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// PATCH update event
router.patch('/:id', requireAuth, async (req, res) => {
  try {
    const { title, date, type, note } = req.body
    const ev = await Event.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { $set: { ...(title && { title }), ...(date && { date }), ...(type && { type }), ...(note !== undefined && { note }) } },
      { new: true, runValidators: true }
    )
    if (!ev) return res.status(404).json({ message: 'Not found' })
    res.json(ev)
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// DELETE event by id
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const ev = await Event.findOneAndDelete({ _id: req.params.id, userId: req.userId })
    if (!ev) return res.status(404).json({ message: 'Not found' })
    res.json({ message: 'Deleted' })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

export default router