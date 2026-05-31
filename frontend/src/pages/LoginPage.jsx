import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Zap, Eye, EyeOff, ArrowRight, ArrowLeft, Mail } from 'lucide-react'
import { GoogleLogin } from '@react-oauth/google'
import { useAppStore } from '../store/useAppStore'
import { login, register, googleLogin, forgotPassword } from '../api'
import toast from 'react-hot-toast'

// ── Validation helpers ────────────────────────────────────────────────────────
const GMAIL_REGEX = /^[a-zA-Z0-9._%+\-]+@gmail\.com$/i

function validateEmail(email) {
  if (!email) return 'Email is required'
  if (!GMAIL_REGEX.test(email)) return 'Only Gmail addresses are accepted (e.g. you@gmail.com)'
  return null
}

function validatePassword(password, mode) {
  if (!password) return 'Password is required'
  if (mode === 'register' && password.length < 8)
    return 'Password must be at least 8 characters'
  return null
}

export default function LoginPage() {
  const [mode, setMode]         = useState('login')   // 'login' | 'register' | 'forgot'
  const [form, setForm]         = useState({ name: '', email: '', password: '', role: 'SWE' })
  const [forgotEmail, setForgotEmail] = useState('')
  const [loading, setLoading]   = useState(false)
  const [show, setShow]         = useState(false)
  const [errors, setErrors]     = useState({})
  const setAuth  = useAppStore((s) => s.setAuth)
  const navigate = useNavigate()

  const ROLES = ['SWE', 'ML Engineer', 'PM', 'Data Analyst', 'DevOps', 'Frontend', 'Backend', 'Full Stack']

  // ── Field-level validation on submit ───────────────────────────────────────
  const validateForm = () => {
    const errs = {}
    const emailErr = validateEmail(form.email)
    if (emailErr) errs.email = emailErr
    const passErr  = validatePassword(form.password, mode)
    if (passErr) errs.password = passErr
    if (mode === 'register' && !form.name.trim()) errs.name = 'Full name is required'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handle = async (e) => {
    e.preventDefault()
    if (!validateForm()) return
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

  const handleGoogle = async (credentialResponse) => {
    setLoading(true)
    try {
      const res = await googleLogin(credentialResponse.credential)
      setAuth(res.data.user, res.data.token)
      toast.success(`Welcome, ${res.data.user?.name || 'there'}! 🚀`)
      navigate('/')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Google sign-in failed')
    } finally {
      setLoading(false)
    }
  }

  const handleForgot = async (e) => {
    e.preventDefault()
    const emailErr = validateEmail(forgotEmail)
    if (emailErr) { setErrors({ forgotEmail: emailErr }); return }
    setErrors({})
    setLoading(true)
    try {
      await forgotPassword(forgotEmail)
      toast.success('Reset link sent! Check your inbox 📬')
      setForgotEmail('')
      setMode('login')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not send reset email')
    } finally {
      setLoading(false)
    }
  }

  // ── Shared label style ─────────────────────────────────────────────────────
  const labelStyle = {
    fontSize: 13, fontWeight: 600,
    color: 'var(--text-secondary)', marginBottom: 6,
    display: 'block', fontFamily: 'var(--font-display)',
  }
  const errStyle = { fontSize: 12, color: '#f87171', marginTop: 4, display: 'block' }

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
          {[['Chase', 'Consistency'], ['Ace', 'Your Placements'], ['100%', 'Your Success']].map(([num, label]) => (
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

          {/* ── FORGOT PASSWORD VIEW ─────────────────────────────────────── */}
          {mode === 'forgot' ? (
            <>
              <button
                onClick={() => { setMode('login'); setErrors({}) }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: 'none', border: 'none', color: 'var(--text-muted)',
                  cursor: 'pointer', fontSize: 13, fontWeight: 600, marginBottom: 24,
                  fontFamily: 'var(--font-display)', padding: 0,
                }}
              >
                <ArrowLeft size={14} /> Back to Sign In
              </button>

              <div style={{
                width: 48, height: 48, borderRadius: 14, marginBottom: 20,
                background: 'rgba(34,197,94,0.12)', border: '1.5px solid var(--accent)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Mail size={22} color="var(--accent)" />
              </div>

              <h2 style={{
                fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.8rem',
                color: 'var(--text-primary)', marginBottom: 8, letterSpacing: '-0.02em'
              }}>
                Reset password
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 28 }}>
                Enter your Gmail address and we'll send you a secure reset link.
              </p>

              <form onSubmit={handleForgot} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={labelStyle}>Gmail Address</label>
                  <input
                    className="input"
                    type="email"
                    id="forgot-email"
                    placeholder="you@gmail.com"
                    value={forgotEmail}
                    onChange={e => { setForgotEmail(e.target.value); setErrors({}) }}
                    required
                    style={errors.forgotEmail ? { borderColor: '#f87171' } : {}}
                  />
                  {errors.forgotEmail && <span style={errStyle}>{errors.forgotEmail}</span>}
                </div>

                <button className="btn btn-primary btn-lg" type="submit" disabled={loading}
                  style={{ marginTop: 8, width: '100%', fontSize: 15 }}>
                  {loading
                    ? <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⟳</span>
                    : <><Mail size={16} /> Send Reset Link</>
                  }
                </button>
              </form>
            </>
          ) : (
            /* ── LOGIN / REGISTER VIEW ──────────────────────────────────── */
            <>
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
                {['login', 'register'].map(m => (
                  <button key={m} className={`tab-btn${mode === m ? ' active' : ''}`}
                    onClick={() => { setMode(m); setErrors({}) }} style={{ flex: 1 }}>
                    {m === 'login' ? 'Sign In' : 'Register'}
                  </button>
                ))}
              </div>

              <form onSubmit={handle} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {mode === 'register' && (
                  <div>
                    <label style={labelStyle}>Full Name</label>
                    <input className="input" id="reg-name" placeholder="Aryan Sharma" value={form.name}
                      onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                      style={errors.name ? { borderColor: '#f87171' } : {}} />
                    {errors.name && <span style={errStyle}>{errors.name}</span>}
                  </div>
                )}

                <div>
                  <label style={labelStyle}>Gmail Address</label>
                  <input className="input" id="auth-email" type="email" placeholder="you@gmail.com"
                    value={form.email}
                    onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                    style={errors.email ? { borderColor: '#f87171' } : {}} />
                  {errors.email && <span style={errStyle}>{errors.email}</span>}
                  {!errors.email && (
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
                      Only @gmail.com addresses are accepted
                    </span>
                  )}
                </div>

                <div>
                  <label style={labelStyle}>Password</label>
                  <div style={{ position: 'relative' }}>
                    <input className="input" id="auth-password" type={show ? 'text' : 'password'}
                      placeholder="Min. 8 characters"
                      value={form.password}
                      onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                      style={{ paddingRight: 48, ...(errors.password ? { borderColor: '#f87171' } : {}) }} />
                    <button type="button" onClick={() => setShow(s => !s)} style={{
                      position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center'
                    }}>
                      {show ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.password && <span style={errStyle}>{errors.password}</span>}
                  {mode === 'register' && !errors.password && (
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
                      Minimum 8 characters required
                    </span>
                  )}
                </div>

                {mode === 'register' && (
                  <div>
                    <label style={labelStyle}>Target Role</label>
                    <select className="input" id="reg-role" value={form.role}
                      onChange={e => setForm(p => ({ ...p, role: e.target.value }))}>
                      {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                )}

                {/* Forgot password link — login mode only */}
                {mode === 'login' && (
                  <div style={{ textAlign: 'right', marginTop: -8 }}>
                    <button type="button"
                      onClick={() => { setMode('forgot'); setErrors({}) }}
                      style={{
                        background: 'none', border: 'none',
                        color: 'var(--accent)', cursor: 'pointer',
                        fontSize: 13, fontWeight: 600,
                        fontFamily: 'var(--font-display)',
                      }}>
                      Forgot password?
                    </button>
                  </div>
                )}

                <button className="btn btn-primary btn-lg" type="submit" disabled={loading}
                  style={{ marginTop: 8, width: '100%', fontSize: 15 }}>
                  {loading
                    ? <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⟳</span>
                    : <>
                        {mode === 'login' ? 'Sign In' : 'Create Account'}
                        <ArrowRight size={17} />
                      </>
                  }
                </button>
              </form>

              {/* Divider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
                <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>or</span>
                <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              </div>

              {/* Google Sign-In button */}
              <GoogleLogin
                onSuccess={handleGoogle}
                onError={() => toast.error('Google sign-in was cancelled')}
                theme="outline"
                size="large"
                width={380}
                text="continue_with"
                shape="rectangular"
              />

              <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)', marginTop: 24 }}>
                {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
                <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setErrors({}) }}
                  style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontWeight: 700, fontSize: 13, fontFamily: 'var(--font-display)' }}>
                  {mode === 'login' ? 'Register →' : 'Sign In →'}
                </button>
              </p>
            </>
          )}
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