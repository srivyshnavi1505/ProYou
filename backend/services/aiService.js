const { GoogleGenerativeAI } = require('@google/generative-ai')

let genAI = null
function getGenAI() {
  if (!genAI && process.env.GEMINI_API_KEY) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  }
  return genAI
}

async function callGemini(prompt, jsonMode = false) {
  const ai = getGenAI()
  if (!ai) throw new Error('GEMINI_API_KEY not configured in .env')

  const model = ai.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: jsonMode
      ? { responseMimeType: 'application/json', temperature: 0.3 }
      : { temperature: 0.7 }
  })

  const result = await model.generateContent(prompt)
  const text   = result.response.text()
  if (jsonMode) {
    try { return JSON.parse(text) } catch { return JSON.parse(text.replace(/```json|```/g, '').trim()) }
  }
  return text
}

// ── Placement Score ───────────────────────────────────────
async function generatePlacementScore({ role, github, leetcode, targetCompanies }) {
  const prompt = `You are a placement readiness evaluator for tech companies. Score this candidate out of 100 (25 pts each category) for the role: ${role}.

Candidate Data:
- GitHub streak: ${github?.streak ?? 0} days, ${github?.totalContributions ?? 0} contributions, ${github?.publicRepos ?? 0} repos
- LeetCode: ${leetcode?.easySolved ?? 0} Easy, ${leetcode?.mediumSolved ?? 0} Medium, ${leetcode?.hardSolved ?? 0} Hard solved. Streak: ${leetcode?.streak ?? 0} days
- Target companies: ${(targetCompanies || []).join(', ')}

Return a JSON object with EXACTLY this schema:
{
  "total": <number 0-100>,
  "breakdown": {
    "dsa": <number 0-25>,
    "github": <number 0-25>,
    "communication": <number 0-25>,
    "contests": <number 0-25>
  },
  "advice": [<string tip 1>, <string tip 2>, <string tip 3>]
}

Be realistic and role-specific. For ML, weight hard problems higher. For PM, weight communication and GitHub projects higher.`

  return callGemini(prompt, true)
}

// ── Weekly Insight ────────────────────────────────────────
async function generateWeeklyInsight({ role, github, leetcode }) {
  const prompt = `You are a personal placement coach. Write a concise, encouraging weekly insight (2-3 sentences, plain English, no bullet points) for a ${role} candidate.

Stats:
- GitHub streak: ${github?.streak ?? 0} days
- LeetCode: ${leetcode?.totalSolved ?? 0} total solved (${leetcode?.easySolved ?? 0}E/${leetcode?.mediumSolved ?? 0}M/${leetcode?.hardSolved ?? 0}H)
- LeetCode streak: ${leetcode?.streak ?? 0} days

Comment on what's going well, what needs work, and one specific action item for this week. Be personal and direct.`

  return callGemini(prompt)
}

// ── Flashcard Generator ───────────────────────────────────
async function generateFlashcards({ role, github, leetcode }) {
  const weakArea = (leetcode?.hardSolved ?? 0) < 10 ? 'hard problems and advanced data structures'
    : (leetcode?.mediumSolved ?? 0) < 50 ? 'medium-level dynamic programming and graphs'
    : 'system design and distributed systems'

  const prompt = `Generate 5 technical flashcards for a ${role} candidate who needs to improve on ${weakArea}.

Return JSON array:
[
  {
    "question": "<clear, specific technical question>",
    "answer": "<concise but complete answer, 2-4 sentences>",
    "tag": "<topic tag, e.g. DP, Trees, System Design>"
  }
]

Make questions interview-realistic. Answers should be memorable, not textbook definitions.`

  return callGemini(prompt, true)
}

// ── LeetCode Tutor ────────────────────────────────────────
async function tutorResponse({ problem, hintLevel, role, message, history }) {
  const levelInstruction = {
    nudge: 'Give a single-sentence nudge pointing toward the key insight. Do NOT reveal the approach.',
    approach: 'Explain the algorithmic strategy clearly without writing code. Mention time complexity.',
    walkthrough: 'Give a complete step-by-step walkthrough with commented pseudocode or code.'
  }[hintLevel] || 'Help the user understand the problem.'

  const roleNote = role === 'ML Engineer'
    ? 'When relevant, mention vectorized or GPU-friendly implementations.'
    : role === 'PM'
    ? 'Focus on clarity of explanation over technical depth.'
    : 'Emphasize time and space complexity analysis.'

  const systemPrompt = `You are an expert coding interview tutor helping a ${role} candidate.
Hint level: ${levelInstruction}
Role note: ${roleNote}
Problem: ${problem || 'Not specified yet'}`

  const historyText = (history || []).map(m => `${m.role === 'user' ? 'User' : 'Tutor'}: ${m.content}`).join('\n')
  const fullPrompt = `${systemPrompt}\n\nConversation so far:\n${historyText}\n\nUser: ${message}\n\nTutor:`

  return callGemini(fullPrompt)
}

// ── News Filter ───────────────────────────────────────────
async function filterNewsRelevance(articles, companies) {
  const summaries = articles.slice(0, 10).map((a, i) => `${i}: ${a.title}`).join('\n')
  const prompt = `You are evaluating news articles for placement relevance for companies: ${companies.join(', ')}.

Articles:
${summaries}

Return JSON array of objects (one per article) with placement relevance:
[{ "index": 0, "relevance": "high"|"medium"|"low", "summary": "<one sentence why this matters for job seekers>" }]

High relevance = hiring news, layoffs, new engineering teams, internship programs, leadership changes.
Low relevance = quarterly earnings with no hiring mention, generic business news.`

  try { return callGemini(prompt, true) } catch { return [] }
}

// ── Email Digest ──────────────────────────────────────────
async function generateEmailDigest({ user, github, leetcode, score, contests }) {
  const prompt = `Write a concise, motivating weekly placement digest email for ${user?.name || 'a developer'}.

Data:
- GitHub streak: ${github?.streak ?? 0} days
- LeetCode: ${leetcode?.totalSolved ?? 0} solved this cycle
- Placement score: ${score?.total ?? 'not yet run'}/100
- Upcoming contests: ${(contests || []).slice(0, 2).map(c => c.name).join(', ') || 'none'}

Format as plain text email with:
1. Opening (personal, 1 sentence)
2. Week summary (2-3 sentences)
3. 3 action items for next week (bullet points)
4. Motivational closing (1 sentence)

Keep it under 200 words. Friendly but direct tone.`

  return callGemini(prompt)
}

module.exports = {
  generatePlacementScore,
  generateWeeklyInsight,
  generateFlashcards,
  tutorResponse,
  filterNewsRelevance,
  generateEmailDigest,
}
