import { useEffect, useState } from 'react'
import { useAppStore } from '../store/useAppStore'
import { fetchGithub, fetchLeetcode, fetchScore, fetchInsight, fetchContests, fetchFact } from '../api'
import { Flame, Trophy, Code2, Star, TrendingUp, TrendingDown, AlertTriangle, Zap, RefreshCw, ArrowRight, Brain, Target, Clock } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import toast from 'react-hot-toast'

const MOCK_WEEKLY = [
  { day: 'Mon', github: 3, leetcode: 2 },
  { day: 'Tue', github: 5, leetcode: 4 },
  { day: 'Wed', github: 2, leetcode: 1 },
  { day: 'Thu', github: 6, leetcode: 3 },
  { day: 'Fri', github: 4, leetcode: 5 },
  { day: 'Sat', github: 1, leetcode: 6 },
  { day: 'Sun', github: 3, leetcode: 2 },
]

function StatCard({ label, value, sub, icon: Icon, bg = '#DCFCE7', iconBg = '#22C55E', trend }) {
  return (
    <div className="card card-float" style={{ background: bg, minHeight: 130 }}>
      <div className="flex-between" style={{ marginBottom: 14 }}>
        <span style={{
          fontSize: 11, fontWeight: 700, color: 'var(--text-muted)',
          textTransform: 'uppercase', letterSpacing: '.1em',
          fontFamily: 'var(--font-display)'
        }}>{label}</span>
        <div style={{
          width: 38, height: 38, borderRadius: 10,
          background: iconBg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '2px solid var(--charcoal)',
          boxShadow: '2px 2px 0px var(--charcoal)',
        }}>
          <Icon size={18} color="var(--charcoal)" />
        </div>
      </div>
      <div style={{
        fontFamily: 'var(--font-display)', fontSize: '2.4rem',
        fontWeight: 800, color: 'var(--charcoal)', lineHeight: 1
      }}>{value ?? '—'}</div>
      {sub && (
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
          {trend === 'up' && <TrendingUp size={12} color="var(--green-dark)" />}
          {trend === 'down' && <TrendingDown size={12} color="#DC2626" />}
          {sub}
        </p>
      )}
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'var(--white)', border: '2px solid var(--charcoal)',
      borderRadius: 12, padding: '10px 14px', fontSize: 13,
      boxShadow: 'var(--shadow-md)'
    }}>
      <p style={{ color: 'var(--text-primary)', fontWeight: 700, marginBottom: 6, fontFamily: 'var(--font-display)' }}>{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color, fontWeight: 600 }}>{p.name}: {p.value}</p>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const settings        = useAppStore(s => s.settings)
  const githubData      = useAppStore(s => s.githubData)
  const leetcodeData    = useAppStore(s => s.leetcodeData)
  const placementScore  = useAppStore(s => s.placementScore)
  const weeklyInsight   = useAppStore(s => s.weeklyInsight)
  const contests        = useAppStore(s => s.contests)
  const alerts          = useAppStore(s => s.alerts)
  const setGithubData   = useAppStore(s => s.setGithubData)
  const setLeetcodeData = useAppStore(s => s.setLeetcodeData)
  const setPlacementScore = useAppStore(s => s.setPlacementScore)
  const setWeeklyInsight  = useAppStore(s => s.setWeeklyInsight)
  const setContests     = useAppStore(s => s.setContests)
  const setAlerts       = useAppStore(s => s.setAlerts)
  const user            = useAppStore(s => s.user)

  const [loading, setLoading]         = useState(false)
  const [fact, setFact]               = useState(null)
  const [scoreLoading, setScoreLoading] = useState(false)

  const loadFact = async () => {
    try { const r = await fetchFact(); setFact(r.data.fact) }
    catch { setFact('Consistent daily practice for 45 days can significantly improve your chances of landing top tech roles.') }
  }

  const loadData = async () => {
    if (!settings.githubUsername && !settings.leetcodeUsername) return
    setLoading(true)
    try {
      const promises = []
      if (settings.githubUsername) promises.push(fetchGithub(settings.githubUsername).then(r => setGithubData(r.data)).catch(() => {}))
      if (settings.leetcodeUsername) promises.push(fetchLeetcode(settings.leetcodeUsername).then(r => setLeetcodeData(r.data)).catch(() => {}))
      await Promise.all(promises)
    } finally { setLoading(false) }
  }

  const loadScore = async () => {
    setScoreLoading(true)
    try {
      const payload = { role: settings.role, github: githubData, leetcode: leetcodeData, targetCompanies: settings.targetCompanies }
      const [scoreRes, insightRes] = await Promise.all([fetchScore(payload), fetchInsight(payload)])
      setPlacementScore(scoreRes.data)
      setWeeklyInsight(insightRes.data.insight)
      if (scoreRes.data?.total < 50) {
        setAlerts([{ type: 'warn', msg: 'Your placement score dropped below 50. Time to grind! 💪' }])
      }
    } catch { toast.error('Could not load AI score — check API config') }
    finally { setScoreLoading(false) }
  }

  useEffect(() => {
    loadData()
    fetchContests().then(r => setContests(r.data)).catch(() => {})
    loadFact()
  }, [])

  const scoreVal   = placementScore?.total ?? null
  const scoreColor = scoreVal >= 75 ? '#22C55E' : scoreVal >= 50 ? '#EAB308' : '#EF4444'
  const hour       = new Date().getHours()
  const greeting   = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* ── Header ── */}
      <div className="flex-between" style={{ flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <div className="pill-badge" style={{ fontSize: 12 }}>
              <span>AI Placement OS</span>
            </div>
          </div>
          <h2 style={{ letterSpacing: '-0.02em', marginBottom: 4 }}>
            {greeting},{' '}
            <span style={{ color: 'var(--accent)' }}>{user?.name?.split(' ')[0] || 'Coder'}</span> 👋
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            Role target:{' '}
            <span className="badge badge-dark" style={{ marginLeft: 4 }}>{settings.role}</span>
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-ghost btn-sm" onClick={loadData} disabled={loading}>
            <RefreshCw size={14} className={loading ? 'anim-spin' : ''} /> Refresh
          </button>
          <button className="btn btn-primary btn-sm" onClick={loadScore} disabled={scoreLoading}>
            <Zap size={14} className={scoreLoading ? 'anim-spin' : ''} />
            {scoreLoading ? 'Analyzing…' : 'Run AI Score'}
          </button>
        </div>
      </div>

      {/* ── Alerts ── */}
      {alerts.map((a, i) => (
        <div key={i} className={`alert-banner alert-${a.type} anim-fade-in`}>
          <AlertTriangle size={16} /> {a.msg}
        </div>
      ))}

      {/* ── Today's Focus (AI briefing card) ── */}
      <div className="ai-card anim-fade-up">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: 'var(--accent)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '2px solid rgba(253,248,230,0.3)'
              }}>
                <Brain size={16} color="var(--charcoal)" />
              </div>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: 'var(--accent)' }}>
                Today's AI Briefing
              </span>
            </div>
            <h3 style={{ color: 'var(--cream)', fontSize: '1.3rem', marginBottom: 8, letterSpacing: '-0.01em' }}>
              {weeklyInsight
                ? weeklyInsight.substring(0, 100) + (weeklyInsight.length > 100 ? '…' : '')
                : 'Run your AI Score to get personalized insights and today\'s focus areas.'}
            </h3>
            {!weeklyInsight && (
              <button className="btn btn-sm" onClick={loadScore} disabled={scoreLoading} style={{
                background: 'var(--accent)', color: 'var(--charcoal)',
                border: '2px solid rgba(253,248,230,0.4)',
                marginTop: 4
              }}>
                <Zap size={13} /> Generate Insights
              </button>
            )}
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {[
              { label: 'Momentum', value: githubData?.streak ? '🔥 Strong' : '📉 Build It', bg: '#22C55E' },
              { label: 'Readiness', value: scoreVal ? `${scoreVal}/100` : 'Not Run', bg: '#A855F7' },
            ].map(item => (
              <div key={item.label} style={{
                background: 'rgba(253,248,230,0.08)', border: '1.5px solid rgba(253,248,230,0.15)',
                borderRadius: 12, padding: '12px 16px', minWidth: 110
              }}>
                <p style={{ fontSize: 11, color: 'rgba(253,248,230,0.5)', fontWeight: 600, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '.08em' }}>{item.label}</p>
                <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: 'var(--cream)' }}>{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(185px,1fr))', gap: 16 }}>
        <StatCard
          label="GitHub Streak"
          value={githubData?.streak ?? (loading ? '…' : '—')}
          sub="days consecutive"
          icon={Flame}
          bg="#FFF4EC"
          iconBg="#FDBA74"
          trend="up"
        />
        <StatCard
          label="LeetCode Solved"
          value={leetcodeData?.totalSolved ?? (loading ? '…' : '—')}
          sub={`${leetcodeData?.easySolved ?? 0}E · ${leetcodeData?.mediumSolved ?? 0}M · ${leetcodeData?.hardSolved ?? 0}H`}
          icon={Code2}
          bg="#EFF8FF"
          iconBg="#93C5FD"
        />
        <StatCard
          label="Placement Score"
          value={scoreVal !== null ? `${scoreVal}` : '—'}
          sub={scoreVal !== null ? (scoreVal >= 75 ? '🟢 Strong' : scoreVal >= 50 ? '🟡 Growing' : '🔴 Needs work') : 'Run AI Score'}
          icon={Trophy}
          bg={scoreVal !== null ? (scoreVal >= 75 ? '#DCFCE7' : scoreVal >= 50 ? '#FEF9C3' : '#FEE2E2') : '#F5F0E8'}
          iconBg={scoreVal !== null ? scoreColor : '#22C55E'}
        />
        <StatCard
          label="Upcoming Contests"
          value={contests?.length ?? '—'}
          sub="auto-synced"
          icon={Star}
          bg="#FAF5FF"
          iconBg="#E9D5FF"
        />
      </div>

      {/* ── Charts row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
        {/* Activity chart */}
        <div className="card">
          <div className="flex-between" style={{ marginBottom: 20 }}>
            <h4 style={{ letterSpacing: '-0.01em' }}>Weekly Activity</h4>
            <span className="badge badge-green">This Week</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={MOCK_WEEKLY}>
              <defs>
                <linearGradient id="gGH" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22C55E" stopOpacity={0.3}/>
                  <stop offset="100%" stopColor="#22C55E" stopOpacity={0.02}/>
                </linearGradient>
                <linearGradient id="gLC" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.3}/>
                  <stop offset="100%" stopColor="#3B82F6" stopOpacity={0.02}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(26,26,26,0.07)" />
              <XAxis dataKey="day" tick={{ fill: 'var(--text-muted)', fontSize: 12, fontFamily: 'var(--font-display)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="github" name="GitHub" stroke="#22C55E" fill="url(#gGH)" strokeWidth={2.5} dot={false} />
              <Area type="monotone" dataKey="leetcode" name="LeetCode" stroke="#3B82F6" fill="url(#gLC)" strokeWidth={2.5} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Score breakdown */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="flex-between">
            <h4 style={{ letterSpacing: '-0.01em' }}>Score Breakdown</h4>
            <Target size={16} color="var(--text-muted)" />
          </div>
          {placementScore ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {Object.entries(placementScore.breakdown || {}).map(([k, v]) => (
                <div key={k}>
                  <div className="flex-between" style={{ marginBottom: 5 }}>
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)', textTransform: 'capitalize', fontWeight: 600 }}>{k}</span>
                    <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>{v}/25</span>
                  </div>
                  <div className="progress-track"><div className="progress-fill" style={{ width: `${(v/25)*100}%` }} /></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state" style={{ flex: 1, padding: '28px 16px' }}>
              <div className="empty-state-icon">🎯</div>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.6 }}>
                Click "Run AI Score" to generate your placement readiness breakdown
              </p>
              <button className="btn btn-primary btn-sm" onClick={loadScore} disabled={scoreLoading}>
                <Zap size={13} /> Run AI Score
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Bottom row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Upcoming contests */}
        <div className="card">
          <div className="flex-between" style={{ marginBottom: 16 }}>
            <h4 style={{ letterSpacing: '-0.01em' }}>Upcoming Contests</h4>
            <span className="badge badge-lilac">{contests?.length ?? 0} scheduled</span>
          </div>
          {contests?.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {contests.slice(0, 4).map((c, i) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '12px 14px',
                  background: 'var(--cream)',
                  borderRadius: 12, border: '1.5px solid var(--border-light)'
                }}>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>{c.name}</p>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{c.platform} · {c.startTime}</p>
                  </div>
                  <span className={`badge ${c.platform === 'LeetCode' ? 'badge-sky' : 'badge-yellow'}`}>{c.duration}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state" style={{ padding: '32px 16px' }}>
              <div className="empty-state-icon">⭐</div>
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No contests loaded yet</p>
            </div>
          )}
        </div>

        {/* Fun fact */}
        <div className="card card-green">
          <div className="flex-between" style={{ marginBottom: 14 }}>
            <h4 style={{ letterSpacing: '-0.01em' }}>💡 Tech Fact</h4>
            <button className="btn btn-ghost btn-sm" onClick={loadFact} style={{ borderColor: 'var(--green-dark)' }}>
              <RefreshCw size={13} />
            </button>
          </div>
          <p style={{ fontSize: 14, color: 'var(--green-dark)', lineHeight: 1.75, flex: 1, fontWeight: 500 }}>
            {fact || 'Loading an interesting fact…'}
          </p>
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1.5px solid var(--green-muted)' }}>
            <p style={{ fontSize: 12, color: 'var(--green-dark)', fontWeight: 600, opacity: 0.7 }}>
              💡 Daily tech trivia to keep you sharp
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}