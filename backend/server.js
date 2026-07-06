import 'dotenv/config'

// ── Fail-fast: critical env vars ──────────────────────────
if (!process.env.JWT_SECRET) {
  console.error('❌  JWT_SECRET is not set in .env — refusing to start with an insecure default.')
  process.exit(1)
}

import express   from 'express'
import cors      from 'cors'
import morgan    from 'morgan'
import helmet    from 'helmet'
import mongoose  from 'mongoose'

import authRoutes     from './routes/auth.js'
import githubRoutes   from './routes/github.js'
import leetcodeRoutes from './routes/leetcode.js'
import aiRoutes       from './routes/ai.js'
import newsRoutes     from './routes/news.js'
import contestRoutes  from './routes/contests.js'
import eventRoutes    from './routes/events.js'
import linkedinRoutes from './routes/linkedin.js'
import factRoutes     from './routes/facts.js'
import { globalLimit, authLimit, aiLimit, publicLimit } from './middleware/rateLimiter.js'


// Cron jobs
import './cron/scheduler.js'

// ── MongoDB Atlas connection ──────────────────────────────
const MONGO_URI = process.env.MONGODB_URI
if (!MONGO_URI) {
  console.error('❌  MONGODB_URI is not set in .env — please add it and restart.')
  process.exit(1)
}

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅  MongoDB Atlas connected'))
  .catch(err => { console.error('❌  MongoDB connection error:', err.message); process.exit(1) })

const app = express()

app.use(helmet())
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }))
app.use(morgan('dev'))
app.use(express.json())

// Global catch-all rate limit
app.use(globalLimit)

// Routes — each group gets the appropriate rate-limit tier
app.use('/api/auth',     authLimit,   authRoutes)
app.use('/api/ai',       aiLimit,     aiRoutes)
app.use('/api/github',   publicLimit, githubRoutes)
app.use('/api/leetcode', publicLimit, leetcodeRoutes)
app.use('/api/facts',    publicLimit, factRoutes)
app.use('/api/contests', publicLimit, contestRoutes)
app.use('/api/news',     newsRoutes)
app.use('/api/events',   eventRoutes)
app.use('/api/linkedin', linkedinRoutes)

app.get('/api/health', (_, res) => res.json({ status: 'ok', time: new Date() }))

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(err.status || 500).json({ message: err.message || 'Server error' })
})


const PORT = process.env.PORT || 3001
app.listen(PORT, () => console.log(`🚀 ProYou backend running on http://localhost:${PORT}`))
