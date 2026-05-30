import axios from 'axios'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

// ── helpers ──────────────────────────────────────────────────────────────────
const getToken = () => localStorage.getItem('poyou_token')

const authHeaders = () =>
  getToken() ? { Authorization: `Bearer ${getToken()}` } : {}

// ── Auth ─────────────────────────────────────────────────────────────────────
export const login = (data) =>
  axios.post(`${BASE}/auth/login`, data)

export const register = (data) =>
  axios.post(`${BASE}/auth/register`, data)

export const googleLogin = (credential) =>
  axios.post(`${BASE}/auth/google`, { credential })

export const getMe = () =>
  axios.get(`${BASE}/auth/me`, { headers: authHeaders() })

export const updateProfile = (data) =>
  axios.patch(`${BASE}/auth/profile`, data, { headers: authHeaders() })

// ── GitHub ───────────────────────────────────────────────────────────────────
export const fetchGithub = (username) =>
  axios.get(`${BASE}/github/${username}`)

// ── LeetCode ─────────────────────────────────────────────────────────────────
export const fetchLeetcode = (username) =>
  axios.get(`${BASE}/leetcode/${username}`)

// ── AI — Score & Insight ─────────────────────────────────────────────────────
export const fetchScore = (payload) =>
  axios.post(`${BASE}/ai/score`, payload, { headers: authHeaders() })

export const fetchInsight = (payload) =>
  axios.post(`${BASE}/ai/insight`, payload, { headers: authHeaders() })

// ── AI — Flashcards ───────────────────────────────────────────────────────────
export const fetchFlashcards = (payload) =>
  axios.post(`${BASE}/ai/flashcards`, payload, { headers: authHeaders() })

// ── AI — Tutor ────────────────────────────────────────────────────────────────
export const askTutor = (payload) =>
  axios.post(`${BASE}/ai/tutor`, payload, { headers: authHeaders() })

// ── AI — Email Digest ─────────────────────────────────────────────────────────
export const triggerDigest = (payload = {}) =>
  axios.post(`${BASE}/ai/email-digest`, payload, { headers: authHeaders() })

// ── Contests ──────────────────────────────────────────────────────────────────
export const fetchContests = () =>
  axios.get(`${BASE}/contests`)

// ── News ──────────────────────────────────────────────────────────────────────
export const fetchNews = (companies) =>
  axios.get(`${BASE}/news`, { params: companies ? { companies } : {} })

// ── Facts ─────────────────────────────────────────────────────────────────────
export const fetchFact = () =>
  axios.get(`${BASE}/facts/random`)

// ── Calendar Events ───────────────────────────────────────────────────────────
export const getEvents = () =>
  axios.get(`${BASE}/events`, { headers: authHeaders() })

export const createEvent = (data) =>
  axios.post(`${BASE}/events`, data, { headers: authHeaders() })

export const deleteEvent = (id) =>
  axios.delete(`${BASE}/events/${id}`, { headers: authHeaders() })

// ── LinkedIn ──────────────────────────────────────────────────────────────────
export const getLinkedinLog = () =>
  axios.get(`${BASE}/linkedin/log`, { headers: authHeaders() })

export const linkedinCheckin = (data) =>
  axios.post(`${BASE}/linkedin/checkin`, data, { headers: authHeaders() })

export const getLinkedinStreak = () =>
  axios.get(`${BASE}/linkedin/streak`, { headers: authHeaders() })
