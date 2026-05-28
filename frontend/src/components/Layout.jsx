import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Flame, Trophy, Star, Newspaper,
  BrainCircuit, BookOpen, CalendarDays, Lightbulb,
  Settings, LogOut, Zap, Menu, X, Bell
} from 'lucide-react'
import { useState } from 'react'
import { useAppStore } from '../store/useAppStore'

const NAV = [
  { to: '/',           icon: LayoutDashboard, label: 'Dashboard',       color: '#22C55E' },
  { to: '/streaks',    icon: Flame,            label: 'Streaks',         color: '#F97316' },
  { to: '/score',      icon: Trophy,           label: 'Placement Score', color: '#EAB308' },
  { to: '/contests',   icon: Star,             label: 'Contests',        color: '#A855F7' },
  { to: '/news',       icon: Newspaper,        label: 'Company News',    color: '#0EA5E9' },
  { to: '/tutor',      icon: BrainCircuit,     label: 'AI Tutor',        color: '#EC4899' },
  { to: '/flashcards', icon: BookOpen,         label: 'Flashcards',      color: '#22C55E' },
  { to: '/calendar',   icon: CalendarDays,     label: 'Calendar',        color: '#0EA5E9' },
  { to: '/facts',      icon: Lightbulb,        label: 'Fun Facts',       color: '#EAB308' },
  { to: '/settings',   icon: Settings,         label: 'Settings',        color: '#6B7280' },
]

export default function Layout({ children }) {
  const logout    = useAppStore((s) => s.logout)
  const user      = useAppStore((s) => s.user)
  const alerts    = useAppStore((s) => s.alerts)
  const [mob, setMob] = useState(false)
  const navigate  = useNavigate()

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-page)' }}>
      {/* ── Navbar ── */}
      <nav className="navbar">
        <div className="container flex-between" style={{ height: '100%' }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              className="btn btn-ghost btn-sm"
              style={{ display: 'none', padding: '8px', borderRadius: 'var(--r-md)' }}
              id="mob-menu-btn"
              onClick={() => setMob(true)}
            >
              <Menu size={20} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: 'var(--accent)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '2px solid var(--charcoal)',
                boxShadow: '3px 3px 0px var(--charcoal)',
              }}>
                <Zap size={18} color="var(--charcoal)" fill="var(--charcoal)" />
              </div>
              <span style={{
                fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20,
                color: 'var(--text-primary)', letterSpacing: '-0.02em'
              }}>
                Pro<span style={{ color: 'var(--accent)' }}>You</span>
              </span>
            </div>
          </div>

          {/* Right side */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {alerts.length > 0 && (
              <div style={{ position: 'relative' }}>
                <button className="btn btn-ghost btn-sm" style={{ padding: '8px 10px', borderRadius: 'var(--r-md)' }}>
                  <Bell size={18} color="var(--text-muted)" />
                </button>
                <span style={{
                  position: 'absolute', top: 2, right: 2,
                  background: '#DC2626', color: '#fff', borderRadius: '50%',
                  width: 16, height: 16, fontSize: 10, display: 'flex',
                  alignItems: 'center', justifyContent: 'center', fontWeight: 700,
                  border: '1.5px solid var(--white)'
                }}>{alerts.length}</span>
              </div>
            )}
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'var(--accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-display)', fontWeight: 800,
              color: 'var(--charcoal)', fontSize: 15,
              border: '2px solid var(--charcoal)',
              boxShadow: '2px 2px 0px var(--charcoal)',
            }}>
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <button
              className="btn btn-ghost btn-sm"
              onClick={handleLogout}
              title="Logout"
              style={{ padding: '8px 12px', borderRadius: 'var(--r-md)' }}
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </nav>

      {/* ── Body ── */}
      <div className="app-layout">
        {/* Sidebar */}
        <aside className="sidebar">
          <div style={{ marginBottom: 8 }}>
            <p style={{
              fontSize: 10, fontWeight: 700, color: 'var(--text-muted)',
              textTransform: 'uppercase', letterSpacing: '.12em',
              padding: '0 14px 10px', fontFamily: 'var(--font-display)'
            }}>
              Navigation
            </p>
            {NAV.map(({ to, icon: Icon, label, color }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
              >
                <div style={{
                  width: 26, height: 26, borderRadius: 8,
                  background: 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <Icon size={15} />
                </div>
                {label}
              </NavLink>
            ))}
          </div>
          <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: '1.5px solid var(--border-light)' }}>
            <button
              className="sidebar-link"
              style={{ width: '100%', background: 'none', border: '1.5px solid transparent', cursor: 'pointer', color: '#DC2626' }}
              onClick={handleLogout}
            >
              <div style={{ width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <LogOut size={15} />
              </div>
              Sign Out
            </button>
          </div>
        </aside>

        {/* Mobile Overlay */}
        {mob && (
          <div
            style={{
              position: 'fixed', inset: 0, zIndex: 199,
              background: 'rgba(26,26,26,0.6)', backdropFilter: 'blur(4px)'
            }}
            onClick={() => setMob(false)}
          />
        )}
        {mob && (
          <aside style={{
            position: 'fixed', top: 0, left: 0, height: '100vh', width: 260, zIndex: 200,
            background: 'var(--white)', borderRight: '2px solid var(--charcoal)',
            padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 4,
            animation: 'slideIn .3s ease',
            boxShadow: '8px 0 0 var(--charcoal)'
          }}>
            <div className="flex-between" style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 9,
                  background: 'var(--accent)', border: '2px solid var(--charcoal)',
                  boxShadow: '2px 2px 0px var(--charcoal)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <Zap size={16} color="var(--charcoal)" fill="var(--charcoal)" />
                </div>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--text-primary)', fontSize: 18 }}>
                  Pro<span style={{ color: 'var(--accent)' }}>You</span>
                </span>
              </div>
              <button className="btn btn-ghost btn-sm" style={{ padding: 8, borderRadius: 'var(--r-md)' }} onClick={() => setMob(false)}>
                <X size={18} />
              </button>
            </div>
            <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.12em', padding: '0 14px 10px', fontFamily: 'var(--font-display)' }}>
              Navigation
            </p>
            {NAV.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
                onClick={() => setMob(false)}
              >
                <Icon size={15} />
                {label}
              </NavLink>
            ))}
          </aside>
        )}

        {/* Main */}
        <main className="main-content">{children}</main>
      </div>
    </div>
  )
}