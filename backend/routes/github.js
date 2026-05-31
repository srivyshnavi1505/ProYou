import express from 'express'
import { fetchGithubData } from '../services/githubService.js'

const router = express.Router()

// Simple in-memory cache
const cache = new Map()
const TTL   = 6 * 60 * 60 * 1000   // 6 hours

router.get('/:username', async (req, res) => {
  const { username } = req.params
  const key = `gh:${username}`

  if (cache.has(key) && Date.now() - cache.get(key).ts < TTL) {
    return res.json(cache.get(key).data)
  }

  try {
    const data = await fetchGithubData(username)
    cache.set(key, { ts: Date.now(), data })
    res.json(data)
  } catch (err) {
    console.error('GitHub error:', err.message)
    res.status(err.response?.status || 500).json({ message: err.message })
  }
})

export default router
