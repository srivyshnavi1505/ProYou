import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Zap, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react'
import { resetPassword } from '../api'
import toast from 'react-hot-toast'

export default function ResetPasswordPage() {
  const [searchParams]    = useSearchParams()
  const navigate          = useNavigate()
  const token             = searchParams.get('token')

  const [password, setPassword]   = useState('')
  const [confirm, setConfirm]     = useState('')
  const [show, setShow]           = useState(false)
  const [loading, setLoading]     = useState(false)
  const [done, setDone]           = useState(false)
  const [errors, setErrors]       = useState({})

  useEffect(() => {
    if (!token) {
      toast.error('Invalid or missing reset token')
      navigate('/login')
    }
  }, [token, navigate])

  // ── Live password strength indicators ────────────────────────────────────
  const checks = {
    length:   password.length >= 8,
    upper:    /[A-Z]/.test(password),
    lower:    /[a-z]/.test(password),
    number:   /\d/.test(password),
  }

  const validate = () => {
    const errs = {}
    if (password.length < 8)  errs.password = 'Password must be at least 8 characters'
    if (password !== confirm) errs.confirm  = 'Passwords do not match'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      await resetPassword(token, password)
      setDone(true)
      toast.success('Password reset! Redirecting to login…')
      setTimeout(() => navigate('/login'), 2500)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset failed. The link may have expired.')
    } finally {
      setLoading(false)
    }
  }

  const labelStyle = {
    fontSize: 13, fontWeight: 600,
    color: 'var(--text-secondary)', marginBottom: 6,
    display: 'block', fontFamily: 'var(--font-display)',
  }
  const errStyle = { fontSize: 12, color: '#f87171', marginTop: 4, display: 'block' }

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg-page)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-body)', padding: '24px',
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 36, justifyContent: 'center' }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Zap size={18} color="var(--charcoal)" fill="var(--charcoal)" />
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, color: 'var(--text-primary)' }}>
            Pro<span style={{ color: 'var(--accent)' }}>You</span>
          </span>
        </div>

        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 'var(--r-lg)', padding: '36px 32px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
        }}>
          {done ? (
            /* ── Success state ── */
            <div style={{ textAlign: 'center' }}>
              <CheckCircle size={48} color="var(--accent)" style={{ marginBottom: 16 }} />
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.5rem', color: 'var(--text-primary)', marginBottom: 8 }}>
                Password Updated!
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
                Redirecting you to the login page…
              </p>
            </div>
          ) : (
            <>
              <h2 style={{
                fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.6rem',
                color: 'var(--text-primary)', marginBottom: 8, letterSpacing: '-0.02em'
              }}>
                Set new password
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 28 }}>
                Choose a strong password. Minimum 8 characters.
              </p>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* New password */}
                <div>
                  <label style={labelStyle}>New Password</label>
                  <div style={{ position: 'relative' }}>
                    <input className="input" id="new-password"
                      type={show ? 'text' : 'password'}
                      placeholder="Min. 8 characters"
                      value={password}
                      onChange={e => { setPassword(e.target.value); setErrors(p => ({ ...p, password: '' })) }}
                      style={{ paddingRight: 48, ...(errors.password ? { borderColor: '#f87171' } : {}) }}
                    />
                    <button type="button" onClick={() => setShow(s => !s)} style={{
                      position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center'
                    }}>
                      {show ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.password && <span style={errStyle}>{errors.password}</span>}
                </div>

                {/* Strength hints */}
                {password.length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 16px' }}>
                    {[
                      [checks.length, '8+ characters'],
                      [checks.upper,  'Uppercase letter'],
                      [checks.lower,  'Lowercase letter'],
                      [checks.number, 'Number'],
                    ].map(([ok, label]) => (
                      <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {ok
                          ? <CheckCircle size={12} color="#22c55e" />
                          : <XCircle    size={12} color="#6b7280" />
                        }
                        <span style={{ fontSize: 12, color: ok ? '#22c55e' : 'var(--text-muted)' }}>{label}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Confirm */}
                <div>
                  <label style={labelStyle}>Confirm Password</label>
                  <input className="input" id="confirm-password"
                    type={show ? 'text' : 'password'}
                    placeholder="Repeat your password"
                    value={confirm}
                    onChange={e => { setConfirm(e.target.value); setErrors(p => ({ ...p, confirm: '' })) }}
                    style={errors.confirm ? { borderColor: '#f87171' } : {}}
                  />
                  {errors.confirm && <span style={errStyle}>{errors.confirm}</span>}
                </div>

                <button className="btn btn-primary btn-lg" type="submit" disabled={loading}
                  style={{ marginTop: 8, width: '100%', fontSize: 15 }}>
                  {loading
                    ? <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⟳</span>
                    : 'Reset Password'
                  }
                </button>
              </form>
            </>
          )}
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--text-muted)' }}>
          Remember your password?{' '}
          <button onClick={() => navigate('/login')} style={{
            background: 'none', border: 'none', color: 'var(--accent)',
            cursor: 'pointer', fontWeight: 700, fontSize: 13, fontFamily: 'var(--font-display)'
          }}>
            Sign In →
          </button>
        </p>
      </div>
    </div>
  )
}
