import { useState, useEffect } from 'react'
import { fetchFact } from '../api'
import { Lightbulb, RefreshCw } from 'lucide-react'

const STATIC_FACTS = [
  { fact: "Google's first tweet was 'I\'m 01100110 01100101 01100101 01101100 01101001 01101110 01100111 00100000 01101100 01110101 01100011 01101011 01111001 00001010' — which is 'feeling lucky' in binary.", category: 'Tech History' },
  { fact: 'The first computer bug was an actual bug — a moth was found stuck in a relay in Harvard\'s Mark II computer in 1947. Grace Hopper\'s team taped it to the logbook.', category: 'Fun History' },
  { fact: 'Amazon deploys new code every 11.7 seconds on average. That\'s over 7,500 deployments per day.', category: 'Engineering' },
  { fact: 'The word "algorithm" comes from 9th-century Persian mathematician Muhammad ibn Musa al-Khwarizmi. His Latinized name became "Algoritmi".', category: 'CS Origins' },
  { fact: 'Git was created by Linus Torvalds in just 10 days in April 2005 after BitKeeper (used for Linux kernel) revoked its free license.', category: 'Tools' },
  { fact: 'Stack Overflow gets ~50 million unique visitors per month. Yet 80% of developers say they are "self-taught" primarily.', category: 'Community' },
  { fact: 'The first iPhone had no App Store — it launched on June 29, 2007. The App Store didn\'t arrive until July 2008 with iOS 2.0.', category: 'Product' },
  { fact: 'Moore\'s Law predicted transistor count doubles every ~2 years. Apple\'s M2 chip has 20 billion transistors — up from 4 million in the Intel 486 in 1989.', category: 'Hardware' },
  { fact: 'The Python language was named after Monty Python\'s Flying Circus — not the snake. Guido van Rossum wanted a short, unique name.', category: 'Languages' },
  { fact: 'Netflix saves ~$1 billion/year by recommending shows that keep users subscribed — their recommendation algorithm handles 80% of watch time.', category: 'ML Impact' },
]

const CATEGORIES = ['All', ...new Set(STATIC_FACTS.map(f => f.category))]

export default function FactsPage() {
  const [facts, setFacts]         = useState(STATIC_FACTS)
  const [current, setCurrent]     = useState(0)
  const [category, setCategory]   = useState('All')
  const [loading, setLoading]     = useState(false)
  const [revealed, setRevealed]   = useState(false)

  const filtered = category === 'All' ? facts : facts.filter(f => f.category === category)

  const loadFact = async () => {
    setLoading(true)
    try {
      const r = await fetchFact()
      setFacts(prev => [...prev, { fact: r.data.fact, category: 'AI Generated' }])
    } catch {} finally { setLoading(false) }
  }

  const next = () => { setCurrent(i => (i + 1) % filtered.length); setRevealed(false) }
  const prev = () => { setCurrent(i => (i - 1 + filtered.length) % filtered.length); setRevealed(false) }

  const item = filtered[current % filtered.length]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="flex-between" style={{ flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ marginBottom: 4 }}>💡 Interesting Facts</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Tech trivia to spark curiosity</p>
        </div>
        <button className="btn btn-sky btn-sm" onClick={loadFact} disabled={loading}>
          <RefreshCw size={14} className={loading ? 'anim-spin' : ''} /> AI Fact
        </button>
      </div>

      {/* Category filter */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {CATEGORIES.map(c => (
          <button key={c} className={`btn btn-sm ${category===c ? 'btn-sky' : 'btn-ghost'}`} onClick={() => { setCategory(c); setCurrent(0); setRevealed(false) }}>
            {c}
          </button>
        ))}
      </div>

      {/* Featured fact card */}
      <div className="card card-teal" style={{ minHeight: 200, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', cursor: 'pointer' }} onClick={() => setRevealed(true)}>
        <div>
          <div className="flex-between" style={{ marginBottom: 16 }}>
            <span className="badge badge-teal">{item?.category}</span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{current + 1} / {filtered.length}</span>
          </div>
          <div style={{ fontSize: 32, marginBottom: 12 }}>💡</div>
          <p style={{ fontSize: 16, color: 'var(--text-primary)', lineHeight: 1.8, fontWeight: revealed ? 400 : 600 }}>
            {revealed ? item?.fact : item?.fact.substring(0, 80) + '… (click to reveal)'}
          </p>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20 }}>
          <button className="btn btn-ghost btn-sm" onClick={e => { e.stopPropagation(); prev() }}>← Prev</button>
          <button className="btn btn-ghost btn-sm" onClick={e => { e.stopPropagation(); next() }}>Next →</button>
        </div>
      </div>

      {/* All facts grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 16 }}>
        {filtered.map((f, i) => (
          <div key={i} className="card card-float" style={{ cursor: 'pointer', borderColor: i === current % filtered.length ? 'rgba(2,128,144,0.5)' : 'var(--border)' }} onClick={() => { setCurrent(i); setRevealed(true) }}>
            <div className="flex-between" style={{ marginBottom: 10 }}>
              <span className="badge badge-teal" style={{ fontSize: 11 }}>{f.category}</span>
              <span style={{ fontSize: 18 }}>💡</span>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              {f.fact.substring(0, 120)}{f.fact.length > 120 ? '…' : ''}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
