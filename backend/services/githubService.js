import axios from 'axios'

const GITHUB_HEADERS = () =>
  process.env.GITHUB_TOKEN
    ? { Authorization: `token ${process.env.GITHUB_TOKEN}` }
    : {}

/**
 * Fetches GitHub stats for a username.
 * Returns the same shape the /api/github/:username route returns.
 */
export async function fetchGithubData(username) {
  if (!username) return null

  const headers = GITHUB_HEADERS()
  const [userRes, eventsRes, reposRes] = await Promise.all([
    axios.get(`https://api.github.com/users/${username}`, { headers }),
    axios.get(`https://api.github.com/users/${username}/events/public?per_page=100`, { headers }),
    axios.get(`https://api.github.com/users/${username}/repos?per_page=100&sort=updated`, { headers }),
  ])

  const user   = userRes.data
  const events = eventsRes.data

  // Compute streak from push events
  const pushDates = [...new Set(
    events
      .filter(e => e.type === 'PushEvent')
      .map(e => e.created_at.split('T')[0])
  )].sort().reverse()

  let streak = 0
  let cur = new Date()
  cur.setHours(0, 0, 0, 0)
  for (const d of pushDates) {
    const eventDate = new Date(d)
    const diff = Math.round((cur - eventDate) / 86400000)
    if (diff <= 1) { streak++; cur = eventDate }
    else break
  }

  // Contribution heatmap
  const contribMap = {}
  events.filter(e => e.type === 'PushEvent').forEach(e => {
    const d = e.created_at.split('T')[0]
    contribMap[d] = (contribMap[d] || 0) + (e.payload?.commits?.length || 1)
  })
  const contributions = Object.entries(contribMap).map(([date, count]) => ({ date, count }))

  const stars = reposRes.data.reduce((acc, r) => acc + r.stargazers_count, 0)

  return {
    login:              user.login,
    name:               user.name,
    avatar:             user.avatar_url,
    publicRepos:        user.public_repos,
    followers:          user.followers,
    totalContributions: events.filter(e => e.type === 'PushEvent').length,
    streak,
    stars,
    contributions,
  }
}
