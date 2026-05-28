import { useEffect, useState } from 'react'
import { useAppStore } from '../store/useAppStore'
import { fetchNews } from '../api'
import { Newspaper, ExternalLink, RefreshCw, Plus, X } from 'lucide-react'
import toast from 'react-hot-toast'

export default function NewsPage() {
  const settings     = useAppStore(s => s.settings)
  const updateSettings = useAppStore(s => s.updateSettings)
  const news         = useAppStore(s => s.news)
  const setNews      = useAppStore(s => s.setNews)
  const [loading, setLoading]   = useState(false)
  const [newCo, setNewCo]       = useState('')

  const load = async () => {
    if (!settings.targetCompanies?.length) { toast.error('Add target companies first'); return }
    setLoading(true)
    try { const r = await fetchNews(settings.targetCompanies); setNews(r.data) }
    catch { toast.error('News fetch failed — check NewsAPI key') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const addCo = () => {
    if (!newCo.trim()) return
    const updated = [...(settings.targetCompanies || []), newCo.trim()]
    updateSettings({ targetCompanies: updated })
    setNewCo('')
  }

  const removeCo = (co) => {
    updateSettings({ targetCompanies: settings.targetCompanies.filter(c => c !== co) })
  }

  const RELEVANCE_COLORS = { high: '#4ade80', medium: '#fbbf24', low: 'var(--text-muted)' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="flex-between" style={{ flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ marginBottom: 4 }}>📰 Company News Feed</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>AI-filtered placement-relevant news</p>
        </div>
        <button className="btn btn-sky btn-sm" onClick={load} disabled={loading}>
          <RefreshCw size={14} className={loading ? 'anim-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Company management */}
      <div className="card">
        <h4 style={{ marginBottom: 14 }}>Target Companies</h4>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          {(settings.targetCompanies || []).map(co => (
            <div key={co} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', background: 'rgba(2,128,144,0.12)', border: '1px solid rgba(2,128,144,0.3)', borderRadius: 'var(--r-full)' }}>
              <span style={{ fontSize: 13, color: 'var(--teal)' }}>{co}</span>
              <button onClick={() => removeCo(co)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', lineHeight: 1 }}>
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <input className="input" placeholder="Add company (e.g. Atlassian)" value={newCo}
            onChange={e => setNewCo(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addCo()}
            style={{ maxWidth: 280 }} />
          <button className="btn btn-ghost btn-sm" onClick={addCo}><Plus size={14} /> Add</button>
        </div>
      </div>

      {/* News list */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[...Array(5)].map((_,i) => <div key={i} className="card shimmer-bg" style={{ height: 90 }} />)}
        </div>
      ) : news.length === 0 ? (
        <div className="card flex-center" style={{ height: 200, flexDirection: 'column', gap: 12 }}>
          <Newspaper size={36} style={{ color: 'var(--text-muted)' }} />
          <p style={{ color: 'var(--text-muted)' }}>No news loaded. Click Refresh to fetch.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {news.map((item, i) => (
            <div key={i} className="news-card anim-fade-up" style={{ animationDelay: `${i * 0.07}s` }}>
              {item.urlToImage && (
                <img src={item.urlToImage} alt="" style={{ width: 80, height: 64, objectFit: 'cover', borderRadius: 10, flexShrink: 0 }} onError={e=>e.target.style.display='none'} />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="flex-between" style={{ marginBottom: 6, flexWrap: 'wrap', gap: 6 }}>
                  <span className="badge badge-teal">{item.company || item.source?.name}</span>
                  {item.relevance && (
                    <span style={{ fontSize: 11, fontWeight: 600, color: RELEVANCE_COLORS[item.relevance] || 'var(--text-muted)' }}>
                      ● {item.relevance} relevance
                    </span>
                  )}
                </div>
                <a href={item.url} target="_blank" rel="noreferrer" className="truncate" style={{ display: 'block', fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', marginBottom: 4, textDecoration: 'none' }}>
                  {item.title}
                </a>
                <p className="truncate" style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.description}</p>
                <div className="flex-between" style={{ marginTop: 8 }}>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.publishedAt ? new Date(item.publishedAt).toLocaleDateString() : ''}</span>
                  <a href={item.url} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: 'var(--teal)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    Read <ExternalLink size={11} />
                  </a>
                </div>
                {item.aiSummary && (
                  <p style={{ marginTop: 8, fontSize: 12, color: 'var(--text-secondary)', background: 'rgba(2,128,144,0.08)', borderLeft: '2px solid var(--teal)', padding: '6px 10px', borderRadius: '0 8px 8px 0' }}>
                    🤖 {item.aiSummary}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
