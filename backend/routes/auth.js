import jwt      from 'jsonwebtoken'
import bcrypt   from 'bcryptjs'
import crypto   from 'crypto'
import express  from 'express'
import axios    from 'axios'
import { OAuth2Client } from 'google-auth-library'
import User     from '../models/User.js'
import { sendPasswordReset } from '../services/emailService.js'
import { requireAuth } from '../middleware/auth.js'

const router       = express.Router()
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

const JWT_SECRET   = process.env.JWT_SECRET || 'change_me_in_production'
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'

// ── Regex constants ───────────────────────────────────────────────────────────
const GMAIL_REGEX    = /^[a-zA-Z0-9._%+\-]+@gmail\.com$/i
const USERNAME_REGEX = /^[a-zA-Z0-9_\-\.]{1,39}$/
const VALID_ROLES    = ['SWE', 'Backend', 'Full Stack', 'ML Engineer', 'PM', 'Data Analyst', 'DevOps', 'Frontend']

// ── Validation helpers ────────────────────────────────────────────────────────
function validateEmailPassword(email, password, requireMinLength = true) {
  if (!email || !password)             return 'Email and password are required'
  if (typeof email !== 'string' || email.length > 254)
                                       return 'Invalid email address'
  if (!GMAIL_REGEX.test(email))        return 'Only Gmail addresses (@gmail.com) are accepted'
  if (requireMinLength && password.length < 8)
                                       return 'Password must be at least 8 characters'
  if (requireMinLength && password.length > 128)
                                       return 'Password cannot exceed 128 characters'
  return null
}

function validateName(name) {
  if (!name?.trim())                   return 'Full name is required'
  if (name.trim().length < 2)          return 'Name must be at least 2 characters'
  if (name.trim().length > 60)         return 'Name cannot exceed 60 characters'
  return null
}

function validateUsername(value, field) {
  if (!value) return null  // optional
  if (typeof value !== 'string')       return `Invalid ${field}`
  if (value.length > 39)               return `${field} cannot exceed 39 characters`
  if (!USERNAME_REGEX.test(value))     return `Invalid ${field} — only letters, numbers, hyphens, underscores and dots allowed`
  return null
}

// ── Verify GitHub username exists ─────────────────────────────────────────────
async function verifyGithubUsername(username) {
  try {
    const headers = process.env.GITHUB_TOKEN
      ? { Authorization: `token ${process.env.GITHUB_TOKEN}` }
      : {}
    const r = await axios.get(`https://api.github.com/users/${username}`, { headers, timeout: 5000 })
    return r.status === 200
  } catch (err) {
    if (err.response?.status === 404) return false
    return true  // if GitHub API is down, don't block — assume valid
  }
}

// ── Verify LeetCode username exists ──────────────────────────────────────────
async function verifyLeetcodeUsername(username) {
  try {
    const r = await axios.post('https://leetcode.com/graphql', {
      query: `query { matchedUser(username: "${username}") { username } }`
    }, {
      headers: { 'Content-Type': 'application/json', Referer: 'https://leetcode.com' },
      timeout: 5000,
    })
    return !!r.data?.data?.matchedUser
  } catch {
    return true  // if LeetCode API is down, don't block
  }
}

function issueToken(user) {
  return jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '7d' })
}

function publicUser(user) {
  return { id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar }
}

// ── Register ──────────────────────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body

    const nameErr = validateName(name)
    if (nameErr) return res.status(400).json({ message: nameErr })

    const authErr = validateEmailPassword(email, password, true)
    if (authErr) return res.status(400).json({ message: authErr })

    if (role && !VALID_ROLES.includes(role))
      return res.status(400).json({ message: 'Invalid role selected' })

    const existing = await User.findOne({ email: email.toLowerCase() })
    if (existing) return res.status(409).json({ message: 'An account with this email already exists' })

    const passwordHash = await bcrypt.hash(password, 12)
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase(),
      passwordHash,
      role: role || 'SWE',
    })

    res.status(201).json({ user: publicUser(user), token: issueToken(user) })
  } catch (err) {
    if (err.name === 'ValidationError') {
      const msg = Object.values(err.errors).map(e => e.message).join(', ')
      return res.status(400).json({ message: msg })
    }
    res.status(500).json({ message: 'Registration failed. Please try again.' })
  }
})

// ── Login ─────────────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password)
      return res.status(400).json({ message: 'Email and password are required' })
    if (typeof email !== 'string' || email.length > 254)
      return res.status(400).json({ message: 'Invalid email address' })
    if (typeof password !== 'string' || password.length > 128)
      return res.status(400).json({ message: 'Invalid password' })

    const user = await User.findOne({ email: email.toLowerCase() })
    if (!user) return res.status(401).json({ message: 'Invalid email or password' })

    if (!user.passwordHash)
      return res.status(401).json({ message: 'This account uses Google Sign-In. Please continue with Google.' })

    const ok = await user.comparePassword(password)
    if (!ok) return res.status(401).json({ message: 'Invalid email or password' })

    res.json({ user: publicUser(user), token: issueToken(user) })
  } catch (err) {
    res.status(500).json({ message: 'Login failed. Please try again.' })
  }
})

// ── Get current user ──────────────────────────────────────────────────────────
router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-passwordHash -resetToken -resetTokenExpiry')
    if (!user) return res.status(404).json({ message: 'User not found' })
    res.json({ user })
  } catch {
    res.status(500).json({ message: 'Failed to fetch user' })
  }
})

// ── Update profile settings ───────────────────────────────────────────────────
router.patch('/profile', requireAuth, async (req, res) => {
  try {
    const { githubUsername, leetcodeUsername, targetCompanies, emailNotifications, role } = req.body

    // Validate role
    if (role && !VALID_ROLES.includes(role))
      return res.status(400).json({ message: 'Invalid role selected' })

    // Validate usernames format
    const ghErr = validateUsername(githubUsername, 'GitHub username')
    if (ghErr) return res.status(400).json({ message: ghErr })

    const lcErr = validateUsername(leetcodeUsername, 'LeetCode username')
    if (lcErr) return res.status(400).json({ message: lcErr })

    // Validate target companies
    if (targetCompanies !== undefined) {
      if (!Array.isArray(targetCompanies))
        return res.status(400).json({ message: 'Target companies must be an array' })
      if (targetCompanies.length > 10)
        return res.status(400).json({ message: 'Maximum 10 target companies allowed' })
      if (targetCompanies.some(c => typeof c !== 'string' || c.length > 50 || c.trim().length === 0))
        return res.status(400).json({ message: 'Each company name must be between 1 and 50 characters' })
    }

    // Verify GitHub profile exists (only if username changed and non-empty)
    if (githubUsername?.trim()) {
      const ghExists = await verifyGithubUsername(githubUsername.trim())
      if (!ghExists)
        return res.status(400).json({ message: `GitHub user "${githubUsername}" not found. Check the username and try again.` })
    }

    // Verify LeetCode profile exists (only if username changed and non-empty)
    if (leetcodeUsername?.trim()) {
      const lcExists = await verifyLeetcodeUsername(leetcodeUsername.trim())
      if (!lcExists)
        return res.status(400).json({ message: `LeetCode user "${leetcodeUsername}" not found. Check the username and try again.` })
    }

    const updated = await User.findByIdAndUpdate(
      req.userId,
      { $set: {
        ...(role              !== undefined && { role }),
        ...(githubUsername    !== undefined && { githubUsername: githubUsername.trim() }),
        ...(leetcodeUsername  !== undefined && { leetcodeUsername: leetcodeUsername.trim() }),
        ...(targetCompanies   !== undefined && { targetCompanies: targetCompanies.map(c => c.trim()) }),
        ...(emailNotifications!== undefined && { emailNotifications }),
      }},
      { new: true, runValidators: true }
    ).select('-passwordHash -resetToken -resetTokenExpiry')

    res.json({ user: updated })
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: Object.values(err.errors).map(e => e.message).join(', ') })
    }
    res.status(500).json({ message: 'Profile update failed' })
  }
})

// ── Google OAuth ──────────────────────────────────────────────────────────────
router.post('/google', async (req, res) => {
  try {
    const { credential } = req.body
    if (!credential) return res.status(400).json({ message: 'Missing Google credential' })
    if (typeof credential !== 'string' || credential.length > 4096)
      return res.status(400).json({ message: 'Invalid credential' })

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    })
    const { sub: googleId, email, name, picture } = ticket.getPayload()

    let user = await User.findOne({ $or: [{ googleId }, { email }] })
    if (user) {
      if (!user.googleId) {
        user.googleId = googleId
        user.avatar   = picture
        await user.save()
      }
    } else {
      user = await User.create({ name, email, googleId, avatar: picture })
    }

    res.json({ user: publicUser(user), token: issueToken(user) })
  } catch (err) {
    console.error('Google auth error:', err.message)
    res.status(401).json({ message: 'Google sign-in failed' })
  }
})

// ── Forgot Password ───────────────────────────────────────────────────────────
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body
    if (!email)                        return res.status(400).json({ message: 'Email is required' })
    if (typeof email !== 'string' || email.length > 254)
                                       return res.status(400).json({ message: 'Invalid email address' })
    if (!GMAIL_REGEX.test(email))      return res.status(400).json({ message: 'Only Gmail addresses are accepted' })

    const user = await User.findOne({ email: email.toLowerCase() })
    if (!user || !user.passwordHash) {
      return res.json({ message: 'If that email is registered, a reset link has been sent.' })
    }

    const rawToken    = crypto.randomBytes(32).toString('hex')
    const tokenHash   = crypto.createHash('sha256').update(rawToken).digest('hex')

    user.resetToken       = tokenHash
    user.resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000)
    await user.save({ validateBeforeSave: false })

    const resetUrl = `${FRONTEND_URL}/reset-password?token=${rawToken}`
    await sendPasswordReset(user.email, resetUrl)

    res.json({ message: 'If that email is registered, a reset link has been sent.' })
  } catch (err) {
    console.error('Forgot password error:', err.message)
    res.status(500).json({ message: 'Could not send reset email. Please try again.' })
  }
})

// ── Reset Password ────────────────────────────────────────────────────────────
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body
    if (!token || !password)
      return res.status(400).json({ message: 'Token and new password are required' })
    if (typeof token !== 'string' || token.length > 200)
      return res.status(400).json({ message: 'Invalid reset token' })
    if (password.length < 8)
      return res.status(400).json({ message: 'Password must be at least 8 characters' })
    if (password.length > 128)
      return res.status(400).json({ message: 'Password cannot exceed 128 characters' })

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
    const user = await User.findOne({
      resetToken:       tokenHash,
      resetTokenExpiry: { $gt: new Date() },
    })

    if (!user)
      return res.status(400).json({ message: 'Reset link is invalid or has expired. Please request a new one.' })

    user.passwordHash     = await bcrypt.hash(password, 12)
    user.resetToken       = null
    user.resetTokenExpiry = null
    await user.save({ validateBeforeSave: false })

    res.json({ message: 'Password reset successful. You can now sign in.' })
  } catch (err) {
    console.error('Reset password error:', err.message)
    res.status(500).json({ message: 'Password reset failed. Please try again.' })
  }
})

export default router