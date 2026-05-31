import express from 'express'
import { fetchLeetcodeData } from '../services/leetcodeService.js'

const router = express.Router()

const cache = new Map()
const TTL   = 6 * 60 * 60 * 1000

router.get('/:username', async (req, res) => {
  const { username } = req.params
  const key = `lc:${username}`

  if (cache.has(key) && Date.now() - cache.get(key).ts < TTL) {
    return res.json(cache.get(key).data)
  }

  try {
    const data = await fetchLeetcodeData(username)
    cache.set(key, { ts: Date.now(), data })
    res.json(data)
  } catch (err) {
    console.error('LeetCode error:', err.message)
    res.status(500).json({ message: err.message })
  }
})

export default router
