import { Home, CheckSquare, BookOpen, Calendar, User, LogOut } from 'lucide-react'
import { useState, useEffect } from 'react'
import { supabase } from '../../services/supabaseClient'

export default function MobileNavbar({ currentPage, onNavigate }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'learning', label: 'Learning', icon: BookOpen },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'profile', label: 'Profile', icon: User }
  ]

  // Ensure equal-width columns for nav items so they're centered on any viewport
  const getGridStyle = (count) => ({ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` })

  useEffect(() => {
    getCurrentUser()
    
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
      onNavigate('dashboard')
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  const handleNavClick = (pageId) => {
    onNavigate(pageId)
  }

  // Jika masih loading atau belum ada user, tidak render navbar
  if (loading || !user) {
    return null
  }

  return (
    <>
      {/* Top Sidebar - Hanya untuk logout */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-gray-900 border-b border-transparent z-50">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-linear-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-white">
                {user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User'}
              </p>
              <p className="text-xs text-gray-400">
                {user.email}
              </p>
            </div>
          </div>
          
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>

      {/* Bottom Navigation - Tanpa garis putih */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-transparent px-2 py-2 z-50" style={{ paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom))', paddingLeft: 'env(safe-area-inset-left)', paddingRight: 'env(safe-area-inset-right)' }}>
        <div className="overflow-hidden w-full">
          <div className="grid w-full items-center" style={getGridStyle(navItems.length)}>
            {navItems.map((item) => {
              const IconComponent = item.icon
              const isActive = currentPage === item.id

              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`flex flex-col items-center justify-center min-w-0 py-2 px-1 transition-all duration-200 rounded-xl ${
                    isActive
                      ? 'text-indigo-400 bg-indigo-900/20'
                      : 'text-gray-400 hover:text-indigo-300'
                  }`}
                >
                  <IconComponent size={20} className="mb-0.5" strokeWidth={isActive ? 2.5 : 1.5} />
                  <span className="text-xs font-medium">{item.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </nav>
    </>
  )
}