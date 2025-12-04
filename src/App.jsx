import { useState, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { supabase } from './services/supabaseClient'
import SplashScreen from './pages/SplashScreen'
import DashboardPage from './pages/DashboardPage'
import TasksPage from './pages/TasksPage'
import TaskDetailPage from './pages/TaskDetailPage'
import GoalDetailPage from './pages/GoalDetailPage'
import LearningPage from './pages/LearningPage'
import CalendarPage from './pages/CalendarPage'
import ProfilePage from './pages/ProfilePage'
import Auth from './components/auth/Auth'
import DesktopNavbar from './components/navbar/DesktopNavbar'
import MobileNavbar from './components/navbar/MobileNavbar'
import PWABadge from './PWABadge'
import './index.css'

function App() {
  const [showSplash, setShowSplash] = useState(true)
  const [currentPage, setCurrentPage] = useState(() => {
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('learnful_currentPage')
        return saved || 'dashboard'
      }
    } catch {
      // ignore
    }
    return 'dashboard'
  })
  const [darkMode, setDarkMode] = useState(() => {
    // Check localStorage untuk dark mode preference
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('darkMode')
      if (saved !== null) {
        return JSON.parse(saved)
      }
    }
    // Check system preference sebagai fallback
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    // Default ke dark mode
    return true
  })
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Handle dark mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    
    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('darkMode', JSON.stringify(darkMode))
    }
  }, [darkMode])

  // Handle authentication
  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)
      } catch (error) {
        console.error('Error getting user:', error)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    getCurrentUser()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session?.user?.email)
      setUser(session?.user || null)
      setLoading(false)

      // Only navigate to dashboard after SIGNED_IN if the app was showing the auth page.
      // Supabase may emit session refresh events when switching tabs; avoid forcing navigation
      // which resets the user's current location unexpectedly.
      if (event === 'SIGNED_IN' && session?.user) {
        setCurrentPage(prev => prev === 'auth' ? 'dashboard' : prev)
      }

      // Redirect to auth page when signed out
      if (event === 'SIGNED_OUT') {
        setCurrentPage('auth')
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleSplashComplete = () => {
    setShowSplash(false)
  }

  const handleNavigation = (page) => {
    setCurrentPage(page)
    try {
      if (typeof window !== 'undefined') localStorage.setItem('learnful_currentPage', page)
    } catch {
      // ignore
    }
  }

  const handleThemeChange = (theme) => {
    console.log('Theme changed to:', theme)
    switch (theme) {
      case 'dark':
        setDarkMode(true)
        break
      case 'light':
        setDarkMode(false)
        break
      case 'auto': {
        const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        setDarkMode(systemDark)
        break
      }
      default:
        setDarkMode(true)
    }
  }

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      setCurrentPage('auth')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const renderCurrentPage = () => {
    // Show loading state
    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading...</p>
          </div>
        </div>
      )
    }

    // Show auth page if not logged in
    if (!user) {
      return <Auth onNavigate={handleNavigation} />
    }

    // Render pages based on currentPage state
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage />
      case 'tasks':
        return <TasksPage />
      case 'task-detail':
        return <TaskDetailPage />
      case 'learning':
        return <LearningPage />
      case 'calendar':
        return <CalendarPage />
      case 'profile':
        return (
          <ProfilePage 
            onThemeChange={handleThemeChange}
            darkMode={darkMode}
            onLogout={handleLogout}
          />
        )
      default:
        return <DashboardPage />
    }
  }

  // Show splash screen
  if (showSplash) {
    return <SplashScreen onComplete={handleSplashComplete} />
  }

  const showNavbar = user && currentPage !== 'auth' && currentPage !== 'task-detail'

  return (
    <div className="min-h-screen transition-colors duration-300">
      <div className={`min-h-screen ${darkMode ? 'dark:sm:bg-gray-900 bg-transparent' : 'bg-transparent sm:bg-gray-50'}`}>
        {/* Desktop Navbar - hanya tampil jika user login dan bukan di auth/task-detail page */}
        {showNavbar && (
          <DesktopNavbar 
            currentPage={currentPage}
            onNavigate={handleNavigation}
            onLogout={handleLogout}
            darkMode={darkMode}
          />
        )}
        
        {/* Main content */}
        <main className={`min-h-screen transition-all duration-300 ${
          showNavbar 
            ? 'pt-15 lg:pt-0 lg:pl-0 pb-18 lg:pb-0' 
            : 'pt-0 pb-0'
        }`}>
          <Routes>
            <Route path="/tasks/:id" element={<TaskDetailPage />} />
            <Route path="/learning/:id" element={<GoalDetailPage />} />
            <Route path="*" element={renderCurrentPage()} />
          </Routes>
        </main>
        
        {/* Mobile Navbar - hanya tampil jika user login dan bukan di auth/task-detail page */}
        {showNavbar && (
          <MobileNavbar 
            currentPage={currentPage}
            onNavigate={handleNavigation}
            darkMode={darkMode}
          />
        )}
        
        {/* PWA Badge */}
        <PWABadge />
      </div>
    </div>
  )
}

export default App