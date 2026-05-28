import { useEffect, useState } from 'react'
import { useAppStore } from '../store/useAppStore'
import { fetchFlashcards } from '../api'
import { BookOpen, ChevronLeft, ChevronRight, Sparkles, RotateCcw } from 'lucide-react'
import toast from 'react-hot-toast'

const DEMO_CARDS = [
  { question: 'What is the time complexity of QuickSort in the average case?', answer: 'O(n log n) on average, O(n²) worst case when pivot is always the max/min element. Use randomized pivot to mitigate.', tag: 'Algorithms' },
  { question: 'Explain the difference between BFS and DFS. When do you use each?', answer: 'BFS uses a queue and explores level by level — ideal for shortest path in unweighted graphs. DFS uses a stack/recursion and explores depth-first — ideal for topological sort, cycle detection, backtracking.', tag: 'Graphs' },
  { question: 'What is dynamic programming? Give a key indicator to recognise DP problems.', answer: 'DP solves problems by breaking them into overlapping subproblems and storing solutions (memoization / tabulation). Key indicators: optimal substructure + overlapping subproblems.', tag: 'DP' },
  { question: 'What data structure would you use to implement a LRU cache?', answer: 'A combination of a HashMap (O(1) lookup) and a Doubly Linked List (O(1) insertion/deletion). The map stores key → node, the list maintains recency order.', tag: 'Design' },
  { question: 'Describe the CAP theorem in distributed systems.', answer: 'A distributed system can guarantee at most 2 of: Consistency, Availability, Partition Tolerance. In practice, partition tolerance is a must, so you choose between CP and AP.', tag: 'System Design' },
]

const TAG_COLORS = {
  Algorithms:    { bg: '#DCFCE7', color: '#16A34A', border: '#16A34A' },
  Graphs:        { bg: '#EFF8FF', color: '#1D4ED8', border: '#1D4ED8' },
  DP:            { bg: '#FEF9C3', color: '#854D0E', border: '#854D0E' },
  Design:        { bg: '#FAF5FF', color: '#7C3AED', border: '#7C3AED' },
  'System Design': { bg: '#FFF4EC', color: '#C2410C', border: '#C2410C' },
  default:       { bg: 'var(--cream)', color: 'var(--text-muted)', border: 'var(--border-light)' },
}

function Flashcard({ card, idx, total }) {
  const [flipped, setFlipped] = useState(false)
  useEffect(() => setFlipped(false), [idx])
  const tagStyle = TAG_COLORS[card?.tag] || TAG_COLORS.default

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>
        Card {idx + 1} of {total} · click to flip
      </p>
      <div className="flashcard-scene" onClick={() => setFlipped(f => !f)}>
        <div className={`flashcard-inner${flipped ? ' flipped' : ''}`}>
          {/* Front */}
          <div className="flashcard-face">
            <div style={{ textAlign: 'center', width: '100%' }}>
              <span style={{
                fontSize: 10, fontWeight: 800, letterSpacing: '.12em',
                color: 'var(--text-muted)', textTransform: 'uppercase',
                display: 'block', marginBottom: 16, fontFamily: 'var(--font-display)'
              }}>
                Question
              </span>
              <p style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.6, fontFamily: 'var(--font-display)' }}>
                {card.question}
              </p>
              {card.tag && (
                <span style={{
                  display: 'inline-flex', marginTop: 16, padding: '4px 14px',
                  borderRadius: 'var(--r-full)',
                  background: tagStyle.bg, color: tagStyle.color,
                  border: `1.5px solid ${tagStyle.border}`,
                  fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-display)'
                }}>{card.tag}</span>
              )}
            </div>
          </div>
          {/* Back */}
          <div className="flashcard-back">
            <div style={{ textAlign: 'center', width: '100%' }}>
              <span style={{
                fontSize: 10, fontWeight: 800, letterSpacing: '.12em',
                color: 'var(--green-dark)', textTransform: 'uppercase',
                display: 'block', marginBottom: 16, fontFamily: 'var(--font-display)'
              }}>
                Answer
              </span>
              <p style={{ fontSize: 14, color: 'var(--green-dark)', lineHeight: 1.75, fontWeight: 500 }}>
                {card.answer}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function FlashcardsPage() {
  const flashcards    = useAppStore(s => s.flashcards)
  const setFlashcards = useAppStore(s => s.setFlashcards)
  const settings      = useAppStore(s => s.settings)
  const githubData    = useAppStore(s => s.githubData)
  const leetcodeData  = useAppStore(s => s.leetcodeData)

  const [idx, setIdx]         = useState(0)
  const [loading, setLoading] = useState(false)
  const [useDemo, setUseDemo] = useState(false)

  const cards = useDemo || flashcards.length === 0 ? DEMO_CARDS : flashcards

  const generate = async () => {
    setLoading(true); setUseDemo(false)
    try {
      const r = await fetchFlashcards({ role: settings.role, github: githubData, leetcode: leetcodeData })
      setFlashcards(r.data); setIdx(0)
      toast.success('New flashcards generated! 🃏')
    } catch {
      toast.error('AI unavailable — showing demo cards')
      setUseDemo(true)
    } finally { setLoading(false) }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="flex-between" style={{ flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <div className="pill-badge" style={{ fontSize: 12 }}><span>AI Generated Weekly</span></div>
          </div>
          <h2 style={{ letterSpacing: '-0.02em', marginBottom: 4 }}>🃏 Flashcards</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Targeted at your weak areas this week</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => { setUseDemo(true); setIdx(0) }}>
            <BookOpen size={14} /> Demo
          </button>
          <button className="btn btn-primary btn-sm" onClick={generate} disabled={loading}>
            <Sparkles size={14} className={loading ? 'anim-spin' : ''} />
            {loading ? 'Generating…' : 'Generate AI Cards'}
          </button>
        </div>
      </div>

      {/* Main flashcard viewer */}
      <div className="card" style={{ maxWidth: 680, margin: '0 auto', width: '100%', padding: '32px 28px' }}>
        <Flashcard card={cards[idx]} idx={idx} total={cards.length} />

        {/* Navigation */}
        <div className="flex-center" style={{ gap: 18, marginTop: 28 }}>
          <button
            className="btn btn-ghost"
            onClick={() => setIdx(i => Math.max(0, i - 1))}
            disabled={idx === 0}
            style={{ padding: '9px 18px' }}
          >
            <ChevronLeft size={18} /> Prev
          </button>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {cards.map((_, i) => (
              <div key={i} onClick={() => setIdx(i)} style={{
                width: i === idx ? 22 : 8, height: 8, borderRadius: 4,
                background: i === idx ? 'var(--charcoal)' : 'var(--cream-dark)',
                cursor: 'pointer',
                transition: 'all var(--t-base)',
                border: i === idx ? '1.5px solid var(--charcoal)' : '1.5px solid var(--border-light)'
              }} />
            ))}
          </div>
          <button
            className="btn btn-ghost"
            onClick={() => setIdx(i => Math.min(cards.length - 1, i + 1))}
            disabled={idx === cards.length - 1}
            style={{ padding: '9px 18px' }}
          >
            Next <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* All cards grid */}
      <div>
        <h4 style={{ marginBottom: 16, letterSpacing: '-0.01em' }}>All Cards</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(270px,1fr))', gap: 14 }}>
          {cards.map((c, i) => {
            const tagStyle = TAG_COLORS[c.tag] || TAG_COLORS.default
            const isActive = i === idx
            return (
              <div
                key={i}
                className="card card-float"
                style={{ cursor: 'pointer', background: isActive ? 'var(--green-light)' : 'var(--white)', borderColor: isActive ? 'var(--green-dark)' : 'var(--border-light)', boxShadow: isActive ? '4px 4px 0px var(--green-dark)' : 'var(--shadow-card)' }}
                onClick={() => setIdx(i)}
              >
                <div className="flex-between" style={{ marginBottom: 10 }}>
                  <span style={{
                    fontSize: 11, fontWeight: 800, color: 'var(--text-muted)',
                    fontFamily: 'var(--font-display)', letterSpacing: '.05em'
                  }}>#{i + 1}</span>
                  {c.tag && (
                    <span style={{
                      padding: '3px 10px', borderRadius: 'var(--r-full)',
                      background: tagStyle.bg, color: tagStyle.color,
                      border: `1.5px solid ${tagStyle.border}`,
                      fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-display)'
                    }}>{c.tag}</span>
                  )}
                </div>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }} className="truncate">
                  {c.question}
                </p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Info card */}
      <div className="card card-peach">
        <h4 style={{ marginBottom: 12, letterSpacing: '-0.01em' }}>How AI flashcards work</h4>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.75 }}>
          Every Sunday, the AI analyzes your week — which LeetCode difficulty you avoided, your GitHub activity, and your target role — then generates 5 targeted flashcards on your weakest topics. The goal is spaced repetition without manual curation.
        </p>
      </div>
    </div>
  )
}