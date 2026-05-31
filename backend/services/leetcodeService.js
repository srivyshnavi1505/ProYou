import axios from 'axios'

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
      submissionCalendar
    }
    profile {
      ranking
    }
  }
}
`

function computeStreak(calendarJson) {
  let entries
  try { entries = Object.keys(JSON.parse(calendarJson || '{}')).map(Number).sort((a, b) => b - a) }
  catch { return 0 }

  let streak = 0
  const ONE_DAY = 86400
  // Allow today OR yesterday as the starting point so off-by-one is avoided
  let cursor = Math.floor(Date.now() / 1000 / ONE_DAY) * ONE_DAY

  for (const ts of entries) {
    const day  = Math.floor(ts / ONE_DAY) * ONE_DAY
    const diff = Math.round((cursor - day) / ONE_DAY)
    if (diff <= 1) { streak++; cursor = day }
    else break
  }
  return streak
}

/**
 * Fetches LeetCode stats for a username.
 * Returns the same shape the /api/leetcode/:username route returns.
 */
export async function fetchLeetcodeData(username) {
  if (!username) return null

  const r = await axios.post(LC_GQL, { query: QUERY, variables: { username } }, {
    headers: {
      'Content-Type': 'application/json',
      'Referer':      'https://leetcode.com',
      'User-Agent':   'Mozilla/5.0',
    },
  })

  if (r.data?.errors) throw new Error('LeetCode user not found or profile is private')

  const mu = r.data?.data?.matchedUser
  if (!mu) throw new Error('LeetCode user not found')

  const subs   = mu.submitStats?.acSubmissionNum || []
  const easy   = subs.find(s => s.difficulty === 'Easy')?.count   || 0
  const medium = subs.find(s => s.difficulty === 'Medium')?.count || 0
  const hard   = subs.find(s => s.difficulty === 'Hard')?.count   || 0

  const calJson  = mu.userCalendar?.submissionCalendar || '{}'
  const rawCal   = JSON.parse(calJson)
  const calendar = Object.entries(rawCal).map(([ts, count]) => ({
    date:  new Date(parseInt(ts) * 1000).toISOString().split('T')[0],
    count,
  }))

  return {
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
}
