import { Brain, Home, CheckSquare, BookOpen, Calendar, User, LogIn, LogOut } from 'lucide-react'
import { useState, useEffect } from 'react'
import { supabase } from '../../services/supabaseClient'

export default function DesktopNavbar({ currentPage, onNavigate }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Nav items untuk user belum login
  const guestNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'learning', label: 'Learning', icon: BookOpen },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'auth', label: 'Auth', icon: LogIn } 
  ]

  // Nav items untuk user sudah login (tanpa auth)
  const userNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'learning', label: 'Learning', icon: BookOpen },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'profile', label: 'Profile', icon: User }
  ]

  const navItems = user ? userNavItems : guestNavItems

  useEffect(() => {
    getCurrentUser()
    
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user)
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const getCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    } catch (error) {
      console.error('Error getting user:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      setUser(null)
      onNavigate('dashboard') // Redirect ke dashboard setelah logout
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  const getAvatarUrl = () => {
    if (user?.user_metadata?.avatar_url) {
      return user.user_metadata.avatar_url
    }
    // Fallback avatar based on email
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.email || 'U')}&background=indigo&color=fff&bold=true`
  }

  if (loading) {
    return (
      <nav className="hidden md:block shadow-lg border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50 backdrop-blur-sm bg-white/95 dark:bg-gray-900/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-linear-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-linear-to-r from-gray-800 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                  Learnful
                </h1>
              </div>
            </div>
            <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-8 w-32 rounded"></div>
          </div>
        </div>
      </nav>
    )
  }

  return (
    <nav className="hidden md:block shadow-lg border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50 backdrop-blur-sm bg-white/95 dark:bg-gray-900/95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-linear-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-linear-to-r from-gray-800 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                Learnful
              </h1>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center space-x-8">
            {navItems.map((item) => {
              const IconComponent = item.icon
              const isActive = currentPage === item.id

              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`flex items-center gap-2 px-3 py-2 text-sm font-medium transition-all duration-200 border-b-2 ${
                    isActive
                      ? 'text-indigo-600 dark:text-indigo-400 border-indigo-500'
                      : 'text-gray-600 dark:text-gray-400 border-transparent hover:text-indigo-500 dark:hover:text-indigo-300'
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                  {item.label}
                </button>
              )
            })}
          </div>

          {/* User Info */}
          <div className="flex items-center space-x-4">
            {/* User Avatar & Logout */}
            {user ? (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <img 
                    src={getAvatarUrl()} 
                    alt="User Avatar"
                    className="w-8 h-8 rounded-full border-2 border-indigo-200 dark:border-indigo-800"
                  />
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0]}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {user.email}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            ) : (
              <div className="w-20"></div> // Spacer untuk konsistensi layout
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}