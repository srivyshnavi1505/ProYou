import { useEffect, useState } from 'react'
import { useAppStore } from '../store/useAppStore'
import { fetchGithub, fetchLeetcode, getLinkedinLog, linkedinCheckin } from '../api'
import { Flame, GitBranch, Code2, Link2, Plus, CheckCircle, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'

function buildHeatmap(contributions = []) {
  const weeks = []
  const today = new Date()
  const start = new Date(today)
  start.setDate(start.getDate() - 6 * 7)
  const map = {}
  contributions.forEach(c => { map[c.date] = c.count })
  let cur = new Date(start)
  let week = []
  while (cur <= today) {
    const d = cur.toISOString().split('T')[0]
    const count = map[d] || 0
    week.push({ date: d, count })
    if (week.length === 7) { weeks.push(week); week = [] }
    cur.setDate(cur.getDate() + 1)
  }
  if (week.length) weeks.push(week)
  return weeks
}

function StreakHeatmap({ data = [], label }) {
  const weeks = buildHeatmap(data)
  const [hovered, setHovered] = useState(null)
  return (
    <div>
      <div style={{ display: 'flex', gap: 3, flexWrap: 'nowrap', overflowX: 'auto', paddingBottom: 6 }}>
        {weeks.map((week, wi) => (
          <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {week.map((day, di) => {
              const lvl = day.count === 0 ? 0 : day.count < 3 ? 1 : day.count < 6 ? 2 : day.count < 10 ? 3 : 4
              return (
                <div
                  key={di}
                  className={`streak-dot streak-${lvl}`}
                  title={`${day.date}: ${day.count}`}
                  onMouseEnter={() => setHovered(day)}
                  onMouseLeave={() => setHovered(null)}
                />
              )
            })}
          </div>
        ))}
      </div>
      {hovered && (
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6, fontWeight: 600 }}>
          📅 {hovered.date} — {hovered.count} {label}
        </p>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Less</span>
        {[0,1,2,3,4].map(l => <div key={l} className={`streak-dot streak-${l}`} style={{ width: 10, height: 10 }} />)}
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>More</span>
      </div>
    </div>
  )
}

function StatBadge({ val, label, icon: Icon, bg = '#DCFCE7', iconColor = '#22C55E' }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px',
      background: bg, border: '2px solid var(--charcoal)',
      borderRadius: 'var(--r-md)', boxShadow: 'var(--shadow-sm)'
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: 10,
        background: 'var(--white)', border: '1.5px solid var(--border-light)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
      }}>
        <Icon size={20} style={{ color: iconColor }} />
      </div>
      <div>
        <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, color: 'var(--charcoal)', lineHeight: 1 }}>
          {val ?? '—'}
        </p>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>{label}</p>
      </div>
    </div>
  )
}

export default function StreakPage() {
  const settings     = useAppStore(s => s.settings)
  const githubData   = useAppStore(s => s.githubData)
  const leetcodeData = useAppStore(s => s.leetcodeData)
  const setGithub    = useAppStore(s => s.setGithubData)
  const setLeetcode  = useAppStore(s => s.setLeetcodeData)

  const [ghLoading, setGhLoading] = useState(false)
  const [lcLoading, setLcLoading] = useState(false)
  const [liLog, setLiLog]         = useState([])
  const [checkin, setCheckin]     = useState({ type: 'post', note: '' })
  const [ciLoading, setCiLoading] = useState(false)

  const loadGH = async () => {
    if (!settings.githubUsername) { toast.error('Set GitHub username in Settings'); return }
    setGhLoading(true)
    try { const r = await fetchGithub(settings.githubUsername); setGithub(r.data) }
    catch { toast.error('GitHub fetch failed') }
    finally { setGhLoading(false) }
  }

  const loadLC = async () => {
    if (!settings.leetcodeUsername) { toast.error('Set LeetCode username in Settings'); return }
    setLcLoading(true)
    try { const r = await fetchLeetcode(settings.leetcodeUsername); setLeetcode(r.data) }
    catch { toast.error('LeetCode fetch failed') }
    finally { setLcLoading(false) }
  }

  const loadLiLog = async () => {
    try { const r = await getLinkedinLog(); setLiLog(r.data) } catch {}
  }

  const handleCheckin = async () => {
    setCiLoading(true)
    try {
      await linkedinCheckin(checkin)
      toast.success('LinkedIn activity logged! ✅')
      setCheckin({ type: 'post', note: '' })
      loadLiLog()
    } catch { toast.error('Check-in failed') }
    finally { setCiLoading(false) }
  }

  useEffect(() => { loadGH(); loadLC(); loadLiLog() }, [])

  const TYPES = ['post', 'comment', 'connection', 'application', 'DM']

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <div className="pill-badge" style={{ fontSize: 12 }}><span>Consistency Tracker</span></div>
        </div>
        <h2 style={{ letterSpacing: '-0.02em', marginBottom: 4 }}>🔥 Streak Dashboard</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Track your consistency across all platforms</p>
      </div>

      {/* GitHub */}
      <div className="card">
        <div className="flex-between" style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: '#F0FDF4', border: '2px solid var(--charcoal)',
              boxShadow: 'var(--shadow-sm)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <GitBranch size={20} color="var(--charcoal)" />
            </div>
            <div>
              <h3 style={{ letterSpacing: '-0.01em' }}>GitHub Activity</h3>
              {settings.githubUsername && (
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>@{settings.githubUsername}</p>
              )}
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={loadGH} disabled={ghLoading}>
            <RefreshCw size={13} className={ghLoading ? 'anim-spin' : ''} />
            {ghLoading ? 'Loading…' : 'Refresh'}
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 12, marginBottom: 24 }}>
          <StatBadge val={githubData?.streak} label="Day streak" icon={Flame} bg="#FFF4EC" iconColor="#F97316" />
          <StatBadge val={githubData?.totalContributions} label="Total contributions" icon={GitBranch} bg="#DCFCE7" iconColor="#22C55E" />
          <StatBadge val={githubData?.publicRepos} label="Public repos" icon={GitBranch} bg="#EFF8FF" iconColor="#3B82F6" />
          <StatBadge val={githubData?.stars} label="Total stars" icon={Flame} bg="#FEF9C3" iconColor="#EAB308" />
        </div>
        <h4 style={{ marginBottom: 14, fontSize: 14, letterSpacing: '-0.01em' }}>Contribution Heatmap</h4>
        <StreakHeatmap data={githubData?.contributions || []} label="contributions" />
      </div>

      {/* LeetCode */}
      <div className="card">
        <div className="flex-between" style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: '#EFF8FF', border: '2px solid var(--charcoal)',
              boxShadow: 'var(--shadow-sm)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Code2 size={20} color="#3B82F6" />
            </div>
            <div>
              <h3 style={{ letterSpacing: '-0.01em' }}>LeetCode Progress</h3>
              {settings.leetcodeUsername && (
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>@{settings.leetcodeUsername}</p>
              )}
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={loadLC} disabled={lcLoading}>
            <RefreshCw size={13} className={lcLoading ? 'anim-spin' : ''} />
            {lcLoading ? 'Loading…' : 'Refresh'}
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 12, marginBottom: 24 }}>
          <StatBadge val={leetcodeData?.streak} label="Day streak" icon={Flame} bg="#FFF4EC" iconColor="#F97316" />
          <StatBadge val={leetcodeData?.totalSolved} label="Total solved" icon={Code2} bg="#EFF8FF" iconColor="#3B82F6" />
          <StatBadge val={leetcodeData?.easySolved} label="Easy" icon={Code2} bg="#DCFCE7" iconColor="#22C55E" />
          <StatBadge val={leetcodeData?.mediumSolved} label="Medium" icon={Code2} bg="#FEF9C3" iconColor="#EAB308" />
          <StatBadge val={leetcodeData?.hardSolved} label="Hard" icon={Code2} bg="#FEE2E2" iconColor="#EF4444" />
        </div>
        <div style={{ marginBottom: 24 }}>
          {[
            { d: 'Easy',   v: leetcodeData?.easySolved,   total: leetcodeData?.easyTotal||800,   color: '#22C55E' },
            { d: 'Medium', v: leetcodeData?.mediumSolved, total: leetcodeData?.mediumTotal||1700, color: '#EAB308' },
            { d: 'Hard',   v: leetcodeData?.hardSolved,   total: leetcodeData?.hardTotal||700,   color: '#EF4444' },
          ].map(({ d, v, total, color }) => (
            <div key={d} style={{ marginBottom: 12 }}>
              <div className="flex-between" style={{ marginBottom: 5 }}>
                <span style={{ fontSize: 13, color, fontWeight: 700, fontFamily: 'var(--font-display)' }}>{d}</span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>{v ?? 0} / {total}</span>
              </div>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${((v||0)/total)*100}%`, background: color }} />
              </div>
            </div>
          ))}
        </div>
        <h4 style={{ marginBottom: 14, fontSize: 14, letterSpacing: '-0.01em' }}>Submission Heatmap</h4>
        <StreakHeatmap data={leetcodeData?.calendar || []} label="submissions" />
      </div>

      {/* LinkedIn */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: '#DBEAFE', border: '2px solid var(--charcoal)',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Link2 size={20} color="#1D4ED8" />
          </div>
          <div>
            <h3 style={{ letterSpacing: '-0.01em' }}>LinkedIn Activity Log</h3>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Manual check-ins for your soft skills</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, display: 'block', fontFamily: 'var(--font-display)' }}>
              Activity Type
            </label>
            <select className="input" value={checkin.type} onChange={e => setCheckin(p=>({...p,type:e.target.value}))}>
              {TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, display: 'block', fontFamily: 'var(--font-display)' }}>
              Note (optional)
            </label>
            <input className="input" placeholder="e.g. Posted about DSA tips" value={checkin.note}
              onChange={e => setCheckin(p=>({...p,note:e.target.value}))} />
          </div>
        </div>
        <button className="btn btn-primary btn-sm" onClick={handleCheckin} disabled={ciLoading}>
          <Plus size={14} /> {ciLoading ? 'Logging…' : 'Log Activity'}
        </button>

        {liLog.length > 0 && (
          <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <h4 style={{ fontSize: 14, marginBottom: 4, letterSpacing: '-0.01em' }}>Recent Activity</h4>
            {liLog.slice(0,7).map((l, i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 14px',
                background: 'var(--cream)',
                borderRadius: 10, border: '1.5px solid var(--border-light)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <CheckCircle size={15} color="var(--green-dark)" />
                  <span style={{ fontSize: 13, fontWeight: 600, textTransform: 'capitalize', fontFamily: 'var(--font-display)' }}>{l.type}</span>
                  {l.note && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>— {l.note}</span>}
                </div>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>
                  {new Date(l.date).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}