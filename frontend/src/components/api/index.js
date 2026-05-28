import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem('poyou_token')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('poyou_token')
      localStorage.removeItem('poyou_user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// Auth
export const login  = (d) => api.post('/auth/login', d)
export const register = (d) => api.post('/auth/register', d)

// GitHub
export const fetchGithub  = (username) => api.get(`/github/${username}`)

// LeetCode
export const fetchLeetcode = (username) => api.get(`/leetcode/${username}`)

// Placement Score (AI)
export const fetchScore   = (payload)   => api.post('/ai/score', payload)

// Weekly insight (AI)
export const fetchInsight  = (payload)  => api.post('/ai/insight', payload)

// Flashcards (AI)
export const fetchFlashcards = (payload) => api.post('/ai/flashcards', payload)

// LeetCode AI tutor
export const askTutor = (payload) => api.post('/ai/tutor', payload)

// News
export const fetchNews = (companies) => api.get('/news', { params: { companies: companies.join(',') } })

// Contests
export const fetchContests = () => api.get('/contests')

// Calendar events
export const getEvents    = () => api.get('/events')
export const createEvent  = (d) => api.post('/events', d)
export const deleteEvent  = (id) => api.delete(`/events/${id}`)

// LinkedIn manual check-in
export const linkedinCheckin = (d) => api.post('/linkedin/checkin', d)
export const getLinkedinLog  = () => api.get('/linkedin/log')

// Email agent trigger
export const triggerDigest = () => api.post('/ai/email-digest')

// Interesting facts
export const fetchFact = () => api.get('/facts/random')

export default api
