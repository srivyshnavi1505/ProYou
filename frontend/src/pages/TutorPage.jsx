import { useState, useRef, useEffect } from 'react'
import { useAppStore } from '../store/useAppStore'
import { askTutor } from '../api'
import { BrainCircuit, Send, Sparkles, ChevronDown, Lightbulb, Map, BookOpenCheck } from 'lucide-react'
import toast from 'react-hot-toast'

const HINT_LEVELS = [
  { id: 'nudge',       label: 'Nudge',      emoji: '💡', desc: 'A small push in the right direction', color: '#FEF08A', textColor: '#854D0E' },
  { id: 'approach',    label: 'Approach',   emoji: '🗺',  desc: 'Strategy without code', color: '#BAE6FD', textColor: '#1D4ED8' },
  { id: 'walkthrough', label: 'Full Guide', emoji: '🧩', desc: 'Step-by-step with code', color: '#DCFCE7', textColor: '#16A34A' },
]

function ChatBubble({ msg, isLatest }) {
  const isUser = msg.role === 'user'
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        marginBottom: 16,
        animation: isLatest ? 'fadeUp .3s ease both' : 'none'
      }}
    >
      {!isUser && (
        <div style={{
          width: 34, height: 34, borderRadius: 10,
          background: 'var(--accent)',
          border: '2px solid var(--charcoal)',
          boxShadow: '2px 2px 0px var(--charcoal)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, marginRight: 10, marginTop: 2
        }}>
          <BrainCircuit size={16} color="var(--charcoal)" />
        </div>
      )}
      <div style={{
        maxWidth: '78%', padding: '13px 17px',
        borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
        background: isUser ? 'var(--charcoal)' : 'var(--white)',
        border: `2px solid ${isUser ? 'var(--charcoal)' : 'var(--border-light)'}`,
        color: isUser ? 'var(--cream)' : 'var(--text-primary)',
        fontSize: 14, lineHeight: 1.75,
        boxShadow: isUser ? 'var(--shadow-sm)' : 'var(--shadow-card)',
        whiteSpace: 'pre-wrap',
        fontFamily: 'var(--font-body)',
      }}>
        {msg.content}
      </div>
    </div>
  )
}

function TypingDots() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
      <div style={{
        width: 34, height: 34, borderRadius: 10,
        background: 'var(--accent)', border: '2px solid var(--charcoal)',
        boxShadow: '2px 2px 0px var(--charcoal)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0
      }}>
        <BrainCircuit size={16} color="var(--charcoal)" />
      </div>
      <div style={{
        padding: '12px 16px',
        background: 'var(--white)', border: '2px solid var(--border-light)',
        borderRadius: '18px 18px 18px 4px',
        display: 'flex', gap: 5, alignItems: 'center'
      }}>
        {[0,1,2].map(i => (
          <div key={i} style={{
            width: 7, height: 7, borderRadius: '50%',
            background: 'var(--accent)',
            animation: `pulse 1.2s ${i*0.2}s ease-in-out infinite`
          }} />
        ))}
      </div>
    </div>
  )
}

export default function TutorPage() {
  const settings = useAppStore(s => s.settings)
  const [problem, setProblem] = useState('')
  const [hint, setHint]       = useState('nudge')
  const [msgs, setMsgs]       = useState([])
  const [input, setInput]     = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs, loading])

  const send = async (override) => {
    const content = override || input.trim()
    if (!content) return
    const userMsg = { role: 'user', content }
    setMsgs(m => [...m, userMsg])
    setInput('')
    setLoading(true)
    try {
      const r = await askTutor({ problem, hintLevel: hint, role: settings.role, message: content, history: msgs })
      setMsgs(m => [...m, { role: 'ai', content: r.data.reply }])
    } catch {
      toast.error('AI Tutor unavailable — check backend API key')
      setMsgs(m => [...m, { role: 'ai', content: '⚠️ Service unavailable. Please check your Gemini API key in backend .env' }])
    } finally { setLoading(false) }
  }

  const startSession = () => {
    if (!problem.trim()) { toast.error('Paste the problem statement first'); return }
    setMsgs([])
    send(`I need help with this problem. Hint level: ${hint}.\n\nProblem:\n${problem}`)
  }

  const selectedHint = HINT_LEVELS.find(h => h.id === hint)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, height: 'calc(100vh - 120px)' }}>
      {/* Header */}
      <div className="flex-between" style={{ flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <div className="pill-badge" style={{ fontSize: 12 }}>
              <span>Role-aware hints</span>
            </div>
          </div>
          <h2 style={{ letterSpacing: '-0.02em', marginBottom: 4 }}>🧠 AI LeetCode Tutor</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            Adaptive hints tailored for <strong style={{ color: 'var(--text-primary)' }}>{settings.role}</strong>
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 20, flex: 1, minHeight: 0 }}>
        {/* Left panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto' }}>
          {/* Problem input card */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <h4 style={{ letterSpacing: '-0.01em' }}>Problem Statement</h4>
            <textarea
              className="input textarea"
              style={{ height: '160px', borderRadius: 'var(--r-md)', resize: 'vertical' }}
              placeholder="Paste the LeetCode problem here…&#10;&#10;e.g. Two Sum — Given an array nums and a target, return indices of two numbers that add up to target."
              value={problem}
              onChange={e => setProblem(e.target.value)}
            />
          </div>

          {/* Hint level */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h4 style={{ letterSpacing: '-0.01em' }}>Hint Level</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {HINT_LEVELS.map(h => (
                <label key={h.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 14px', borderRadius: 'var(--r-md)',
                  border: `2px solid ${hint===h.id ? 'var(--charcoal)' : 'var(--border-light)'}`,
                  background: hint===h.id ? h.color : 'var(--white)',
                  cursor: 'pointer',
                  transition: 'all var(--t-fast)',
                  boxShadow: hint===h.id ? 'var(--shadow-sm)' : 'none'
                }}>
                  <input type="radio" name="hint" value={h.id} checked={hint===h.id} onChange={() => setHint(h.id)}
                    style={{ accentColor: 'var(--accent)', width: 15, height: 15 }} />
                  <div style={{ flex: 1 }}>
                    <p style={{
                      fontSize: 13, fontWeight: 700,
                      color: hint===h.id ? h.textColor : 'var(--text-primary)',
                      fontFamily: 'var(--font-display)'
                    }}>
                      {h.emoji} {h.label}
                    </p>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>{h.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Start button */}
          <button className="btn btn-primary" style={{ width: '100%' }} onClick={startSession}>
            <Sparkles size={16} /> Start Session
          </button>

          {/* Role context */}
          <div style={{
            padding: '12px 16px',
            background: 'var(--cream)',
            borderRadius: 'var(--r-md)',
            border: '1.5px solid var(--border-light)'
          }}>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>
              Hints are tailored to <strong style={{ color: 'var(--text-primary)' }}>{settings.role}</strong> — time complexity for SWE, math approach for ML, etc.
            </p>
          </div>
        </div>

        {/* Chat panel */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
          {/* Chat header */}
          <div style={{
            padding: '14px 20px',
            borderBottom: '2px solid var(--border-light)',
            display: 'flex', alignItems: 'center', gap: 12,
            background: 'var(--white)'
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'var(--accent)', border: '2px solid var(--charcoal)',
              boxShadow: '2px 2px 0px var(--charcoal)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <BrainCircuit size={18} color="var(--charcoal)" />
            </div>
            <div>
              <p style={{ fontWeight: 700, fontSize: 15, fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
                AI Tutor
              </p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {selectedHint?.emoji} {selectedHint?.label} mode active
              </p>
            </div>
            {loading && (
              <div className="badge badge-green anim-pulse" style={{ marginLeft: 'auto' }}>
                Thinking…
              </div>
            )}
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px', background: 'var(--bg-page)' }}>
            {msgs.length === 0 ? (
              <div className="empty-state" style={{ height: '100%', border: 'none', background: 'transparent' }}>
                <div style={{
                  width: 72, height: 72, borderRadius: 20,
                  background: 'var(--accent)', border: '2px solid var(--charcoal)',
                  boxShadow: 'var(--shadow-md)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 32, marginBottom: 8
                }}>
                  🤖
                </div>
                <h3 style={{ color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>Ready to help!</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: 14, maxWidth: 300, lineHeight: 1.6 }}>
                  Paste a LeetCode problem on the left, pick your hint level, and start the session.
                </p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                  {['Two Sum', 'Binary Search', 'Merge Intervals'].map(q => (
                    <button key={q} className="btn btn-ghost btn-sm" onClick={() => send(`How do I approach ${q}?`)}>
                      Try "{q}"
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              msgs.map((m, i) => <ChatBubble key={i} msg={m} isLatest={i === msgs.length - 1} />)
            )}
            {loading && <TypingDots />}
            <div ref={bottomRef} />
          </div>

          {/* Input bar */}
          <div style={{
            padding: '14px 20px',
            borderTop: '2px solid var(--border-light)',
            display: 'flex', gap: 10,
            background: 'var(--white)'
          }}>
            <input
              className="input"
              placeholder="Ask a follow-up question…"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
              disabled={loading}
              style={{ borderRadius: 'var(--r-full)' }}
            />
            <button
              className="btn btn-primary"
              onClick={() => send()}
              disabled={loading || !input.trim()}
              style={{ padding: '0 18px', flexShrink: 0, borderRadius: 'var(--r-full)' }}
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}