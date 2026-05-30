import 'dotenv/config'
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

// Routes
app.use('/api/auth',     authRoutes)
app.use('/api/github',   githubRoutes)
app.use('/api/leetcode', leetcodeRoutes)
app.use('/api/ai',       aiRoutes)
app.use('/api/news',     newsRoutes)
app.use('/api/contests', contestRoutes)
app.use('/api/events',   eventRoutes)
app.use('/api/linkedin', linkedinRoutes)
app.use('/api/facts',    factRoutes)

app.get('/api/health', (_, res) => res.json({ status: 'ok', time: new Date() }))

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(err.status || 500).json({ message: err.message || 'Server error' })
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => console.log(`🚀 ProYou backend running on http://localhost:${PORT}`))
