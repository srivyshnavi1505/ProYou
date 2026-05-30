import express from 'express'
import axios   from 'axios'

const router = express.Router()

const cache = new Map()
const TTL   = 6 * 60 * 60 * 1000

const LC_GQL = 'https://leetcode.com/graphql'

// Only use fields that LeetCode's current public API supports
// (currentStreak was removed from their public GraphQL schema)
const QUERY = `
query userStats($username: String!) {
  matchedUser(username: $username) {
    submitStats {
      acSubmissionNum {
        difficulty
        count
      }
    }
    userCalendar {
      submissionCalendar
    }
    profile {
      ranking
    }
  }
}
`

// Compute current streak from the submissionCalendar (unix-timestamp → count map)
function computeStreak(calendarJson) {
  let entries
  try { entries = Object.keys(JSON.parse(calendarJson || '{}')).map(Number).sort((a, b) => b - a) }
  catch { return 0 }

  let streak = 0
  const ONE_DAY = 86400
  let cursor = Math.floor(Date.now() / 1000 / ONE_DAY) * ONE_DAY

  for (const ts of entries) {
    const day  = Math.floor(ts / ONE_DAY) * ONE_DAY
    const diff = Math.round((cursor - day) / ONE_DAY)
    if (diff <= 1) { streak++; cursor = day }
    else break
  }
  return streak
}

router.get('/:username', async (req, res) => {
  const { username } = req.params
  const key = `lc:${username}`
  if (cache.has(key) && Date.now() - cache.get(key).ts < TTL) {
    return res.json(cache.get(key).data)
  }

  try {
    const r = await axios.post(LC_GQL, { query: QUERY, variables: { username } }, {
      headers: {
        'Content-Type': 'application/json',
        'Referer': 'https://leetcode.com',
        'User-Agent': 'Mozilla/5.0',
      }
    })

    // GraphQL errors come in r.data.errors even with HTTP 200
    if (r.data?.errors) {
      console.error('LeetCode GQL errors:', JSON.stringify(r.data.errors))
      return res.status(404).json({ message: 'LeetCode user not found or profile is private' })
    }

    const mu = r.data?.data?.matchedUser
    if (!mu) return res.status(404).json({ message: 'LeetCode user not found' })

    const subs   = mu.submitStats?.acSubmissionNum || []
    const easy   = subs.find(s => s.difficulty === 'Easy')?.count   || 0
    const medium = subs.find(s => s.difficulty === 'Medium')?.count || 0
    const hard   = subs.find(s => s.difficulty === 'Hard')?.count   || 0

    const calJson  = mu.userCalendar?.submissionCalendar || '{}'
    const rawCal   = JSON.parse(calJson)
    const calendar = Object.entries(rawCal).map(([ts, count]) => ({
      date: new Date(parseInt(ts) * 1000).toISOString().split('T')[0],
      count
    }))

    const data = {
      username,
      totalSolved:  easy + medium + hard,
      easySolved:   easy,
      mediumSolved: medium,
      hardSolved:   hard,
      easyTotal:    800,
      mediumTotal:  1700,
      hardTotal:    700,
      streak:       computeStreak(calJson),
      ranking:      mu.profile?.ranking,
      calendar,
    }

    cache.set(key, { ts: Date.now(), data })
    res.json(data)
  } catch (err) {
    console.error('LeetCode error:', err.response?.data || err.message)
    res.status(500).json({ message: 'LeetCode API error — try again' })
  }
})

export default router
