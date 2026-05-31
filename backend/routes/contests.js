import express from 'express'
import { fetchContests } from '../services/contestService.js'

const router = express.Router()

const cache = new Map()
const TTL   = 30 * 60 * 1000  // 30 min

router.get('/', async (req, res) => {
  const key = 'contests'
  if (cache.has(key) && Date.now() - cache.get(key).ts < TTL) {
    return res.json(cache.get(key).data)
  }

  try {
    let results = await fetchContests()

    // Fallback if both APIs are down
    if (results.length === 0) {
      const now = new Date()
      results = [
        { name: 'LeetCode Weekly Contest',    platform: 'LeetCode',   startTime: new Date(now.getTime() + 3 * 24 * 3600000).toISOString(), duration: '90 min', url: 'https://leetcode.com/contest/' },
        { name: 'Codeforces Round (Div. 2)',  platform: 'Codeforces', startTime: new Date(now.getTime() + 5 * 24 * 3600000).toISOString(), duration: '2 hr',   url: 'https://codeforces.com/contests' },
        { name: 'LeetCode Biweekly Contest',  platform: 'LeetCode',   startTime: new Date(now.getTime() + 9 * 24 * 3600000).toISOString(), duration: '90 min', url: 'https://leetcode.com/contest/' },
      ]
    }

    cache.set(key, { ts: Date.now(), data: results })
    res.json(results)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

export default router
