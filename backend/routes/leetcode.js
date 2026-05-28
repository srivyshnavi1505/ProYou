const express = require('express')
const axios   = require('axios')
const router  = express.Router()

const cache = new Map()
const TTL   = 6 * 60 * 60 * 1000

const LC_GQL = 'https://leetcode.com/graphql'

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
      activeYears
      submissionCalendar
    }
    streak: currentStreak
    profile {
      ranking
    }
  }
}
`

router.get('/:username', async (req, res) => {
  const { username } = req.params
  const key = `lc:${username}`
  if (cache.has(key) && Date.now() - cache.get(key).ts < TTL) {
    return res.json(cache.get(key).data)
  }

  try {
    const r = await axios.post(LC_GQL, { query: QUERY, variables: { username } }, {
      headers: { 'Content-Type': 'application/json', Referer: 'https://leetcode.com' }
    })

    const mu = r.data?.data?.matchedUser
    if (!mu) return res.status(404).json({ message: 'LeetCode user not found' })

    const subs = mu.submitStats?.acSubmissionNum || []
    const easy   = subs.find(s => s.difficulty === 'Easy')?.count   || 0
    const medium = subs.find(s => s.difficulty === 'Medium')?.count || 0
    const hard   = subs.find(s => s.difficulty === 'Hard')?.count   || 0

    // Parse calendar
    const rawCal = JSON.parse(mu.userCalendar?.submissionCalendar || '{}')
    const calendar = Object.entries(rawCal).map(([ts, count]) => ({
      date: new Date(parseInt(ts) * 1000).toISOString().split('T')[0],
      count
    }))

    const data = {
      username,
      totalSolved: easy + medium + hard,
      easySolved: easy,
      mediumSolved: medium,
      hardSolved: hard,
      easyTotal: 800,
      mediumTotal: 1700,
      hardTotal: 700,
      streak: mu.streak || 0,
      ranking: mu.profile?.ranking,
      calendar,
    }

    cache.set(key, { ts: Date.now(), data })
    res.json(data)
  } catch (err) {
    console.error('LeetCode error:', err.message)
    res.status(500).json({ message: 'LeetCode API error — try again' })
  }
})

module.exports = router
