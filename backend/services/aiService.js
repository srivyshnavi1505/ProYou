import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

// Model to use — see https://console.groq.com/docs/models
// llama-3.3-70b-versatile is fast, free-tier, and great at JSON
const MODEL = 'llama-3.3-70b-versatile'

// Core wrapper: retries on 429 rate-limits with exponential backoff
async function callGroq(systemPrompt, userPrompt, jsonMode = false, retries = 3) {
  if (!process.env.GROQ_API_KEY) throw new Error('GROQ_API_KEY not configured in .env')

  const requestParams = {
    model: MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: jsonMode ? 0.3 : 0.7,
    ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
  }

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await groq.chat.completions.create(requestParams)
      const text = response.choices?.[0]?.message?.content || ''

      if (jsonMode) {
        try {
          return JSON.parse(text)
        } catch (e) {
          console.error('Groq JSON parse error. Raw text:', text)
          throw new Error('Failed to parse Groq JSON response')
        }
      }

      return text

    } catch (err) {
      const status = err?.status
      const isRateLimit = status === 429
      const isLast = attempt === retries

      if (isRateLimit && !isLast) {
        const delay = Math.pow(2, attempt) * 1000
        console.warn(`Groq 429 rate limit — retrying in ${delay}ms (attempt ${attempt + 1}/${retries})`)
        await new Promise(res => setTimeout(res, delay))
        continue
      }

      throw err
    }
  }
}

// Role-specific score schema definitions
const ROLE_SCORE_SCHEMA = {
  'ML Engineer': {
    categories: { ml_knowledge: 25, coding_python: 25, research_kaggle: 25, math_depth: 25 },
    guidance: 'ml_knowledge = ML concepts & architectures; coding_python = LeetCode + numpy/pandas fluency; research_kaggle = projects, papers, competitions; math_depth = linear algebra, probability, calculus intuition.',
  },
  'PM': {
    categories: { product_sense: 25, communication: 25, analytical: 25, behavioral: 25 },
    guidance: 'product_sense = framework thinking, feature prioritization; communication = clarity, structure; analytical = metrics, A/B testing awareness; behavioral = STAR answers, leadership signals from GitHub activity.',
  },
  'Data Analyst': {
    categories: { sql_skills: 25, statistics: 25, visualization: 25, communication: 25 },
    guidance: 'sql_skills = infer from LeetCode DB problems if any; statistics = hypothesis testing, distributions; visualization = GitHub projects; communication = clarity of insights.',
  },
  'DevOps': {
    categories: { infrastructure: 25, automation_ci: 25, cloud_certs: 25, reliability: 25 },
    guidance: 'infrastructure = system understanding; automation_ci = scripting, GitHub Actions usage; cloud_certs = infer from repos; reliability = monitoring, observability awareness.',
  },
  'Frontend': {
    categories: { ui_ux_sense: 25, framework_depth: 25, portfolio: 25, problem_solving: 25 },
    guidance: 'ui_ux_sense = design awareness; framework_depth = React/Vue/Angular proficiency; portfolio = GitHub public UI projects; problem_solving = LeetCode for frontend-relevant algorithms.',
  },
}
// SWE, Backend, Full Stack all use DSA-focused schema
const DEFAULT_SCORE_SCHEMA = {
  categories: { dsa: 25, system_design: 25, github_projects: 25, consistency: 25 },
  guidance: 'dsa = LeetCode Easy/Medium/Hard distribution; system_design = infer from hard problems and repo complexity; github_projects = publicRepos, stars, contributions; consistency = streak days.',
}

// ── Placement Score ───────────────────────────────────────
async function generatePlacementScore({ role, github, leetcode, targetCompanies, linkedinActivity }) {
  const schema = ROLE_SCORE_SCHEMA[role] || DEFAULT_SCORE_SCHEMA
  const categoryKeys = Object.keys(schema.categories)
  const categorySchema = categoryKeys.map(k => `"${k}": <number 0-25>`).join(',\n    ')

  // What data we actually have vs what we're estimating
  const dataAvailability = {
    'ML Engineer':    'NOTE: You only have GitHub + LeetCode data. Infer ml_knowledge from hard problem count and repo activity. Mark research_kaggle as estimated — be conservative if data is thin.',
    'PM':             'NOTE: You have very limited signals for a PM role. GitHub activity proxies technical curiosity. LeetCode proxies analytical thinking. Be honest — cap scores at 15/25 for categories you cannot verify. Do NOT inflate.',
    'Data Analyst':   'NOTE: You cannot detect SQL-specific LeetCode problems. Treat medium/hard LeetCode as analytical signal. Be conservative on sql_skills if total solved is low.',
    'DevOps':         'NOTE: You cannot see GitHub Actions usage or cloud certs. Infer automation_ci from contribution frequency and repo count. Cap cloud_certs at 10/25 unless repos suggest otherwise.',
    'Frontend':       'NOTE: You cannot see repo names or UI projects directly. Infer portfolio quality from public repo count and stars. Be conservative.',
  }[role] || ''

  const systemPrompt = `You are a placement readiness evaluator for tech companies. Return ONLY valid JSON matching the exact schema requested.
Be honest about data limitations — do not inflate scores for categories where you lack real signal.
If data is insufficient for a category, score conservatively (10-15 range) and mention it in advice.`

  const userPrompt = `Score this ${role} candidate out of 100 (25 pts each category) targeting: ${(targetCompanies || []).join(', ') || 'top tech companies'}.

Candidate Data:
- GitHub streak: ${github?.streak ?? 0} days, ${github?.totalContributions ?? 0} contributions, ${github?.publicRepos ?? 0} public repos, ${github?.stars ?? 0} stars
- LeetCode: ${leetcode?.easySolved ?? 0} Easy, ${leetcode?.mediumSolved ?? 0} Medium, ${leetcode?.hardSolved ?? 0} Hard solved. Streak: ${leetcode?.streak ?? 0} days
- LinkedIn activity logs this month: ${linkedinActivity ?? 'not provided'}

Scoring guidance for ${role}:
${schema.guidance}

${dataAvailability}

Return a JSON object with EXACTLY this schema:
{
  "total": <number 0-100>,
  "breakdown": {
    ${categorySchema}
  },
  "advice": [<role-specific tip 1>, <role-specific tip 2>, <role-specific tip 3>],
  "dataWarning": "<one sentence about what data was missing or estimated, or null if SWE/Backend/FullStack>"
}

Advice must be specific to a ${role} interview process. If scores were capped due to missing data, the advice should tell the user what to do to improve those signals.`

  return callGroq(systemPrompt, userPrompt, true)
}

// ── Weekly Insight ────────────────────────────────────────
async function generateWeeklyInsight({ role, github, leetcode }) {
  // Role-specific lens for the insight
  const roleLens = {
    'ML Engineer':    'Focus on ML project activity on GitHub, not just LeetCode streaks. Mention model-building, datasets, or research.',
    'PM':             'LeetCode matters less. Focus on communication signals, GitHub activity as a proxy for technical curiosity, and consistency.',
    'Data Analyst':   'SQL and stats matter most. Interpret LeetCode medium/hard as analytical thinking signals.',
    'DevOps':         'GitHub contribution patterns signal automation habits. Less focus on LeetCode hard.',
    'Frontend':       'GitHub projects and UI work matter as much as LeetCode. Mention portfolio-building.',
  }[role] || 'Balance DSA depth with GitHub project quality and consistency.'

  const systemPrompt = 'You are a personal placement coach who gives sharp, role-specific weekly insights in 2-3 plain English sentences.'

  const userPrompt = `Write a concise weekly insight for a ${role} candidate. Be personal, direct, and role-aware.

Stats:
- GitHub streak: ${github?.streak ?? 0} days, ${github?.publicRepos ?? 0} repos
- LeetCode: ${leetcode?.totalSolved ?? 0} total solved (${leetcode?.easySolved ?? 0}E/${leetcode?.mediumSolved ?? 0}M/${leetcode?.hardSolved ?? 0}H), streak: ${leetcode?.streak ?? 0} days

Role-specific lens: ${roleLens}

2-3 sentences max. No bullet points. End with one concrete action item for this week tailored to ${role} interviews.`

  return callGroq(systemPrompt, userPrompt)
}

// ── Flashcard Generator ───────────────────────────────────

// Role-specific flashcard topic definitions
const ROLE_FLASHCARD_TOPICS = {
  'ML Engineer': [
    { topic: 'model fundamentals', when: () => true },
    { topic: 'deep learning & neural networks', when: () => true },
    { topic: 'feature engineering & preprocessing', when: () => true },
    { topic: 'model evaluation & loss functions', when: () => true },
    { topic: 'NLP & transformer architecture', when: () => true },
  ],
  'PM': [
    { topic: 'product frameworks (CIRCLES, HEART, RICE)', when: () => true },
    { topic: 'product metrics & analytics', when: () => true },
    { topic: 'prioritization & roadmapping', when: () => true },
    { topic: 'user research & discovery', when: () => true },
    { topic: 'behavioral questions (STAR method)', when: () => true },
  ],
  'Data Analyst': [
    { topic: 'SQL window functions & aggregations', when: () => true },
    { topic: 'statistics & hypothesis testing', when: () => true },
    { topic: 'A/B testing & experiment design', when: () => true },
    { topic: 'data visualization & storytelling', when: () => true },
    { topic: 'Python pandas & data wrangling', when: () => true },
  ],
  'DevOps': [
    { topic: 'Docker & container networking', when: () => true },
    { topic: 'Kubernetes pod lifecycle & orchestration', when: () => true },
    { topic: 'CI/CD pipeline design', when: () => true },
    { topic: 'cloud infrastructure (AWS/GCP/Azure)', when: () => true },
    { topic: 'monitoring, alerting & SRE principles', when: () => true },
  ],
  'Frontend': [
    { topic: 'React hooks & component lifecycle', when: () => true },
    { topic: 'CSS layout, specificity & animations', when: () => true },
    { topic: 'browser rendering & performance optimization', when: () => true },
    { topic: 'accessibility (ARIA) & semantic HTML', when: () => true },
    { topic: 'JavaScript async, closures & event loop', when: () => true },
  ],
}

async function generateFlashcards({ role, github, leetcode }) {
  // For SWE/Backend/Full Stack — DSA-focused with difficulty-based targeting
  const isDsaRole = !ROLE_FLASHCARD_TOPICS[role]

  let topicInstruction
  if (isDsaRole) {
    const weakArea = (leetcode?.hardSolved ?? 0) < 10
      ? 'hard problems and advanced data structures (segment trees, tries, union-find)'
      : (leetcode?.mediumSolved ?? 0) < 50
      ? 'medium-level dynamic programming and graph algorithms'
      : 'system design — scalability, databases, distributed systems'
    topicInstruction = `DSA topic: ${weakArea}. The candidate is a ${role}.`
  } else {
    const topics = ROLE_FLASHCARD_TOPICS[role].map(t => t.topic)
    topicInstruction = `Generate one card per topic in this list: ${topics.join(' | ')}. These are the exact 5 topics — one card each.`
  }

  const systemPrompt = `You are an expert ${role} interview coach. Return ONLY a valid JSON array of exactly 5 flashcards.`

  const userPrompt = `Generate 5 technical flashcards for a ${role} candidate.
${topicInstruction}

Return a JSON array with exactly 5 items:
[
  {
    "question": "<specific, interview-realistic question for a ${role}>",
    "answer": "<concise, memorable answer — 2-4 sentences, no textbook definitions>",
    "tag": "<short topic label>"
  }
]

Make every question feel like something a ${role} interviewer at a top company would actually ask.`

  return callGroq(systemPrompt, userPrompt, true)
}

// ── LeetCode Tutor ────────────────────────────────────────
async function tutorResponse({ problem, hintLevel, role, message, history }) {
  const levelInstruction = {
    nudge:       'Give ONE sharp sentence that nudges toward the key insight. No approach, no code. Make it feel like a light tap on the shoulder.',
    approach:    'Explain the core algorithmic strategy in 3–5 sentences max. Name the pattern (e.g. sliding window, two pointers). State time/space complexity. No full code.',
    walkthrough: 'Give a tight, commented code solution. Walk through it in ≤5 bullet points. Highlight the one tricky line.',
  }[hintLevel] || 'Help the user understand the problem clearly.'

  const roleNote = role === 'ML Engineer'
    ? 'When relevant, mention vectorized or numpy-friendly implementations.'
    : role === 'PM'
    ? 'Prioritize intuition and plain-English reasoning over technical depth.'
    : 'Always state time and space complexity.'

  const systemPrompt = `You are CodeMentor — a sharp, supportive coding interview coach helping a ${role} candidate.

YOUR PERSONA:
- Warm but efficient. Think "senior engineer who actually enjoys teaching."
- Never start with "Great question!" or "Certainly!" or "I'll provide a step-by-step..." — just dive in.
- Be direct. Cut filler. Every sentence should earn its place.
- Use light formatting: short code blocks, bold for key terms, but no giant headers.

HINT LEVEL — ${hintLevel.toUpperCase()}:
${levelInstruction}

ROLE CONTEXT:
${roleNote}

INTERACTION RULES:
- After your response, ALWAYS end with a short, engaging follow-up question to check understanding or nudge thinking. Examples: "Does that click?" / "What would happen if the array were unsorted?" / "Can you spot where we'd handle duplicates?" / "Want me to walk through a dry run?"
- If the user seems confused, simplify — don't repeat the same explanation louder.
- If they've got it right, affirm briefly and challenge them to go deeper.
- Never give the full solution unless hint level is "walkthrough".

PROBLEM CONTEXT:
${problem ? `The problem being discussed:\n${problem}` : 'No specific problem pasted yet — answer based on the user\'s question.'}`

  // Build full message history for conversational context
  const historyMessages = (history || []).map(m => ({
    role: m.role === 'user' ? 'user' : 'assistant',
    content: m.content,
  }))

  const response = await groq.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      ...historyMessages,
      { role: 'user', content: message },
    ],
    temperature: 0.65,
    max_tokens: 800,
  })

  return response.choices?.[0]?.message?.content || ''
}

// ── News Filter ───────────────────────────────────────────
async function filterNewsRelevance(articles, companies) {
  const summaries = articles.slice(0, 10).map((a, i) => `${i}: ${a.title}`).join('\n')

  const systemPrompt = 'You are evaluating news articles for placement relevance. Return ONLY a valid JSON array.'

  const userPrompt = `Evaluate these articles for job seekers targeting: ${companies.join(', ')}.

Articles:
${summaries}

Return a JSON array:
[{ "index": 0, "relevance": "high"|"medium"|"low", "summary": "<one sentence why this matters for job seekers>" }]

High relevance = hiring news, layoffs, new engineering teams, internship programs, leadership changes.
Low relevance = quarterly earnings with no hiring mention, generic business news.`

  try { return callGroq(systemPrompt, userPrompt, true) } catch { return [] }
}

// ── Email Digest ──────────────────────────────────────────
async function generateEmailDigest({ user, github, leetcode, score, contests }) {
  const systemPrompt = 'You are a motivating placement coach writing weekly digest emails. Keep them concise, friendly, and under 200 words.'

  const userPrompt = `Write a concise, motivating weekly placement digest email for ${user?.name || 'a developer'}.

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

  return callGroq(systemPrompt, userPrompt)
}

export {
  generatePlacementScore,
  generateWeeklyInsight,
  generateFlashcards,
  tutorResponse,
  filterNewsRelevance,
  generateEmailDigest,
}