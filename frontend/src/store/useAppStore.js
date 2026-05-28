import { create } from 'zustand'

export const useAppStore = create((set, get) => ({
  // Auth
  user: JSON.parse(localStorage.getItem('poyou_user') || 'null'),
  token: localStorage.getItem('poyou_token') || null,
  setAuth: (user, token) => {
    localStorage.setItem('poyou_user', JSON.stringify(user))
    localStorage.setItem('poyou_token', token)
    set({ user, token })
  },
  logout: () => {
    localStorage.removeItem('poyou_user')
    localStorage.removeItem('poyou_token')
    set({ user: null, token: null })
  },

  // Dashboard data
  githubData: null,
  leetcodeData: null,
  placementScore: null,
  weeklyInsight: null,
  flashcards: [],
  contests: [],
  news: [],
  calendarEvents: [],
  alerts: [],

  setGithubData:      (d) => set({ githubData: d }),
  setLeetcodeData:    (d) => set({ leetcodeData: d }),
  setPlacementScore:  (d) => set({ placementScore: d }),
  setWeeklyInsight:   (d) => set({ weeklyInsight: d }),
  setFlashcards:      (d) => set({ flashcards: d }),
  setContests:        (d) => set({ contests: d }),
  setNews:            (d) => set({ news: d }),
  setCalendarEvents:  (d) => set({ calendarEvents: d }),
  setAlerts:          (d) => set({ alerts: d }),

  // Settings
  settings: JSON.parse(localStorage.getItem('poyou_settings') || JSON.stringify({
    role: 'SWE',
    targetCompanies: ['Google', 'Microsoft', 'Amazon'],
    githubUsername: '',
    leetcodeUsername: '',
    linkedinUrl: '',
    emailNotifications: true,
    email: '',
  })),
  updateSettings: (patch) => {
    const next = { ...get().settings, ...patch }
    localStorage.setItem('poyou_settings', JSON.stringify(next))
    set({ settings: next })
  },

  // UI
  sidebarOpen: false,
  setSidebarOpen: (v) => set({ sidebarOpen: v }),
  activeTab: 'dashboard',
  setActiveTab: (t) => set({ activeTab: t }),
}))
