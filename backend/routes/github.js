import express from 'express'
import { fetchGithubData } from '../services/githubService.js'
import { BoundedCache } from '../services/boundedCache.js'

const router = express.Router()

// Bounded cache — max 500 unique usernames, 6h TTL
const cache = new BoundedCache(500, 6 * 60 * 60 * 1000)

router.get('/:username', async (req, res) => {
  const { username } = req.params
  const key = `gh:${username}`

  const cached = cache.get(key)
  if (cached) return res.json(cached)

  try {
    const data = await fetchGithubData(username)
    cache.set(key, data)
    res.json(data)
  } catch (err) {
    console.error('GitHub error:', err.message)
    res.status(err.response?.status || 500).json({ message: err.message })
  }
})

export default router
