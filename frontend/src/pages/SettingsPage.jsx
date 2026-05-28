import { useState } from 'react'
import { useAppStore } from '../store/useAppStore'
import { triggerDigest } from '../api'
import { Settings, GitBranch, Code2, Link2, Mail, Bell, Send, User } from 'lucide-react'
import toast from 'react-hot-toast'

const ROLES = ['SWE','ML Engineer','PM','Data Analyst','DevOps','Frontend','Backend','Full Stack']

export default function SettingsPage() {
  const settings       = useAppStore(s => s.settings)
  const user           = useAppStore(s => s.user)
  const updateSettings = useAppStore(s => s.updateSettings)
  const [local, setLocal] = useState({ ...settings })
  const [saved, setSaved] = useState(false)
  const [mailLoading, setMailLoading] = useState(false)

  const save = () => {
    updateSettings(local)
    setSaved(true)
    toast.success('Settings saved! ✅')
    setTimeout(() => setSaved(false), 2000)
  }

  const sendDigest = async () => {
    setMailLoading(true)
    try { await triggerDigest(); toast.success('Weekly digest sent to your email! 📧') }
    catch { toast.error('Email failed — check Resend API key in backend') }
    finally { setMailLoading(false) }
  }

  const Section = ({ icon: Icon, title, children }) => (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 14, borderBottom: '1px solid var(--border)' }}>
        <Icon size={18} style={{ color: 'var(--teal)' }} />
        <h3 style={{ fontSize: '1rem' }}>{title}</h3>
      </div>
      {children}
    </div>
  )

  const Field = ({ label, children }) => (
    <div>
      <label style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 700 }}>
      <div>
        <h2 style={{ marginBottom: 4 }}>⚙️ Settings</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Configure your profile, integrations, and notifications</p>
      </div>

      {/* Profile */}
      <Section icon={User} title="Profile">
        <Field label="Your Name">
          <input className="input" value={user?.name || ''} disabled style={{ opacity: .6 }} />
        </Field>
        <Field label="Target Role">
          <select className="input" value={local.role} onChange={e => setLocal(p=>({...p,role:e.target.value}))}
            style={{ background:'var(--bg-input)', color:'var(--text-primary)' }}>
            {ROLES.map(r => <option key={r} value={r} style={{ background:'#151e3f' }}>{r}</option>)}
          </select>
        </Field>
        <Field label="Target Companies (comma-separated)">
          <input className="input" value={(local.targetCompanies || []).join(', ')}
            onChange={e => setLocal(p=>({...p,targetCompanies:e.target.value.split(',').map(s=>s.trim()).filter(Boolean)}))}
            placeholder="Google, Microsoft, Amazon" />
        </Field>
      </Section>

      {/* Integrations */}
      <Section icon={GitBranch} title="Platform Integrations">
        <Field label="GitHub Username">
          <input className="input" placeholder="e.g. octocat" value={local.githubUsername || ''}
            onChange={e => setLocal(p=>({...p,githubUsername:e.target.value}))} />
        </Field>
        <Field label="LeetCode Username">
          <input className="input" placeholder="e.g. tourist" value={local.leetcodeUsername || ''}
            onChange={e => setLocal(p=>({...p,leetcodeUsername:e.target.value}))} />
        </Field>
        <Field label="LinkedIn Profile URL (for display)">
          <input className="input" placeholder="https://linkedin.com/in/yourname" value={local.linkedinUrl || ''}
            onChange={e => setLocal(p=>({...p,linkedinUrl:e.target.value}))} />
        </Field>
      </Section>

      {/* Email */}
      <Section icon={Mail} title="Email Notifications">
        <Field label="Your Email">
          <input className="input" type="email" placeholder="you@email.com" value={local.email || ''}
            onChange={e => setLocal(p=>({...p,email:e.target.value}))} />
        </Field>
        <div className="flex-between" style={{ padding: '12px 16px', background: 'var(--bg-input)', borderRadius: 12, border: '1px solid var(--border)' }}>
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>Weekly Digest</p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>AI-drafted summary every Monday morning</p>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input type="checkbox" checked={local.emailNotifications} onChange={e => setLocal(p=>({...p,emailNotifications:e.target.checked}))} style={{ accentColor: 'var(--teal)', width: 16, height: 16 }} />
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Enabled</span>
          </label>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={sendDigest} disabled={mailLoading} style={{ alignSelf: 'flex-start' }}>
          <Send size={14} className={mailLoading ? 'anim-spin' : ''} />
          {mailLoading ? 'Sending…' : 'Send Test Digest Now'}
        </button>
      </Section>

      {/* Save */}
      <button className="btn btn-primary btn-lg" onClick={save} style={{ alignSelf: 'flex-start' }}>
        {saved ? '✅ Saved!' : 'Save Settings'}
      </button>

      {/* API status hints */}
      <div className="card card-peach">
        <h4 style={{ marginBottom: 12 }}>🔑 API Key Setup</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { key: 'GEMINI_API_KEY', desc: 'AI features (score, insights, tutor, flashcards)', url: 'https://aistudio.google.com' },
            { key: 'GITHUB_TOKEN', desc: 'GitHub contribution data', url: 'https://github.com/settings/tokens' },
            { key: 'NEWS_API_KEY', desc: 'Company news feed', url: 'https://newsapi.org' },
            { key: 'RESEND_API_KEY', desc: 'Email notifications', url: 'https://resend.com' },
          ].map(({ key, desc, url }) => (
            <div key={key} style={{ display: 'flex', gap: 10, padding: '8px 12px', background: 'rgba(3,0,39,0.3)', borderRadius: 8 }}>
              <code style={{ fontSize: 12, color: 'var(--teal)', fontFamily: 'monospace', flexShrink: 0 }}>{key}</code>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{desc} · <a href={url} target="_blank" rel="noreferrer" style={{ color: 'var(--teal)' }}>Get key →</a></span>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 12 }}>Add all keys to <code style={{ color: 'var(--peach)', fontFamily:'monospace' }}>backend/.env</code></p>
      </div>
    </div>
  )
}
