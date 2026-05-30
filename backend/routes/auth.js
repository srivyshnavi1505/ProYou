import jwt     from 'jsonwebtoken'
import bcrypt  from 'bcryptjs'
import express from 'express'
import { OAuth2Client } from 'google-auth-library'
import User    from '../models/User.js'

const router = express.Router()
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

// ── Register ──────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body
    if (!email || !password) return res.status(400).json({ message: 'Email and password required' })

    const existing = await User.findOne({ email })
    if (existing) return res.status(409).json({ message: 'Email already registered' })

    const passwordHash = await bcrypt.hash(password, 10)
    const user = await User.create({ name, email, passwordHash, role: role || 'SWE' })

    const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' })
    res.json({ user: { id: user._id, name: user.name, email: user.email, role: user.role }, token })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// ── Login ─────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    const user = await User.findOne({ email })
    if (!user) return res.status(401).json({ message: 'Invalid credentials' })

    const ok = await user.comparePassword(password)
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' })

    const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' })
    res.json({ user: { id: user._id, name: user.name, email: user.email, role: user.role }, token })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// ── Get current user (validates JWT) ─────────────────────
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ message: 'No token' })

    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret')
    const user = await User.findById(decoded.id).select('-passwordHash')
    if (!user) return res.status(404).json({ message: 'User not found' })

    res.json({ user })
  } catch (err) { res.status(401).json({ message: 'Invalid or expired token' }) }
})

// ── Update profile settings ───────────────────────────────
router.patch('/profile', async (req, res) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ message: 'No token' })

    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret')

    const { githubUsername, leetcodeUsername, targetCompanies, emailNotifications, role } = req.body
    const updated = await User.findByIdAndUpdate(
      decoded.id,
      { $set: { githubUsername, leetcodeUsername, targetCompanies, emailNotifications, role } },
      { new: true, runValidators: true }
    ).select('-passwordHash')

    res.json({ user: updated })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// ── Google OAuth ─────────────────────────────────────────
router.post('/google', async (req, res) => {
  try {
    const { credential } = req.body
    if (!credential) return res.status(400).json({ message: 'Missing Google credential' })

    // Verify the ID token with Google
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    })
    const { sub: googleId, email, name, picture } = ticket.getPayload()

    // Find existing user or create one
    let user = await User.findOne({ $or: [{ googleId }, { email }] })

    if (user) {
      // Link Google ID if they previously registered with email/password
      if (!user.googleId) {
        user.googleId = googleId
        user.avatar   = picture
        await user.save()
      }
    } else {
      // New user — no password needed
      user = await User.create({ name, email, googleId, avatar: picture })
    }

    const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' })
    res.json({ user: { id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar }, token })
  } catch (err) {
    console.error('Google auth error:', err.message)
    res.status(401).json({ message: 'Google sign-in failed' })
  }
})

export default router
