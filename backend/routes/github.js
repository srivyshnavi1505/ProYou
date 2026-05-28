const express = require('express')
const axios   = require('axios')
const router  = express.Router()

// Simple in-memory cache (replace with Redis in prod)
const cache = new Map()
const TTL = 6 * 60 * 60 * 1000  // 6 hours

router.get('/:username', async (req, res) => {
  const { username } = req.params
  const key = `gh:${username}`

  if (cache.has(key) && Date.now() - cache.get(key).ts < TTL) {
    return res.json(cache.get(key).data)
  }

  try {
    const headers = process.env.GITHUB_TOKEN
      ? { Authorization: `token ${process.env.GITHUB_TOKEN}` }
      : {}

    const [userRes, eventsRes, reposRes] = await Promise.all([
      axios.get(`https://api.github.com/users/${username}`, { headers }),
      axios.get(`https://api.github.com/users/${username}/events/public?per_page=100`, { headers }),
      axios.get(`https://api.github.com/users/${username}/repos?per_page=100&sort=updated`, { headers }),
    ])

    const user  = userRes.data
    const events = eventsRes.data

    // Compute streak
    const pushDates = [...new Set(
      events
        .filter(e => e.type === 'PushEvent')
        .map(e => e.created_at.split('T')[0])
    )].sort().reverse()

    let streak = 0
    let cur = new Date()
    cur.setHours(0,0,0,0)
    for (const d of pushDates) {
      const eventDate = new Date(d)
      const diff = Math.round((cur - eventDate) / 86400000)
      if (diff <= 1) { streak++; cur = eventDate }
      else break
    }

    // Contributions heatmap (last 42 days from events)
    const contribMap = {}
    events.filter(e => e.type === 'PushEvent').forEach(e => {
      const d = e.created_at.split('T')[0]
      contribMap[d] = (contribMap[d] || 0) + (e.payload?.commits?.length || 1)
    })
    const contributions = Object.entries(contribMap).map(([date, count]) => ({ date, count }))

    // Stars
    const stars = reposRes.data.reduce((acc, r) => acc + r.stargazers_count, 0)

    const data = {
      login: user.login,
      name: user.name,
      avatar: user.avatar_url,
      publicRepos: user.public_repos,
      followers: user.followers,
      totalContributions: events.filter(e => e.type === 'PushEvent').length,
      streak,
      stars,
      contributions,
    }

    cache.set(key, { ts: Date.now(), data })
    res.json(data)
  } catch (err) {
    console.error('GitHub error:', err.message)
    res.status(err.response?.status || 500).json({ message: err.message })
  }
})

module.exports = router
