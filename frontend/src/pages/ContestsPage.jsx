import { useEffect, useState } from 'react'
import { useAppStore } from '../store/useAppStore'
import { fetchContests } from '../api'
import { Star, Clock, ExternalLink, RefreshCw, Zap, Trophy } from 'lucide-react'
import toast from 'react-hot-toast'

function CountdownTimer({ startTime }) {
  const [left, setLeft] = useState('')
  const [urgent, setUrgent] = useState(false)

  useEffect(() => {
    const tick = () => {
      const diff = new Date(startTime) - new Date()
      if (diff <= 0) { setLeft('Live Now'); setUrgent(true); return }
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const d = Math.floor(h / 24)
      setUrgent(d === 0 && h < 6)
      if (d > 0) setLeft(`${d}d ${h % 24}h`)
      else setLeft(`${h}h ${m}m`)
    }
    tick()
    const id = setInterval(tick, 60000)
    return () => clearInterval(id)
  }, [startTime])

  return (
    <span style={{
      fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16,
      color: urgent ? '#DC2626' : 'var(--green-dark)',
      display: 'flex', alignItems: 'center', gap: 4
    }}>
      {urgent && <span style={{ animation: 'pulse 1s ease-in-out infinite', display: 'inline-block' }}>⚡</span>}
      {left}
    </span>
  )
}

const PLATFORM_CONFIG = {
  LeetCode:   { bg: '#FEF9C3', border: '#EAB308', badge: 'badge-yellow', dot: '#EAB308', emoji: '🧩' },
  Codeforces: { bg: '#EFF8FF', border: '#3B82F6', badge: 'badge-sky',    dot: '#3B82F6', emoji: '⚔️' },
  default:    { bg: '#DCFCE7', border: '#22C55E', badge: 'badge-green',  dot: '#22C55E', emoji: '🏆' },
}

export default function ContestsPage() {
  const contests    = useAppStore(s => s.contests)
  const setContests = useAppStore(s => s.setContests)
  const [loading, setLoading]   = useState(false)
  const [platform, setPlatform] = useState('All')

  const load = async () => {
    setLoading(true)
    try { const r = await fetchContests(); setContests(r.data) }
    catch { toast.error('Failed to load contests') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const filtered = platform === 'All' ? contests : contests.filter(c => c.platform === platform)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div className="flex-between" style={{ flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <div className="pill-badge" style={{ fontSize: 12 }}>
              <span>Auto-synced</span>
            </div>
          </div>
          <h2 style={{ letterSpacing: '-0.02em', marginBottom: 4 }}>⭐ Upcoming Contests</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>LeetCode & Codeforces — live countdowns</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div className="tab-bar">
            {['All','LeetCode','Codeforces'].map(p => (
              <button key={p} className={`tab-btn${platform===p?' active':''}`} onClick={() => setPlatform(p)}>{p}</button>
            ))}
          </div>
          <button className="btn btn-ghost btn-sm" onClick={load} disabled={loading}>
            <RefreshCw size={14} className={loading ? 'anim-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Stats row */}
      {!loading && contests.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 14 }}>
          {[
            { label: 'Total Upcoming', value: contests.length, bg: '#DCFCE7', icon: '🗓' },
            { label: 'LeetCode', value: contests.filter(c=>c.platform==='LeetCode').length, bg: '#FEF9C3', icon: '🧩' },
            { label: 'Codeforces', value: contests.filter(c=>c.platform==='Codeforces').length, bg: '#EFF8FF', icon: '⚔️' },
          ].map(s => (
            <div key={s.label} className="card" style={{ background: s.bg, padding: '16px 20px' }}>
              <p style={{ fontSize: 22, marginBottom: 4 }}>{s.icon}</p>
              <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 26, color: 'var(--charcoal)' }}>{s.value}</p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Contest list */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[...Array(4)].map((_,i) => (
            <div key={i} className="card shimmer-bg" style={{ height: 100 }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">⭐</div>
          <h3 style={{ letterSpacing: '-0.01em' }}>No contests found</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No upcoming contests for this platform</p>
          <button className="btn btn-primary btn-sm" onClick={load}>
            <RefreshCw size={14} /> Reload
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {filtered.map((c, i) => {
            const theme = PLATFORM_CONFIG[c.platform] || PLATFORM_CONFIG.default
            return (
              <div
                key={i}
                className="card card-float anim-fade-up"
                style={{
                  background: theme.bg,
                  borderColor: theme.border,
                  boxShadow: `4px 4px 0px ${theme.border}`,
                  animationDelay: `${i*0.07}s`
                }}
              >
                <div className="flex-between" style={{ flexWrap: 'wrap', gap: 14 }}>
                  <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 12,
                      background: 'var(--white)',
                      border: `2px solid ${theme.border}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 20, flexShrink: 0
                    }}>
                      {theme.emoji}
                    </div>
                    <div>
                      <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 6, fontFamily: 'var(--font-display)', color: 'var(--charcoal)' }}>
                        {c.name}
                      </p>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                        <span className={`badge ${theme.badge}`}>{c.platform}</span>
                        <span style={{
                          fontSize: 12, color: 'var(--text-muted)',
                          display: 'flex', alignItems: 'center', gap: 4
                        }}>
                          <Clock size={12} /> {c.startTime}
                        </span>
                        {c.duration && (
                          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>· {c.duration}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.07em' }}>Starts in</p>
                      <CountdownTimer startTime={c.startTime} />
                    </div>
                    {c.url && (
                      <a href={c.url} target="_blank" rel="noreferrer" className="btn btn-dark btn-sm">
                        Register <ExternalLink size={12} />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Tips card */}
      <div className="card card-teal">
        <h4 style={{ marginBottom: 14, letterSpacing: '-0.01em' }}>📌 Contest Prep Tips</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            'Practice 2 mediums per day to maintain contest speed',
            'Review time complexity before submitting under pressure',
            'Pin Codeforces Div.2 and LeetCode Weekly on your calendar',
            'Contest ratings are included in your Placement Score',
          ].map((t, i) => (
            <div key={i} style={{
              display: 'flex', gap: 10, alignItems: 'flex-start',
              padding: '10px 14px',
              background: 'var(--white)',
              borderRadius: 10, border: '1.5px solid #CCFBF1'
            }}>
              <span style={{ color: '#0D9488', fontWeight: 700, fontSize: 13, flexShrink: 0, marginTop: 1 }}>→</span>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{t}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}