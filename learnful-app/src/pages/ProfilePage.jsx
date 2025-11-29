import { useState, useRef, useEffect, useCallback } from 'react'
import { 
  User, 
  Settings, 
  Bell, 
  Moon, 
  Sun, 
  Download, 
  Upload, 
  Shield, 
  HelpCircle,
  Mail,
  Clock,
  Calendar,
  Target,
  Award,
  Edit3,
  Camera,
  Save,
  X,
  Smartphone,
  Laptop,
  Cloud,
  LogOut,
  Trash2
} from 'lucide-react'
import { supabase } from '../services/supabaseClient'

export default function ProfilePage({ onThemeChange, darkMode }) {
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
  const [preferences, setPreferences] = useState({
    theme: 'dark',
    notifications: {
      email: true,
      push: true,
      reminders: true,
      weeklyReports: false
    },
    studyPreferences: {
      focusSessions: true,
      pomodoroDuration: 25,
      breakDuration: 5,
      dailyTarget: 4
    }
  })

  const fileInputRef = useRef(null)
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

  // Theme options
  const themeOptions = [
    { id: 'light', label: 'Light', Icon: Sun },
    { id: 'dark', label: 'Dark', Icon: Moon },
    { id: 'auto', label: 'Auto', Icon: Settings }
  ]

  const initializeProfile = useCallback((userData) => {
    const displayName = getDisplayName(userData)
    setEditedProfile({
      name: displayName,
      bio: userData.user_metadata?.bio || 'Passionate learner and productivity enthusiast. Always looking for ways to improve and grow.',
      avatar: userData.user_metadata?.avatar_url || null
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

  // Update preferences theme ketika darkMode berubah dari parent
  useEffect(() => {
    const currentTheme = darkMode ? 'dark' : 'light'
    console.log('Updating preferences theme to:', currentTheme)
    setPreferences(prev => ({
      ...prev,
      theme: currentTheme
    }))
  }, [darkMode])

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
      let avatarUrl = editedProfile.avatar

      // Jika ada avatar baru yang diupload (data URL), upload ke storage
      if (editedProfile.avatar && editedProfile.avatar.startsWith('data:')) {
        avatarUrl = await uploadAvatar(editedProfile.avatar)
      }

      // Update user metadata di Supabase
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: editedProfile.name,
          bio: editedProfile.bio,
          avatar_url: avatarUrl
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

  const uploadAvatar = async (avatarDataUrl) => {
    try {
      // Convert data URL to blob
      const response = await fetch(avatarDataUrl)
      const blob = await response.blob()
      
      // Upload ke Supabase Storage
      const fileName = `avatars/${user.id}/${Date.now()}.jpg`
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, blob, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) throw uploadError

      // Dapatkan public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)

      return publicUrl

    } catch (error) {
      console.error('Error uploading avatar:', error)
      throw error
    }
  }

  const handleCancelEdit = () => {
    initializeProfile(user)
    setIsEditing(false)
  }

  const handleAvatarChange = (event) => {
    const file = event.target.files[0]
    if (file) {
      // Validasi file type dan size
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file')
        return
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert('Image size should be less than 5MB')
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        setEditedProfile(prev => ({
          ...prev,
          avatar: e.target.result
        }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleThemeChange = (theme) => {
    console.log('Theme button clicked:', theme)
    if (onThemeChange) {
      onThemeChange(theme)
    }
    
    // Update local preferences state
    setPreferences(prev => ({
      ...prev,
      theme: theme
    }))

    // Persist preferences to localStorage
    const newPreferences = {
      ...preferences,
      theme: theme
    }
    try { localStorage.setItem('userPreferences', JSON.stringify(newPreferences)) } catch (e) { console.warn('Could not save userPreferences', e) }

    // Apply theme immediately on the client so UI updates right away
    try {
      if (theme === 'dark') {
        document.documentElement.classList.add('dark')
        document.documentElement.style.backgroundColor = '#111827'
        localStorage.setItem('darkMode', JSON.stringify(true))
      } else if (theme === 'light') {
        document.documentElement.classList.remove('dark')
        document.documentElement.style.backgroundColor = '#f9fafb'
        localStorage.setItem('darkMode', JSON.stringify(false))
      } else if (theme === 'auto') {
        const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        if (systemDark) document.documentElement.classList.add('dark')
        else document.documentElement.classList.remove('dark')
        localStorage.setItem('darkMode', JSON.stringify(systemDark))
      }
    } catch {
      // ignore errors in non-browser environments
    }
  }

  const handlePreferenceChange = (category, key, value) => {
    const newPreferences = {
      ...preferences,
      [category]: {
        ...preferences[category],
        [key]: value
      }
    }
    
    setPreferences(newPreferences)

    // Handle theme change khusus
    if (category === 'theme' && key === 'theme') {
      handleThemeChange(value)
      return // Stop execution here untuk theme change
    }

    // Simpan preferences ke localStorage untuk perubahan lainnya
    localStorage.setItem('userPreferences', JSON.stringify(newPreferences))
  }

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

  const SettingItem = ({ icon: Icon, title, description, children, isLast = false }) => {
    return (
      <div className={`flex items-center justify-between py-3 sm:py-4 ${!isLast ? 'border-b border-gray-200 dark:border-gray-700' : ''}`}>
        <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
          <div className="p-1.5 sm:p-2 bg-gray-100 dark:bg-gray-700 rounded-lg shrink-0">
            {Icon ? <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-400" /> : null}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">{title}</h4>
            <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm mt-1">{description}</p>
          </div>
        </div>
        <div className="shrink-0 ml-2">
          {children}
        </div>
      </div>
    )
  }

  const ToggleSwitch = ({ enabled, onChange }) => {
    return (
      <button
        onClick={() => onChange(!enabled)}
        className={`relative inline-flex h-5 w-9 sm:h-6 sm:w-11 items-center rounded-full transition-colors ${
          enabled ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'
        }`}
      >
        <span
          className={`inline-block h-3 w-3 sm:h-4 sm:w-4 transform rounded-full bg-white transition ${
            enabled ? 'translate-x-4 sm:translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
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
                <div className="relative">
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
                {isEditing && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-1 -right-1 bg-white dark:bg-gray-800 p-1.5 rounded-full shadow-lg border border-gray-200 dark:border-gray-600 hover:shadow-xl transition-all"
                  >
                    <Camera className="w-3 h-3 text-gray-600 dark:text-gray-400" />
                  </button>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleAvatarChange}
                  accept="image/*"
                  className="hidden"
                />
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
      </div>
    )
  }

  const PreferencesSection = () => {
    return (
      <div className="space-y-4 sm:space-y-6">
        {/* Theme Preferences */}
        <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 sm:mb-6">Appearance</h3>
          
          <div className="flex items-center justify-between py-3 sm:py-4">
            <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
              <div className="p-1.5 sm:p-2 bg-gray-100 dark:bg-gray-700 rounded-lg shrink-0">
                <Moon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">Theme</h4>
                <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm mt-1">
                  Choose between light and dark mode
                </p>
              </div>
            </div>
            <div className="shrink-0 ml-2">
              <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                {themeOptions.map((theme) => {
                  const { id, label, Icon } = theme
                  return (
                    <button
                      key={id}
                      onClick={() => handleThemeChange(id)}
                      className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all ${
                        preferences.theme === id
                          ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                      }`}
                    >
                      <Icon className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="hidden xs:inline">{label}</span>
                      <span className="xs:hidden">{label.charAt(0)}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Current Theme Indicator */}
          <div className="mt-3 sm:mt-4 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
            <p className="text-sm text-indigo-700 dark:text-indigo-300">
              Current theme: <span className="font-medium capitalize">{preferences.theme}</span>
              {preferences.theme === 'auto' && ' (Based on system preference)'}
            </p>
            <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">
              Actual mode: {darkMode ? 'Dark' : 'Light'}
            </p>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 sm:mb-6">Notifications</h3>
          
          <div className="space-y-1">
            <SettingItem
              icon={Mail}
              title="Email Notifications"
              description="Receive updates and weekly reports via email"
            >
              <ToggleSwitch
                enabled={preferences.notifications.email}
                onChange={(value) => handlePreferenceChange('notifications', 'email', value)}
              />
            </SettingItem>

            <SettingItem
              icon={Bell}
              title="Push Notifications"
              description="Get real-time alerts on your device"
            >
              <ToggleSwitch
                enabled={preferences.notifications.push}
                onChange={(value) => handlePreferenceChange('notifications', 'push', value)}
              />
            </SettingItem>

            <SettingItem
              icon={Clock}
              title="Reminder Notifications"
              description="Get reminded about upcoming tasks and sessions"
              isLast={true}
            >
              <ToggleSwitch
                enabled={preferences.notifications.reminders}
                onChange={(value) => handlePreferenceChange('notifications', 'reminders', value)}
              />
            </SettingItem>
          </div>
        </div>

        {/* Study Preferences */}
        <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 sm:mb-6">Study Preferences</h3>
          
          <div className="space-y-1">
            <SettingItem
              icon={Target}
              title="Focus Sessions"
              description="Enable Pomodoro-style focus sessions"
            >
              <ToggleSwitch
                enabled={preferences.studyPreferences.focusSessions}
                onChange={(value) => handlePreferenceChange('studyPreferences', 'focusSessions', value)}
              />
            </SettingItem>

            <SettingItem
              icon={Clock}
              title="Daily Study Target"
              description="Hours of study per day"
              isLast={true}
            >
              <select
                value={preferences.studyPreferences.dailyTarget}
                onChange={(e) => handlePreferenceChange('studyPreferences', 'dailyTarget', parseInt(e.target.value))}
                className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-2 sm:px-3 py-1 text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:text-white"
              >
                {[2, 3, 4, 5, 6, 8].map(hours => (
                  <option key={hours} value={hours}>{hours} hours</option>
                ))}
              </select>
            </SettingItem>
          </div>
        </div>
      </div>
    )
  }

  const DataSection = () => {
    return (
      <div className="space-y-4 sm:space-y-6">
        {/* Backup & Restore */}
        <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 sm:mb-6">Data Management</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <button className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-gray-50 dark:bg-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors group">
              <div className="p-2 sm:p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                <Download className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="text-left flex-1 min-w-0">
                <h4 className="font-medium text-gray-900 dark:text-white text-sm sm:text-base group-hover:text-emerald-600 dark:group-hover:text-emerald-400 truncate">
                  Export Data
                </h4>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  Download your data as JSON file
                </p>
              </div>
            </button>

            <button className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-gray-50 dark:bg-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors group">
              <div className="p-2 sm:p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Upload className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="text-left flex-1 min-w-0">
                <h4 className="font-medium text-gray-900 dark:text-white text-sm sm:text-base group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate">
                  Import Data
                </h4>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  Restore from backup file
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Sync Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 sm:mb-6">Sync & Devices</h3>
          
          <div className="space-y-3 sm:space-y-4">
            <SettingItem
              icon={Cloud}
              title="Cloud Sync"
              description="Automatically sync your data across devices"
            >
              <ToggleSwitch
                enabled={true}
                onChange={() => {}}
              />
            </SettingItem>

            <div className="flex items-center justify-between py-3 sm:py-4">
              <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                <div className="p-1.5 sm:p-2 bg-gray-100 dark:bg-gray-700 rounded-lg shrink-0">
                  <Smartphone className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">Mobile App</h4>
                  <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">Last sync: 2 hours ago</p>
                </div>
              </div>
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shrink-0"></div>
            </div>

            <SettingItem
              icon={Laptop}
              title="Desktop App"
              description="Sync with desktop application"
              isLast={true}
            >
              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
            </SettingItem>
          </div>
        </div>

        {/* Account Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 sm:mb-6">Account</h3>
          
          <div className="space-y-2 sm:space-y-3">
            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 rounded-xl hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-colors group"
            >
              <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="font-medium text-sm sm:text-base">Sign Out</span>
            </button>

            <button className="w-full flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-rose-500 text-white rounded-xl hover:bg-rose-600 transition-colors group">
              <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="font-medium text-sm sm:text-base">Delete Account</span>
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
                {[
                  { id: 'profile', label: 'Profile', icon: User },
                  { id: 'preferences', label: 'Preferences', icon: Settings },
                  { id: 'data', label: 'Data & Sync', icon: Cloud },
                  { id: 'about', label: 'About', icon: HelpCircle }
                ].map((item) => (
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
            {activeTab === 'preferences' && <PreferencesSection />}
            {activeTab === 'data' && <DataSection />}
            {activeTab === 'about' && <AboutSection />}
          </div>
        </div>
      </div>
    </div>
  )
}