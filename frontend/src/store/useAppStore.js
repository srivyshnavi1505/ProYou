import { create } from 'zustand'
import { getMe, updateProfile } from '../api'

export const useAppStore = create((set, get) => ({
  // ── Auth ──────────────────────────────────────────────
  user:  JSON.parse(localStorage.getItem('poyou_user')  || 'null'),
  token: localStorage.getItem('poyou_token') || null,

  setAuth: (user, token) => {
    localStorage.setItem('poyou_user',  JSON.stringify(user))
    localStorage.setItem('poyou_token', token)

    // Seed settings from login response — but preserve existing usernames
    // if the login payload doesn't include them (it often won't).
    // refreshUser() below will immediately overwrite with the full DB record.
    const existing = JSON.parse(localStorage.getItem('poyou_settings') || '{}')
    const dbSettings = {
      role:               user.role              || existing.role              || 'SWE',
      githubUsername:     user.githubUsername    || existing.githubUsername    || '',
      leetcodeUsername:   user.leetcodeUsername  || existing.leetcodeUsername  || '',
      targetCompanies:    user.targetCompanies   || existing.targetCompanies   || [],
      emailNotifications: user.emailNotifications ?? existing.emailNotifications ?? true,
      linkedinUrl:        user.linkedinUrl       || existing.linkedinUrl       || '',
      email:              user.email             || existing.email             || '',
    }
    localStorage.setItem('poyou_settings', JSON.stringify(dbSettings))

    // Reset ALL cached API data so a new user never sees a previous user's stats
    set({
      user, token,
      settings: dbSettings,
      githubData:     null,
      leetcodeData:   null,
      placementScore: null,
      weeklyInsight:  null,
      flashcards:     [],
      alerts:         [],
    })

    // Immediately sync full profile from DB to get githubUsername / leetcodeUsername
    // Do this after set() so the token is already in state for the auth header
    setTimeout(() => get().refreshUser(), 0)
  },

  logout: () => {
    localStorage.removeItem('poyou_user')
    localStorage.removeItem('poyou_token')
    localStorage.removeItem('poyou_settings')
    // Wipe all cached API data so next user starts with a clean slate
    set({
      user: null, token: null,
      githubData:     null,
      leetcodeData:   null,
      placementScore: null,
      weeklyInsight:  null,
      flashcards:     [],
      contests:       [],
      news:           [],
      alerts:         [],
    })
  },

  // Refresh user from DB (call on app mount to stay in sync)
  refreshUser: async () => {
    try {
      const r = await getMe()
      const user = r.data.user
      localStorage.setItem('poyou_user', JSON.stringify(user))
      const dbSettings = {
        role:               user.role              || 'SWE',
        githubUsername:     user.githubUsername    || '',
        leetcodeUsername:   user.leetcodeUsername  || '',
        targetCompanies:    user.targetCompanies   || [],
        emailNotifications: user.emailNotifications ?? true,
        linkedinUrl:        user.linkedinUrl       || '',
        email:              user.email             || '',
      }
      localStorage.setItem('poyou_settings', JSON.stringify(dbSettings))

      // Restore persisted AI score from DB if available and store is empty
      const update = { user, settings: dbSettings }
      const lps = user.lastPlacementScore
      if (lps?.total != null && get().placementScore === null) {
        update.placementScore = {
          total:     lps.total,
          breakdown: lps.breakdown,
          advice:    lps.advice,
        }
      }

      set(update)
    } catch {
      // Token expired or invalid — don't force logout, just keep local state
    }
  },

  // ── Dashboard data ─────────────────────────────────────
  githubData:     null,
  leetcodeData:   null,
  placementScore: null,
  weeklyInsight:  null,
  flashcards:     [],
  contests:       [],
  news:           [],
  calendarEvents: [],
  alerts:         [],

  setGithubData:      (d) => set({ githubData: d }),
  setLeetcodeData:    (d) => set({ leetcodeData: d }),
  setPlacementScore:  (d) => set({ placementScore: d }),
  setWeeklyInsight:   (d) => set({ weeklyInsight: d }),
  setFlashcards:      (d) => set({ flashcards: d }),
  setContests:        (d) => set({ contests: d }),
  setNews:            (d) => set({ news: d }),
  setCalendarEvents:  (d) => set({ calendarEvents: d }),
  setAlerts:          (d) => set({ alerts: d }),

  // ── Settings ───────────────────────────────────────────
  // Loaded from localStorage initially (seeded from DB on login/refresh)
  settings: JSON.parse(localStorage.getItem('poyou_settings') || JSON.stringify({
    role: 'SWE',
    targetCompanies: ['Google', 'Microsoft', 'Amazon'],
    githubUsername: '',
    leetcodeUsername: '',
    linkedinUrl: '',
    emailNotifications: true,
    email: '',
  })),

  // Saves to BOTH localStorage AND MongoDB
  updateSettings: async (patch) => {
    const next = { ...get().settings, ...patch }
    localStorage.setItem('poyou_settings', JSON.stringify(next))
    set({ settings: next })
    try {
      await updateProfile(next)
    } catch (err) {
      console.warn('[store] Could not persist settings to DB:', err.message)
    }
  },

  // ── UI ─────────────────────────────────────────────────
  sidebarOpen: false,
  setSidebarOpen: (v) => set({ sidebarOpen: v }),
  activeTab: 'dashboard',
  setActiveTab: (t) => set({ activeTab: t }),
}))
