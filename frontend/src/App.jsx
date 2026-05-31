import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAppStore } from './store/useAppStore'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import Dashboard from './pages/Dashboard'
import StreakPage from './pages/StreakPage'
import ScorePage from './pages/ScorePage'
import ContestsPage from './pages/ContestsPage'
import NewsPage from './pages/NewsPage'
import TutorPage from './pages/TutorPage'
import FlashcardsPage from './pages/FlashcardsPage'
import CalendarPage from './pages/CalendarPage'
import SettingsPage from './pages/SettingsPage'
import FactsPage from './pages/FactsPage'

function PrivateRoute({ children }) {
  const token = useAppStore((s) => s.token)
  return token ? children : <Navigate to="/login" replace />
}

export default function App() {
  const token       = useAppStore(s => s.token)
  const refreshUser = useAppStore(s => s.refreshUser)

  // On every app load, re-sync the user profile (incl. githubUsername, leetcodeUsername) from MongoDB
  useEffect(() => {
    if (token) refreshUser()
  }, [])

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#151e3f',
            color: '#fff1e6',
            border: '1px solid rgba(254,200,154,0.2)',
            fontFamily: 'DM Sans, sans-serif',
          },
        }}
      />
      <Routes>
        <Route path="/login"          element={<LoginPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route
          path="/*"
          element={
            <PrivateRoute>
              <Layout>
                <Routes>
                  <Route path="/"           element={<Dashboard />} />
                  <Route path="/streaks"    element={<StreakPage />} />
                  <Route path="/score"      element={<ScorePage />} />
                  <Route path="/contests"   element={<ContestsPage />} />
                  <Route path="/news"       element={<NewsPage />} />
                  <Route path="/tutor"      element={<TutorPage />} />
                  <Route path="/flashcards" element={<FlashcardsPage />} />
                  <Route path="/calendar"   element={<CalendarPage />} />
                  <Route path="/facts"      element={<FactsPage />} />
                  <Route path="/settings"   element={<SettingsPage />} />
                </Routes>
              </Layout>
            </PrivateRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}
