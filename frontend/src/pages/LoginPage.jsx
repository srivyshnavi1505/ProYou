import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Zap, Eye, EyeOff, ArrowRight } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import { login, register } from '../api'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const [mode, setMode]       = useState('login')
  const [form, setForm]       = useState({ name: '', email: '', password: '', role: 'SWE' })
  const [loading, setLoading] = useState(false)
  const [show, setShow]       = useState(false)
  const setAuth  = useAppStore((s) => s.setAuth)
  const navigate = useNavigate()

  const handle = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const fn  = mode === 'login' ? login : register
      const res = await fn(form)
      setAuth(res.data.user, res.data.token)
      toast.success(`Welcome${res.data.user?.name ? `, ${res.data.user.name}` : ''}! 🚀`)
      navigate('/')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const ROLES = ['SWE', 'ML Engineer', 'PM', 'Data Analyst', 'DevOps', 'Frontend', 'Backend', 'Full Stack']

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-page)',
      display: 'flex',
      fontFamily: 'var(--font-body)',
    }}>
      {/* Left panel — branding */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '48px',
        background: 'var(--charcoal)',
        color: 'var(--cream)',
        borderRight: '2px solid var(--charcoal)',
        minWidth: 0,
      }} className="login-left">
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: 'var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid var(--cream)',
          }}>
            <Zap size={20} color="var(--charcoal)" fill="var(--charcoal)" />
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22 }}>
            Pro<span style={{ color: 'var(--accent)' }}>You</span>
          </span>
        </div>

        {/* Hero text */}
        <div>
          <div className="pill-badge" style={{
            background: 'rgba(34,197,94,0.15)', borderColor: 'var(--accent)',
            color: 'var(--accent)', marginBottom: 24, boxShadow: 'none'
          }}>
            <span>AI-Powered Placement OS</span>
          </div>
          <h1 style={{
            fontFamily: 'var(--font-display)', fontSize: 'clamp(2.4rem,4vw,3.5rem)',
            fontWeight: 800, lineHeight: 1.1,
            color: 'var(--cream)', marginBottom: 20,
            letterSpacing: '-0.03em'
          }}>
            Crack Top<br />
            <span style={{ color: 'var(--accent)' }}>Tech Roles,</span><br />
            Systematically.
          </h1>
          <p style={{ fontSize: 16, color: 'rgba(253,248,230,0.65)', lineHeight: 1.7, maxWidth: 380 }}>
            Your personalized AI strategist for placements — track streaks, scores, contests, and prep all in one place.
          </p>
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 32 }}>
          {[['10K+', 'Coders'], ['500+', 'Placements'], ['95%', 'Satisfaction']].map(([num, label]) => (
            <div key={label}>
              <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 26, color: 'var(--cream)' }}>{num}</p>
              <p style={{ fontSize: 13, color: 'rgba(253,248,230,0.5)' }}>{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div style={{
        width: '100%', maxWidth: 460,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '48px 40px',
        flexShrink: 0,
      }}>
        <div style={{ width: '100%' }}>
          <h2 style={{
            fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.8rem',
            color: 'var(--text-primary)', marginBottom: 8, letterSpacing: '-0.02em'
          }}>
            {mode === 'login' ? 'Welcome back 👋' : 'Create account'}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 28 }}>
            {mode === 'login' ? 'Sign in to your placement dashboard' : 'Start your AI-powered placement journey'}
          </p>

          {/* Tabs */}
          <div className="tab-bar" style={{ marginBottom: 28 }}>
            {['login','register'].map(m => (
              <button key={m} className={`tab-btn${mode===m?' active':''}`} onClick={() => setMode(m)} style={{ flex:1 }}>
                {m === 'login' ? 'Sign In' : 'Register'}
              </button>
            ))}
          </div>

          <form onSubmit={handle} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {mode === 'register' && (
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, display: 'block', fontFamily: 'var(--font-display)' }}>Full Name</label>
                <input className="input" placeholder="Aryan Sharma" value={form.name}
                  onChange={e => setForm(p=>({...p,name:e.target.value}))} required />
              </div>
            )}
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, display: 'block', fontFamily: 'var(--font-display)' }}>Email</label>
              <input className="input" type="email" placeholder="you@email.com" value={form.email}
                onChange={e => setForm(p=>({...p,email:e.target.value}))} required />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, display: 'block', fontFamily: 'var(--font-display)' }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input className="input" type={show?'text':'password'} placeholder="••••••••" value={form.password}
                  onChange={e => setForm(p=>({...p,password:e.target.value}))} required style={{ paddingRight: 48 }} />
                <button type="button" onClick={() => setShow(s=>!s)} style={{
                  position:'absolute', right:14, top:'50%', transform:'translateY(-50%)',
                  background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer', display:'flex', alignItems:'center'
                }}>
                  {show ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
              </div>
            </div>
            {mode === 'register' && (
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, display: 'block', fontFamily: 'var(--font-display)' }}>Target Role</label>
                <select className="input" value={form.role} onChange={e => setForm(p=>({...p,role:e.target.value}))}>
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            )}

            <button className="btn btn-primary btn-lg" type="submit" disabled={loading}
              style={{ marginTop: 8, width: '100%', fontSize: 15 }}>
              {loading
                ? <span style={{ display:'inline-block', animation:'spin 1s linear infinite' }}>⟳</span>
                : <>
                    {mode === 'login' ? 'Sign In' : 'Create Account'}
                    <ArrowRight size={17} />
                  </>
              }
            </button>
          </form>

          <p style={{ textAlign:'center', fontSize:13, color:'var(--text-muted)', marginTop:24 }}>
            {mode==='login' ? "Don't have an account? " : "Already have an account? "}
            <button onClick={() => setMode(mode==='login'?'register':'login')}
              style={{ background:'none',border:'none',color:'var(--accent)',cursor:'pointer',fontWeight:700,fontSize:13,fontFamily:'var(--font-display)' }}>
              {mode==='login' ? 'Register →' : 'Sign In →'}
            </button>
          </p>

          <div style={{
            marginTop: 28, padding: '14px 18px',
            background: 'var(--green-light)', border: '1.5px solid var(--green-dark)',
            borderRadius: 'var(--r-md)', textAlign: 'center',
          }}>
            <p style={{ fontSize: 12, color: 'var(--green-dark)', fontWeight: 600, fontFamily: 'var(--font-display)' }}>
              Demo: <span style={{ fontWeight: 700 }}>demo@poyou.app</span> · <span style={{ fontWeight: 700 }}>demo123</span>
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .login-left { display: none !important; }
        }
      `}</style>
    </div>
  )
}