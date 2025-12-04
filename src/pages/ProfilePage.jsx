import { useState, useRef, useEffect, useCallback } from 'react'
import {
  User,
  HelpCircle,
  Shield,
  Mail,
  Clock,
  Calendar,
  Target,
  Award,
  Edit3,
  Save,
  X,
  LogOut
} from 'lucide-react'
import { supabase } from '../services/supabaseClient'

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState('profile')
  const [isEditing, setIsEditing] = useState(false)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editedProfile, setEditedProfile] = useState({
    name: '',
    bio: '',
    avatar: null
  })
  const nameInputRef = useRef(null)
  const bioInputRef = useRef(null)

  // Mock data untuk statistics
  const userStats = {
    streak: 12,
    weeklyAverage: 15.5,
    productivity: 85,
    goalsCompleted: 8,
    tasksDone: 45,
    totalStudyHours: 245
  }

  const initializeProfile = useCallback((userData) => {
    const displayName = getDisplayName(userData)
    setEditedProfile({
      name: displayName,
      bio: userData.user_metadata?.bio || 'Passionate learner and productivity enthusiast. Always looking for ways to improve and grow.'
    })
  }, [])

  const getCurrentUser = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      if (user) {
        initializeProfile(user)
      }
    } catch (error) {
      console.error('Error getting user:', error)
    } finally {
      setLoading(false)
    }
  }, [initializeProfile])

  useEffect(() => {
    getCurrentUser()
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user)
        initializeProfile(session.user)
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [getCurrentUser, initializeProfile])

  // Auto focus ke input name ketika editing mode aktif
  useEffect(() => {
    if (isEditing && nameInputRef.current) {
      nameInputRef.current.focus()
    }
  }, [isEditing])

  /* duplicate legacy definitions removed - using stable useCallback versions above */

  const getDisplayName = (userData) => {
    if (userData?.user_metadata?.full_name) {
      return userData.user_metadata.full_name
    }
    if (userData?.user_metadata?.name) {
      return userData.user_metadata.name
    }
    if (userData?.email) {
      return userData.email.split('@')[0]
    }
    return 'Learner'
  }

  const handleSaveProfile = async () => {
    if (!user) return
    
    setSaving(true)
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: editedProfile.name,
          bio: editedProfile.bio,
          avatar_url: editedProfile.avatar || null
        }
      })

      if (error) throw error

      // Refresh user data
      await getCurrentUser()
      setIsEditing(false)
      alert('Profile updated successfully!')
      
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('Failed to update profile. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  // Avatar upload removed per request

  const handleCancelEdit = () => {
    initializeProfile(user)
    setIsEditing(false)
  }

  // Avatar change handler removed

  // Preferences and theme controls removed per request

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  const StatCard = ({ icon: IconComponent, title, value, color = 'indigo' }) => {
    const colorClasses = {
      indigo: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400',
      emerald: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400',
      purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
      amber: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400'
    }

    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between mb-2 sm:mb-3">
            <div className={`p-1.5 sm:p-2 rounded-lg ${colorClasses[color]}`}>
            {IconComponent ? <IconComponent className="w-4 h-4 sm:w-5 sm:h-5" /> : null}
          </div>
        </div>
        <div>
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-1">
            {value}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm font-medium">
            {title}
          </p>
        </div>
      </div>
    )
  }

  const ProfileSection = () => {
    if (!user) return null

    const displayName = getDisplayName(user)
    const joinDate = user.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    }) : 'Recently'

    return (
      <div className="space-y-4 sm:space-y-6">
        {/* Profile Header */}
        <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">Profile Information</h2>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors text-sm sm:text-base self-end sm:self-auto"
              >
                <Edit3 className="w-4 h-4" />
                Edit Profile
              </button>
            ) : (
              <div className="flex gap-2 self-end sm:self-auto">
                <button
                  onClick={handleCancelEdit}
                  disabled={saving}
                  className="flex items-center gap-2 px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 text-sm"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
                <button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="flex items-center gap-2 px-3 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50 text-sm"
                >
                  {saving ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
            {/* Avatar Section */}
            <div className="shrink-0">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-linear-to-br from-indigo-500 to-purple-600 rounded-xl sm:rounded-2xl flex items-center justify-center text-white text-lg sm:text-xl font-bold overflow-hidden">
                {editedProfile.avatar ? (
                  <img 
                    src={editedProfile.avatar} 
                    alt="Profile" 
                    className="w-full h-full rounded-xl sm:rounded-2xl object-cover"
                  />
                ) : (
                  displayName.split(' ').map(n => n[0]).join('').toUpperCase()
                )}
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex-1 space-y-3 sm:space-y-4 text-center sm:text-left w-full">
              {isEditing ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 text-left">
                      Full Name
                    </label>
                    <input
                      ref={nameInputRef}
                      type="text"
                      value={editedProfile.name}
                      onChange={(e) => setEditedProfile(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 sm:px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:text-white text-sm sm:text-base"
                      placeholder="Enter your name"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          bioInputRef.current?.focus()
                        }
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 text-left">
                      Bio
                    </label>
                    <textarea
                      ref={bioInputRef}
                      value={editedProfile.bio}
                      onChange={(e) => setEditedProfile(prev => ({ ...prev, bio: e.target.value }))}
                      rows={2}
                      className="w-full px-3 sm:px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none dark:text-white text-sm sm:text-base"
                      placeholder="Tell us about yourself..."
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                      {displayName}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 flex items-center gap-1 sm:gap-2 mt-1 justify-center sm:justify-start text-sm">
                      <Mail className="w-3 h-3 sm:w-4 sm:h-4" />
                      {user.email}
                    </p>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-sm text-center sm:text-left">
                    {editedProfile.bio}
                  </p>
                  <div className="flex items-center gap-3 sm:gap-4 text-xs text-gray-500 dark:text-gray-400 justify-center sm:justify-start flex-wrap">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Joined {joinDate}
                    </div>
                    <div className="flex items-center gap-1">
                      <Award className="w-3 h-3" />
                      {userStats.goalsCompleted} goals
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <StatCard
            icon={Target}
            title="Productivity"
            value={`${userStats.productivity}%`}
            color="indigo"
          />
          <StatCard
            icon={Award}
            title="Goals"
            value={userStats.goalsCompleted}
            color="emerald"
          />
          <StatCard
            icon={Clock}
            title="Study Hours"
            value={userStats.totalStudyHours}
            color="purple"
          />
          <StatCard
            icon={Calendar}
            title="Streak"
            value={`${userStats.streak}d`}
            color="amber"
          />
        </div>

        {/* Account Actions - only Logout per request */}
        <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 sm:mb-6">Account</h3>
          <div>
            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 rounded-xl hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-colors group"
            >
              <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="font-medium text-sm sm:text-base">Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    )
  }
  

  const AboutSection = () => {
    return (
      <div className="space-y-4 sm:space-y-6">
        {/* App Information */}
        <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="text-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-linear-to-br from-indigo-500 to-purple-600 rounded-xl sm:rounded-2xl flex items-center justify-center text-white text-xl sm:text-2xl font-bold mx-auto mb-3 sm:mb-4">
              LF
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2">Learnful</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-3 sm:mb-4 text-sm sm:text-base">
              Version 1.0.0 • Built with ❤️ for productive learning
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-4">
              <button className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm">
                <HelpCircle className="w-4 h-4" />
                Help & Support
              </button>
              <button className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm">
                <Shield className="w-4 h-4" />
                Privacy Policy
              </button>
            </div>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">What's New</h3>
          <div className="space-y-2 sm:space-y-3">
            {[
              "Advanced learning analytics",
              "Cross-device synchronization", 
              "Customizable study sessions",
              "Smart task prioritization",
              "Progress tracking across goals"
            ].map((feature, index) => (
              <div key={index} className="flex items-center gap-2 sm:gap-3">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-indigo-500 rounded-full shrink-0"></div>
                <span className="text-gray-600 dark:text-gray-400 text-sm">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-3 sm:p-4 shadow-sm border border-gray-100 dark:border-gray-700 text-center">
            <div className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {userStats.weeklyAverage}h
            </div>
            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Weekly Avg</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-3 sm:p-4 shadow-sm border border-gray-100 dark:border-gray-700 text-center">
            <div className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {userStats.tasksDone}
            </div>
            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Tasks Done</div>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-indigo-600 mx-auto mb-3 sm:mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">Please log in to view your profile.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-3 sm:p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Profile & Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
            Manage your account and preferences
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
          {/* Sidebar Navigation - Horizontal scroll di mobile */}
          <div className="lg:w-64 shrink-0">
            <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-sm border border-gray-100 dark:border-gray-700 lg:sticky lg:top-6">
              <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 -mx-2 px-2 lg:mx-0 lg:px-0">
                {[{ id: 'profile', label: 'Profile', icon: User }, { id: 'about', label: 'About', icon: HelpCircle }].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center gap-2 lg:gap-3 px-3 py-2 rounded-lg lg:rounded-xl text-left transition-all duration-200 whitespace-nowrap min-w-max ${
                      activeTab === item.id
                        ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <item.icon className="w-4 h-4 lg:w-5 lg:h-5" />
                    <span className="font-medium text-sm lg:text-base">{item.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {activeTab === 'profile' && <ProfileSection />}
            {activeTab === 'about' && <AboutSection />}
          </div>
        </div>
      </div>
    </div>
  )
}