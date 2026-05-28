require('dotenv').config()
const express  = require('express')
const cors     = require('cors')
const morgan   = require('morgan')
const helmet   = require('helmet')

const authRoutes     = require('./routes/auth')
const githubRoutes   = require('./routes/github')
const leetcodeRoutes = require('./routes/leetcode')
const aiRoutes       = require('./routes/ai')
const newsRoutes     = require('./routes/news')
const contestRoutes  = require('./routes/contests')
const eventRoutes    = require('./routes/events')
const linkedinRoutes = require('./routes/linkedin')
const factRoutes     = require('./routes/facts')

// Cron jobs
require('./cron/scheduler')

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
