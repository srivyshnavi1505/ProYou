import express from 'express'
import axios   from 'axios'

const router = express.Router()

const cache = new Map()
const TTL   = 30 * 60 * 1000  // 30 min

router.get('/', async (req, res) => {
  const key = 'contests'
  if (cache.has(key) && Date.now() - cache.get(key).ts < TTL) {
    return res.json(cache.get(key).data)
  }

  const results = []

  // ── LeetCode Contests ─────────────────────────────────
  try {
    const r = await axios.post('https://leetcode.com/graphql', {
      query: `{ 
        upcomingContests { 
          title startTime duration 
        } 
      }`
    }, { headers: { 'Content-Type': 'application/json', Referer: 'https://leetcode.com' } })

    const lc = r.data?.data?.upcomingContests || []
    lc.forEach(c => results.push({
      name: c.title,
      platform: 'LeetCode',
      startTime: new Date(c.startTime * 1000).toISOString(),
      duration: `${Math.round(c.duration / 60)} min`,
      url: `https://leetcode.com/contest/${c.title.toLowerCase().replace(/\s+/g, '-')}/`,
    }))
  } catch (e) { console.error('LeetCode contests error:', e.message) }

  // ── Codeforces Contests ───────────────────────────────
  try {
    const r = await axios.get('https://codeforces.com/api/contest.list?gym=false')
    const cf = (r.data?.result || []).filter(c => c.phase === 'BEFORE').slice(0, 5)
    cf.forEach(c => results.push({
      name: c.name,
      platform: 'Codeforces',
      startTime: new Date(c.startTimeSeconds * 1000).toISOString(),
      duration: `${Math.round(c.durationSeconds / 3600)} hr`,
      url: `https://codeforces.com/contest/${c.id}`,
    }))
  } catch (e) { console.error('Codeforces error:', e.message) }

  // Sort by start time
  results.sort((a, b) => new Date(a.startTime) - new Date(b.startTime))

  // Fallback if both fail
  if (results.length === 0) {
    const now = new Date()
    results.push(
      { name: 'LeetCode Weekly Contest', platform: 'LeetCode', startTime: new Date(now.getTime() + 3 * 24 * 3600000).toISOString(), duration: '90 min', url: 'https://leetcode.com/contest/' },
      { name: 'Codeforces Round (Div. 2)', platform: 'Codeforces', startTime: new Date(now.getTime() + 5 * 24 * 3600000).toISOString(), duration: '2 hr', url: 'https://codeforces.com/contests' },
      { name: 'LeetCode Biweekly Contest', platform: 'LeetCode', startTime: new Date(now.getTime() + 9 * 24 * 3600000).toISOString(), duration: '90 min', url: 'https://leetcode.com/contest/' },
    )
  }

  cache.set(key, { ts: Date.now(), data: results })
  res.json(results)
})

export default router
