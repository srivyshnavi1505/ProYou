import axios from 'axios'

/**
 * Fetches upcoming contests from LeetCode + Codeforces.
 * Returns the same shape the /api/contests route returns.
 */
export async function fetchContests() {
  const results = []

  // LeetCode
  try {
    const r = await axios.post('https://leetcode.com/graphql', {
      query: `{ upcomingContests { title startTime duration } }`
    }, { headers: { 'Content-Type': 'application/json', Referer: 'https://leetcode.com' } })

    const lc = r.data?.data?.upcomingContests || []
    lc.forEach(c => results.push({
      name:      c.title,
      platform:  'LeetCode',
      startTime: new Date(c.startTime * 1000).toISOString(),
      duration:  `${Math.round(c.duration / 60)} min`,
      url:       `https://leetcode.com/contest/${c.title.toLowerCase().replace(/\s+/g, '-')}/`,
    }))
  } catch (e) { console.error('[contestService] LeetCode error:', e.message) }

  // Codeforces
  try {
    const r  = await axios.get('https://codeforces.com/api/contest.list?gym=false')
    const cf = (r.data?.result || []).filter(c => c.phase === 'BEFORE').slice(0, 5)
    cf.forEach(c => results.push({
      name:      c.name,
      platform:  'Codeforces',
      startTime: new Date(c.startTimeSeconds * 1000).toISOString(),
      duration:  `${Math.round(c.durationSeconds / 3600)} hr`,
      url:       `https://codeforces.com/contest/${c.id}`,
    }))
  } catch (e) { console.error('[contestService] Codeforces error:', e.message) }

  results.sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
  return results
}
