const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const express = require('express')
const router = express.Router()

// In-memory demo store — replace with PostgreSQL queries
const users = [
  { id: 1, name: 'Demo User', email: 'demo@poyou.app', passwordHash: bcrypt.hashSync('demo123', 10), role: 'SWE' }
]

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body
    if (!email || !password) return res.status(400).json({ message: 'Email and password required' })
    if (users.find(u => u.email === email)) return res.status(409).json({ message: 'Email already registered' })
    const passwordHash = await bcrypt.hash(password, 10)
    const user = { id: Date.now(), name, email, passwordHash, role: role || 'SWE' }
    users.push(user)
    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' })
    res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role }, token })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    const user = users.find(u => u.email === email)
    if (!user) return res.status(401).json({ message: 'Invalid credentials' })
    const ok = await bcrypt.compare(password, user.passwordHash)
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' })
    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' })
    res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role }, token })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

module.exports = router
