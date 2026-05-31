import { useState } from 'react'
import { useAppStore } from '../store/useAppStore'
import { fetchScore, fetchInsight } from '../api'
import { Trophy, Zap, ChevronRight, Sparkles } from 'lucide-react'
import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis } from 'recharts'
import toast from 'react-hot-toast'

function ScoreRing({ score, color }) {
  const data = [{ value: score, fill: color }]
  return (
    <div style={{ position: 'relative', width: 200, height: 200 }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart cx="50%" cy="50%" innerRadius="68%" outerRadius="90%" data={data} startAngle={90} endAngle={90 - (score / 100) * 360}>
          <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
          <RadialBar background={{ fill: 'var(--cream-dark)' }} dataKey="value" cornerRadius={12} />
        </RadialBarChart>
      </ResponsiveContainer>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{
          fontFamily: 'var(--font-display)', fontSize: 48, fontWeight: 800,
          color: 'var(--charcoal)', lineHeight: 1
        }}>{score}</span>
        <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>/ 100</span>
      </div>
    </div>
  )
}

// Role-specific category definitions — matches aiService.js schemas exactly
const ROLE_CATEGORIES = {
  'ML Engineer': [
    { key: 'ml_knowledge',    label: 'ML Knowledge',       icon: '🧠', color: '#22C55E', bg: '#DCFCE7' },
    { key: 'coding_python',   label: 'Coding / Python',    icon: '🐍', color: '#3B82F6', bg: '#EFF8FF' },
    { key: 'research_kaggle', label: 'Research / Kaggle',  icon: '📊', color: '#A855F7', bg: '#FAF5FF' },
    { key: 'math_depth',      label: 'Math Depth',         icon: '📐', color: '#EAB308', bg: '#FEF9C3' },
  ],
  'PM': [
    { key: 'product_sense',   label: 'Product Sense',      icon: '💡', color: '#22C55E', bg: '#DCFCE7' },
    { key: 'communication',   label: 'Communication',      icon: '🗣️', color: '#3B82F6', bg: '#EFF8FF' },
    { key: 'analytical',      label: 'Analytical',         icon: '📈', color: '#A855F7', bg: '#FAF5FF' },
    { key: 'behavioral',      label: 'Behavioral',         icon: '🤝', color: '#EAB308', bg: '#FEF9C3' },
  ],
  'Data Analyst': [
    { key: 'sql_skills',      label: 'SQL Skills',         icon: '🗄️', color: '#22C55E', bg: '#DCFCE7' },
    { key: 'statistics',      label: 'Statistics',         icon: '📊', color: '#3B82F6', bg: '#EFF8FF' },
    { key: 'visualization',   label: 'Visualization',      icon: '📉', color: '#A855F7', bg: '#FAF5FF' },
    { key: 'communication',   label: 'Communication',      icon: '🗣️', color: '#EAB308', bg: '#FEF9C3' },
  ],
  'DevOps': [
    { key: 'infrastructure',  label: 'Infrastructure',     icon: '🏗️', color: '#22C55E', bg: '#DCFCE7' },
    { key: 'automation_ci',   label: 'Automation / CI',    icon: '⚙️', color: '#3B82F6', bg: '#EFF8FF' },
    { key: 'cloud_certs',     label: 'Cloud / Certs',      icon: '☁️', color: '#A855F7', bg: '#FAF5FF' },
    { key: 'reliability',     label: 'Reliability / SRE',  icon: '🔧', color: '#EAB308', bg: '#FEF9C3' },
  ],
  'Frontend': [
    { key: 'ui_ux_sense',     label: 'UI/UX Sense',        icon: '🎨', color: '#22C55E', bg: '#DCFCE7' },
    { key: 'framework_depth', label: 'Framework Depth',    icon: '⚛️', color: '#3B82F6', bg: '#EFF8FF' },
    { key: 'portfolio',       label: 'Portfolio',          icon: '💼', color: '#A855F7', bg: '#FAF5FF' },
    { key: 'problem_solving', label: 'Problem Solving',    icon: '🧩', color: '#EAB308', bg: '#FEF9C3' },
  ],
}

// Default for SWE / Backend / Full Stack
const DEFAULT_CATEGORIES = [
  { key: 'dsa',            label: 'DSA & LeetCode',   icon: '🧠', color: '#22C55E', bg: '#DCFCE7' },
  { key: 'system_design',  label: 'System Design',    icon: '🏛️', color: '#3B82F6', bg: '#EFF8FF' },
  { key: 'github_projects',label: 'GitHub Projects',  icon: '💻', color: '#A855F7', bg: '#FAF5FF' },
  { key: 'consistency',    label: 'Consistency',      icon: '🔥', color: '#EAB308', bg: '#FEF9C3' },
]

const HOW_IT_WORKS = {
  'ML Engineer': {
    ml_knowledge:    'ML concepts, architectures, frameworks inferred from LeetCode hard count and GitHub activity',
    coding_python:   'LeetCode fluency + estimated Python/numpy proficiency from repo count',
    research_kaggle: 'Estimated from GitHub project count and stars — conservative if limited data',
    math_depth:      'Inferred from hard problem count and overall LeetCode depth',
  },
  'PM': {
    product_sense:   'Inferred from GitHub activity as a proxy for technical curiosity',
    communication:   'LinkedIn check-ins and activity logs this month',
    analytical:      'LeetCode medium/hard count as analytical thinking signal',
    behavioral:      'Estimated — limited signals available for PM behavioral assessment',
  },
  'Data Analyst': {
    sql_skills:      'Inferred from LeetCode medium/hard — SQL-specific problems not directly detectable',
    statistics:      'Estimated from analytical problem-solving signals in LeetCode',
    visualization:   'GitHub public repo count and project quality',
    communication:   'LinkedIn check-ins and activity logs',
  },
  'DevOps': {
    infrastructure:  'System understanding inferred from GitHub contributions and repo complexity',
    automation_ci:   'GitHub commit frequency and repo count as automation signal',
    cloud_certs:     'Conservative estimate — cannot directly verify cloud certifications',
    reliability:     'Inferred from GitHub consistency and contribution patterns',
  },
  'Frontend': {
    ui_ux_sense:     'Inferred from GitHub stars and public repo count',
    framework_depth: 'Estimated from LeetCode and GitHub activity patterns',
    portfolio:       'GitHub public repos and stars as portfolio signal',
    problem_solving: 'LeetCode performance — frontend-relevant algorithm patterns',
  },
}

const DEFAULT_HOW_IT_WORKS = {
  dsa:             'LeetCode solved count by difficulty, streak, acceptance rate',
  system_design:   'Inferred from hard problem count and GitHub repo complexity',
  github_projects: 'Contribution streak, repo quality, commit frequency, stars',
  consistency:     'Combined GitHub + LeetCode streak and daily activity',
}

export default function ScorePage() {
  const settings       = useAppStore(s => s.settings)
  const githubData     = useAppStore(s => s.githubData)
  const leetcodeData   = useAppStore(s => s.leetcodeData)
  const placementScore = useAppStore(s => s.placementScore)
  const weeklyInsight  = useAppStore(s => s.weeklyInsight)
  const setScore       = useAppStore(s => s.setPlacementScore)
  const setInsight     = useAppStore(s => s.setWeeklyInsight)
  const setAlerts      = useAppStore(s => s.setAlerts)
  const [loading, setLoading]         = useState(false)
  const [loadingStep, setLoadingStep] = useState('')

  const role       = settings.role || 'SWE'
  const categories = ROLE_CATEGORIES[role] || DEFAULT_CATEGORIES
  const howItWorks = HOW_IT_WORKS[role]    || DEFAULT_HOW_IT_WORKS

  const generate = async () => {
    setLoading(true)
    try {
      const payload = {
        role,
        github:          githubData,
        leetcode:        leetcodeData,
        targetCompanies: settings.targetCompanies,
      }

      setLoadingStep('Calculating score…')
      const scoreRes = await fetchScore(payload)
      setScore(scoreRes.data)

      await new Promise(res => setTimeout(res, 1000))

      setLoadingStep('Generating insight…')
      const insightRes = await fetchInsight(payload)
      setInsight(insightRes.data.insight)

      if (scoreRes.data?.total < 50) {
        setAlerts([{ type: 'warn', msg: 'Score below 50 — time to accelerate! 🚀' }])
      }
      toast.success('Score generated! 🎯')
    } catch (err) {
      const status = err?.response?.status
      if (status === 429) {
        toast.error('Rate limit hit — wait a moment and try again ⏳')
      } else {
        toast.error('AI service error — check your API key in backend .env')
      }
    } finally {
      setLoading(false)
      setLoadingStep('')
    }
  }

  const score   = placementScore?.total ?? null
  const color   = score === null ? '#22C55E' : score >= 75 ? '#22C55E' : score >= 50 ? '#EAB308' : '#EF4444'
  const label   = score === null ? '' : score >= 75 ? 'Placement Ready! 🚀' : score >= 50 ? 'On Track 📈' : 'Needs Improvement 🔨'
  const bgColor = score === null ? 'var(--white)' : score >= 75 ? '#DCFCE7' : score >= 50 ? '#FEF9C3' : '#FEE2E2'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <div className="pill-badge" style={{ fontSize: 12 }}><span>AI-Powered · {role}</span></div>
        </div>
        <h2 style={{ letterSpacing: '-0.02em', marginBottom: 4 }}>🏆 Placement Readiness Score</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Role-specific evaluation across 4 dimensions</p>
      </div>

      {/* Score card */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 48, flexWrap: 'wrap', background: bgColor }}>
        {/* Ring */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          {score !== null ? (
            <ScoreRing score={score} color={color} />
          ) : (
            <div style={{
              width: 200, height: 200, borderRadius: '50%',
              border: '3px dashed var(--border-light)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexDirection: 'column', gap: 10, background: 'var(--cream)'
            }}>
              <Trophy size={40} style={{ color: 'var(--text-muted)' }} />
              <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Not yet run</span>
            </div>
          )}
          {label && (
            <div style={{
              padding: '6px 18px',
              background: 'var(--white)',
              border: `2px solid ${color}`,
              borderRadius: 'var(--r-full)',
              fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color,
              boxShadow: `3px 3px 0px ${color}`
            }}>{label}</div>
          )}
        </div>

        {/* Breakdown */}
        <div style={{ flex: 1, minWidth: 280 }}>
          <h3 style={{ marginBottom: 22, letterSpacing: '-0.01em' }}>Category Breakdown</h3>
          {categories.map(({ key, label: catLabel, icon, color: catColor, bg: catBg }) => {
            const val = placementScore?.breakdown?.[key] ?? null
            const pct = val !== null ? (val / 25) * 100 : 0
            return (
              <div key={key} style={{ marginBottom: 16 }}>
                <div className="flex-between" style={{ marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: 8,
                      background: catBg, border: '1.5px solid var(--border-light)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 14
                    }}>{icon}</div>
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>{catLabel}</span>
                  </div>
                  <span style={{
                    fontSize: 14, fontWeight: 800,
                    color: 'var(--charcoal)',
                    fontFamily: 'var(--font-display)',
                    background: catBg, padding: '2px 10px',
                    borderRadius: 'var(--r-full)', border: '1.5px solid var(--border-light)'
                  }}>{val ?? '?'}/25</span>
                </div>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${pct}%`, background: catColor }} />
                </div>
              </div>
            )
          })}
        </div>

        <div style={{ alignSelf: 'flex-end', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
          {loading && loadingStep && (
            <p style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>{loadingStep}</p>
          )}
          <button className="btn btn-primary btn-lg" onClick={generate} disabled={loading}>
            <Sparkles size={18} className={loading ? 'anim-spin' : ''} />
            {loading ? 'Analyzing…' : 'Generate AI Score'}
          </button>
        </div>
      </div>

      {/* Data warning for non-SDE roles */}
      {placementScore?.dataWarning && (
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: 10,
          padding: '12px 16px',
          background: '#FEF9C3',
          border: '1.5px solid #EAB308',
          borderRadius: 12,
        }}>
          <span style={{ fontSize: 16, flexShrink: 0 }}>⚠️</span>
          <span style={{ fontSize: 13, color: '#92400E', lineHeight: 1.6 }}>
            {placementScore.dataWarning}
          </span>
        </div>
      )}

      {/* AI Advice */}
      {placementScore?.advice && (
        <div className="ai-card anim-fade-up">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 9,
              background: 'var(--accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '2px solid rgba(253,248,230,0.3)'
            }}>
              <Zap size={16} color="var(--charcoal)" />
            </div>
            <h4 style={{ color: 'var(--cream)', letterSpacing: '-0.01em' }}>
              AI Advice for {role}
            </h4>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {placementScore.advice.map((tip, i) => (
              <div key={i} style={{
                display: 'flex', gap: 12, alignItems: 'flex-start',
                padding: '12px 16px',
                background: 'rgba(253,248,230,0.07)',
                border: '1.5px solid rgba(253,248,230,0.12)',
                borderRadius: 12
              }}>
                <ChevronRight size={16} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: 2 }} />
                <span style={{ fontSize: 14, color: 'rgba(253,248,230,0.85)', lineHeight: 1.6 }}>{tip}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Weekly insight — full text, no truncation */}
      {weeklyInsight && (
        <div className="card card-teal anim-fade-up">
          <h4 style={{ marginBottom: 12, letterSpacing: '-0.01em' }}>📊 Weekly Insight</h4>
          <p style={{
            fontSize: 14,
            color: 'var(--text-secondary)',
            lineHeight: 1.75,
            whiteSpace: 'pre-wrap',
            overflow: 'visible',
            display: 'block',
            WebkitLineClamp: 'unset',
            WebkitBoxOrient: 'unset',
          }}>{weeklyInsight}</p>
        </div>
      )}

      {/* How score is calculated */}
      <div className="card">
        <h4 style={{ marginBottom: 18, letterSpacing: '-0.01em' }}>How is the score calculated?</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))', gap: 14 }}>
          {categories.map(({ key, label: catLabel, icon, color: catColor, bg: catBg }) => (
            <div key={key} style={{
              padding: '16px 18px',
              background: catBg,
              borderRadius: 'var(--r-md)',
              border: '2px solid var(--charcoal)',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <p style={{ fontSize: 22, marginBottom: 8 }}>{icon}</p>
              <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--charcoal)', marginBottom: 4, fontFamily: 'var(--font-display)' }}>
                {catLabel} (25pts)
              </p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                {howItWorks[key] || ''}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}