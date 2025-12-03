import { Home, CheckSquare, BookOpen, Calendar, User, LogIn, LogOut } from 'lucide-react'
import { useState, useEffect } from 'react'
import { supabase } from '../../services/supabaseClient'

export default function MobileNavbar({ currentPage, onNavigate }) {
  const [user, setUser] = useState(null)

  // Nav items untuk user belum login
  const guestNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'learning', label: 'Learning', icon: BookOpen },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'auth', label: 'Auth', icon: LogIn } 
  ]

  // Nav items untuk user sudah login (tanpa logout di bottom)
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
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user)
      } else {
        setUser(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const getCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    } catch (error) {
      console.error('Error getting user:', error)
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

  return (
    <>
      {/* Top Sidebar - Hanya untuk logout */}
      {user && (
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
      )}

      {/* Bottom Navigation - Tanpa logout */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-gray-900 backdrop-blur-lg border-t border-transparent px-4 py-2 z-50">
        <div className="flex items-center justify-around max-w-lg mx-auto">
          {navItems.map((item) => {
            const IconComponent = item.icon
            const isActive = currentPage === item.id

            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`flex flex-col items-center py-2 px-3 transition-all duration-200 rounded-xl ${
                  isActive
                    ? 'text-indigo-400 bg-indigo-900/20' 
                    : 'text-gray-400 hover:text-indigo-300'
                }`}
              >
                <IconComponent 
                  size={20} 
                  className="mb-1" 
                  strokeWidth={isActive ? 2.5 : 1.5}
                />
                <span className="text-xs font-medium">
                  {item.label}
                </span>
              </button>
            )
          })}
        </div>
      </nav>
    </>
  )
}