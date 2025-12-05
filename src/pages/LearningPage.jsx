import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus,
  Target,
  Clock,
  TrendingUp,
  Calendar,
  Play,
  Pause,
  BookOpen,
  Edit,
  Trash2,
  CheckCircle,
  Flame,
  X,
  BarChart3,
  Activity,
  Award,
  Zap,
  Save
} from 'lucide-react'

import { supabase, isSupabaseConfigured } from '../services/supabaseClient.js'

// Fallback/mock data when Supabase isn't configured
const mockLearningData = { goals: [], study_sessions: [] }

const ProgressRing = ({ progress, color = 'indigo', size = 80 }) => {
  const strokeWidth = 6
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const strokeDashoffset = circumference - (progress / 100) * circumference

  const colorClasses = {
    indigo: 'text-indigo-500',
    emerald: 'text-emerald-500',
    purple: 'text-purple-500',
    rose: 'text-rose-500',
    amber: 'text-amber-500'
  }

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle 
          cx={size / 2} 
          cy={size / 2} 
          r={radius} 
          stroke="currentColor" 
          strokeWidth={strokeWidth} 
          fill="transparent" 
          className="text-gray-200 dark:text-gray-700" 
        />
        <circle 
          cx={size / 2} 
          cy={size / 2} 
          r={radius} 
          stroke="currentColor" 
          strokeWidth={strokeWidth} 
          fill="transparent" 
          strokeDasharray={circumference} 
          strokeDashoffset={strokeDashoffset} 
          strokeLinecap="round" 
          className={`transition-all duration-1000 ease-out ${colorClasses[color]}`} 
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`text-sm font-bold ${colorClasses[color]}`}>
          {progress}%
        </span>
      </div>
    </div>
  )
}

const GoalCard = ({ goal, sessionTimer, timeElapsed, isTimerRunning, onStartTimer, onStopTimer, onCompleteSession, onEditGoal, onDeleteGoal, onOpen }) => {
  const colorClasses = {
    indigo: 'from-indigo-500 to-purple-600',
    emerald: 'from-emerald-500 to-teal-600',
    purple: 'from-purple-500 to-indigo-600',
    rose: 'from-rose-500 to-pink-600',
    amber: 'from-amber-500 to-orange-600'
  }

  const isActiveSession = sessionTimer === goal.id
  const IconComponent = BookOpen
  const formatTime = (seconds) => { 
    const mins = Math.floor(seconds / 60); 
    const secs = seconds % 60; 
    return `${mins.toString().padStart(2,'0')}:${secs.toString().padStart(2,'0')}` 
  }

  // Calculate progress based on database structure
  const progressPercentage = goal.target_hours_per_week 
    ? Math.min(Math.round(((goal.current_progress || 0) / (goal.target_hours_per_week * 60)) * 100), 100)
    : 0

  const currentHours = Math.floor((goal.current_progress || 0) / 60)
  const currentMinutes = (goal.current_progress || 0) % 60
  const targetHours = goal.target_hours_per_week || 0

  return (
    <div onClick={() => onOpen && onOpen()} role="button" tabIndex={0} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onOpen && onOpen()} className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl p-3 sm:p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all duration-300 group cursor-pointer">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 sm:p-3 rounded-lg sm:rounded-xl bg-linear-to-r ${colorClasses[goal.color] || colorClasses.indigo} text-white`}>
            <IconComponent size={20} className="sm:w-6 sm:h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 dark:text-white text-base sm:text-lg truncate">{goal.title}</h3>
            <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm mt-1 line-clamp-2">{goal.description}</p>
          </div>
        </div>
          <div className="flex items-center gap-1 sm:gap-2 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
          <button 
            onClick={(e) => { e.stopPropagation(); onEditGoal(goal) }} 
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            title="Edit goal"
          >
            <Edit size={14} className="sm:w-4 sm:h-4" />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onDeleteGoal(goal.id) }} 
            className="p-1 text-gray-400 hover:text-rose-500"
            title="Delete goal"
          >
            <Trash2 size={14} className="sm:w-4 sm:h-4" />
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className="flex-1">
          <div className="flex justify-between text-xs sm:text-sm mb-2">
            <span className="text-gray-600 dark:text-gray-400">Progress</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {currentHours}h {currentMinutes > 0 ? `${currentMinutes}m` : ''} / {targetHours}h
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 sm:h-2">
            <div 
              className={`h-1.5 sm:h-2 rounded-full bg-linear-to-r ${colorClasses[goal.color] || colorClasses.indigo} transition-all duration-1000`} 
              style={{ width: `${progressPercentage}%` }} 
            />
          </div>
        </div>
        <div className="ml-3">
          <ProgressRing progress={progressPercentage} color={goal.color} size={50} className="sm:w-15 sm:h-15" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-xs text-gray-600 dark:text-gray-400 mb-1">
            <Target size={12} className="sm:w-4 sm:h-4" />
            <span className="hidden xs:inline">Weekly</span>
            <span className="xs:hidden">Target</span>
          </div>
          <div className="font-bold text-gray-900 dark:text-white text-sm sm:text-base">{targetHours}h</div>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-xs text-gray-600 dark:text-gray-400 mb-1">
            <Clock size={12} className="sm:w-4 sm:h-4" />
            <span>Progress</span>
          </div>
          <div className="font-bold text-gray-900 dark:text-white text-sm sm:text-base">{progressPercentage}%</div>
        </div>
      </div>

      <div className="flex gap-2">
        {isActiveSession ? (
          <>
            {isTimerRunning ? (
              // Tombol Pause saat timer berjalan
              <button 
                onClick={onStopTimer} 
                className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-2 px-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 text-sm"
              >
                <Pause size={14} />
                <span className="hidden xs:inline">Pause</span>
                <span>({formatTime(timeElapsed)})</span>
              </button>
            ) : (
              // Tombol Resume saat timer paused
              <button 
                onClick={() => onStartTimer(goal.id)} 
                className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 px-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 text-sm"
              >
                <Play size={14} />
                <span className="hidden xs:inline">Resume</span>
                <span>({formatTime(timeElapsed)})</span>
              </button>
            )}
            <button 
              onClick={onCompleteSession} 
              className="bg-emerald-500 hover:bg-emerald-600 text-white py-2 px-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 text-sm min-w-20"
            >
              <CheckCircle size={14} />
              <span className="hidden xs:inline">Complete</span>
              <span className="xs:hidden">Done</span>
            </button>
          </>
        ) : null}
      </div>
    </div>
  )
}

const GoalModal = ({ isOpen, onClose, onSave, goal, isEditing }) => {

  const [formData, setFormData] = useState({ 
    title: '', 
    description: '', 
    target_hours_per_week: '', 
    color: 'indigo'
  })
  const [loading, setLoading] = useState(false)

  // Initialize form when modal opens or goal changes
  useEffect(() => {
    if (isEditing && goal) {
      setFormData({
        title: goal.title || '',
        description: goal.description || '',
        target_hours_per_week: goal.target_hours_per_week || '',
        color: goal.color || 'indigo'
      })
    } else {
      setFormData({ 
        title: '', 
        description: '', 
        target_hours_per_week: '', 
        color: 'indigo'
      })
    }
  }, [isOpen, goal, isEditing])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onSave({
        ...formData,
        target_hours_per_week: parseInt(formData.target_hours_per_week) || 0
      })
      setFormData({ 
        title: '', 
        description: '', 
        target_hours_per_week: '', 
        color: 'indigo'
      })
      onClose()
    } catch (err) {
      console.error('Error saving goal:', err)
      alert('Failed to save goal. Please try again.')
    } finally { 
      setLoading(false) 
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
      <div className="bg-gray-50 dark:bg-gray-900 sm:bg-white dark:sm:bg-gray-800 rounded-t-2xl sm:rounded-2xl p-3 sm:p-6 w-full max-w-md max-h-[90vh] sm:max-h-[70vh] overflow-hidden flex flex-col" style={{ marginBottom: 'calc(65px + env(safe-area-inset-bottom))', paddingBottom: '12px' }}>
        {/* Swipe indicator for mobile */}
        <div className="sm:hidden flex justify-center mb-2">
          <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
        </div>

        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
            {isEditing ? 'Edit Goal' : 'New Goal'}
          </h2>
          <button type="button" onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <X size={20} className="text-white" />
          </button>
        </div>

        {/* Scrollable form area */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-y-auto space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Goal Title *
            </label>
            <input 
              required 
              type="text" 
              value={formData.title} 
              onChange={(e) => setFormData({ ...formData, title: e.target.value })} 
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white text-sm sm:text-base" 
              placeholder="e.g., Master React Advanced Concepts" 
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea 
              value={formData.description} 
              onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
              rows={3} 
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white text-sm sm:text-base resize-none" 
              placeholder="Describe your learning goal..." 
            />
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Target Hours
              </label>
              <input 
                type="number" 
                value={formData.target_hours_per_week} 
                onChange={(e) => setFormData({ ...formData, target_hours_per_week: e.target.value })} 
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white text-sm sm:text-base" 
                placeholder="5" 
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Color
              </label>
              <select 
                value={formData.color} 
                onChange={(e) => setFormData({ ...formData, color: e.target.value })} 
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white text-sm sm:text-base"
              >
                <option value="indigo">Indigo</option>
                <option value="emerald">Emerald</option>
                <option value="purple">Purple</option>
                <option value="rose">Rose</option>
                <option value="amber">Amber</option>
              </select>
            </div>
          </div>
        </form>

        {/* Action bar (outside scroll) so always visible) */}
        <div className="flex gap-2 sm:gap-3 pt-4 border-t border-transparent sm:border-gray-200 dark:border-transparent dark:sm:border-gray-700 bg-transparent dark:bg-transparent sm:bg-white dark:sm:bg-gray-800" style={{ paddingBottom: 'calc(16px + env(safe-area-inset-bottom))' }}>
          <button 
            type="button" 
            onClick={onClose} 
            className="flex-1 px-3 sm:px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm sm:text-base"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            onClick={handleSubmit}
            disabled={loading || !formData.title.trim()} 
            className="flex-1 px-3 sm:px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {loading ? 'Saving...' : (isEditing ? 'Update' : 'Create')}
          </button>
        </div>
      </div>
    </div>
  )
}

// Study Schedule Component dengan fitur hapus
const StudySchedule = ({ goals, studySessions, onDeleteSession }) => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] // Shortened for mobile
  const timeSlots = ['Morning', 'Afternoon', 'Evening']

  const getSessionsForDayAndTime = (day, timeSlot) => {
    return studySessions.filter(session => {
      const sessionDate = new Date(session.session_date)
      const sessionDay = sessionDate.toLocaleDateString('en-US', { weekday: 'short' })
      const sessionHour = sessionDate.getHours()
      
      let sessionTimeSlot = 'Morning'
      if (sessionHour >= 12 && sessionHour < 17) sessionTimeSlot = 'Afternoon'
      if (sessionHour >= 17) sessionTimeSlot = 'Evening'
      
      return sessionDay === day && sessionTimeSlot === timeSlot
    })
  }

  const getGoalTitle = (goalId) => {
    const goal = goals.find(g => g.id.toString() === goalId.toString())
    return goal ? goal.title : 'Unknown Goal'
  }

  const getGoalColor = (goalId) => {
    const goal = goals.find(g => g.id.toString() === goalId.toString())
    const colorMap = {
      indigo: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      emerald: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      purple: 'bg-purple-100 text-purple-800 border-purple-200',
      rose: 'bg-rose-100 text-rose-800 border-rose-200',
      amber: 'bg-amber-100 text-amber-800 border-amber-200'
    }
    return colorMap[goal?.color] || colorMap.indigo
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl p-3 sm:p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Weekly Schedule</h3>
        
        <div className="overflow-x-auto -mx-2 px-2 sm:mx-0 sm:px-0">
          <table className="w-full min-w-[500px] sm:min-w-full">
            <thead>
              <tr>
                <th className="w-20 sm:w-32 p-2 sm:p-3 text-left text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">Time</th>
                {days.map(day => (
                  <th key={day} className="p-2 sm:p-3 text-center text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {timeSlots.map(timeSlot => (
                <tr key={timeSlot} className="border-t border-gray-200 dark:border-gray-700">
                  <td className="p-2 sm:p-3 text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                    {timeSlot}
                  </td>
                  {days.map(day => {
                    const sessions = getSessionsForDayAndTime(day, timeSlot)
                    return (
                      <td key={day} className="p-2 sm:p-3">
                        <div className="space-y-1 sm:space-y-2 min-h-10 sm:min-h-[60px]">
                          {sessions.map(session => (
                            <div
                              key={session.id}
                              className={`text-xs px-1.5 py-1 rounded border ${getGoalColor(session.goal_id)} group relative`}
                            >
                              <div className="truncate text-[10px] sm:text-xs">
                                {getGoalTitle(session.goal_id)}
                              </div>
                              <div className="text-[10px] opacity-75">
                                {session.duration} min
                              </div>
                              <button
                                onClick={() => onDeleteSession(session.id)}
                                className="absolute -top-1 -right-1 bg-rose-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Delete session"
                              >
                                <X size={10} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Study Sessions dengan fitur hapus */}
      <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl p-3 sm:p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Sessions</h3>
        <div className="space-y-2 sm:space-y-3">
          {studySessions.slice(0, 5).map(session => ( // Show fewer on mobile
            <div key={session.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg group">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${getGoalColor(session.goal_id).split(' ')[0]}`}></div>
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-gray-900 dark:text-white text-sm truncate">
                    {getGoalTitle(session.goal_id)}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    {new Date(session.session_date).toLocaleDateString()} • {session.duration} min
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {session.notes && (
                  <div className="text-xs text-gray-600 dark:text-gray-400 max-w-20 sm:max-w-xs truncate hidden sm:block">
                    {session.notes}
                  </div>
                )}
                <button
                  onClick={() => onDeleteSession(session.id)}
                  className="p-1 text-gray-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Delete session"
                >
                  <Trash2 size={14} className="sm:w-4 sm:h-4" />
                </button>
              </div>
            </div>
          ))}
          {studySessions.length === 0 && (
            <div className="text-center py-6 sm:py-8 text-gray-500 dark:text-gray-400">
              <BookOpen className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 opacity-50" />
              <p className="text-sm">No study sessions recorded yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Progress Stats Component
const ProgressStats = ({ goals, studySessions }) => {
  // Calculate total study time
  const totalStudyTime = studySessions.reduce((total, session) => total + session.duration, 0)
  const totalStudyHours = Math.floor(totalStudyTime / 60)
  const totalStudyMinutes = totalStudyTime % 60

  // Calculate study time by goal
  const studyTimeByGoal = goals.map(goal => {
    const goalSessions = studySessions.filter(session => session.goal_id.toString() === goal.id.toString())
    const totalTime = goalSessions.reduce((total, session) => total + session.duration, 0)
    return {
      goal,
      totalTime,
      sessionCount: goalSessions.length
    }
  }).sort((a, b) => b.totalTime - a.totalTime)

  // Calculate weekly progress
  const oneWeekAgo = new Date()
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
  const recentSessions = studySessions.filter(session => 
    new Date(session.session_date) >= oneWeekAgo
  )
  const weeklyStudyTime = recentSessions.reduce((total, session) => total + session.duration, 0)

  // Most productive day
  const sessionsByDay = studySessions.reduce((acc, session) => {
    const day = new Date(session.session_date).toLocaleDateString('en-US', { weekday: 'long' })
    acc[day] = (acc[day] || 0) + session.duration
    return acc
  }, {})
  const mostProductiveDay = Object.entries(sessionsByDay).sort((a, b) => b[1] - a[1])[0]

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl p-3 sm:p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
            <div className="p-1.5 sm:p-2 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <div className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">
                {totalStudyHours}h {totalStudyMinutes}m
              </div>
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Total Study</div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl p-3 sm:p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
            <div className="p-1.5 sm:p-2 bg-emerald-100 dark:bg-emerald-900 rounded-lg">
              <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <div className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">
                {studySessions.length}
              </div>
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Sessions</div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl p-3 sm:p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
            <div className="p-1.5 sm:p-2 bg-amber-100 dark:bg-amber-900 rounded-lg">
              <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <div className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">
                {Math.floor(weeklyStudyTime / 60)}h
              </div>
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">This Week</div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl p-3 sm:p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
            <div className="p-1.5 sm:p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <Award className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <div className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">
                {mostProductiveDay ? mostProductiveDay[0].substring(0, 3) : 'N/A'}
              </div>
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Most Active</div>
            </div>
          </div>
        </div>
      </div>

      {/* Study Time by Goal */}
      <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl p-3 sm:p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Study by Goal</h3>
        <div className="space-y-3 sm:space-y-4">
          {studyTimeByGoal.map(({ goal, totalTime, sessionCount }) => {
            const hours = Math.floor(totalTime / 60)
            const minutes = totalTime % 60
            const percentage = totalStudyTime > 0 ? Math.round((totalTime / totalStudyTime) * 100) : 0

            return (
              <div key={goal.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                  <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-${goal.color}-500`}></div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 dark:text-white text-sm sm:text-base truncate">{goal.title}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {sessionCount} sessions
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-2">
                  <div className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">
                    {hours}h {minutes}m
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">{percentage}%</div>
                </div>
              </div>
            )
          })}
          {studyTimeByGoal.length === 0 && (
            <div className="text-center py-6 sm:py-8 text-gray-500 dark:text-gray-400">
              <BarChart3 className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 opacity-50" />
              <p className="text-sm">No study data available yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Weekly Progress */}
      <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl p-3 sm:p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Weekly Progress</h3>
        <div className="space-y-3 sm:space-y-4">
          {goals.map(goal => {
            const weeklyTarget = goal.target_hours_per_week * 60 // Convert to minutes
            const weeklyProgress = recentSessions
              .filter(session => session.goal_id.toString() === goal.id.toString())
              .reduce((total, session) => total + session.duration, 0)
            
            const progressPercentage = weeklyTarget > 0 ? Math.min(Math.round((weeklyProgress / weeklyTarget) * 100), 100) : 0

            return (
              <div key={goal.id} className="space-y-1 sm:space-y-2">
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="font-medium text-gray-900 dark:text-white truncate flex-1 pr-2">{goal.title}</span>
                  <span className="text-gray-600 dark:text-gray-400 shrink-0">
                    {Math.floor(weeklyProgress / 60)}h/{goal.target_hours_per_week}h
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 sm:h-2">
                  <div 
                    className={`h-1.5 sm:h-2 rounded-full bg-linear-to-r from-${goal.color}-500 to-${goal.color}-600 transition-all duration-1000`}
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// Auth Component
const Auth = () => {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)

  const handleAuth = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        })
        if (error) throw error
        alert('Check your email for the verification link!')
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
        alert('Login successful!')
      }
    } catch (error) {
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-3 sm:p-6 rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
      <h2 className="text-lg sm:text-xl font-bold mb-4 text-gray-900 dark:text-white">
        {isSignUp ? 'Sign Up' : 'Login'}
      </h2>
      <form onSubmit={handleAuth} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white text-sm sm:text-base"
            placeholder="your@email.com"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white text-sm sm:text-base"
            placeholder="Your password"
            required
            minLength="6"
          />
        </div>
        <div className="flex gap-2 sm:gap-3">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-3 sm:px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors text-sm sm:text-base"
          >
            {loading ? 'Loading...' : (isSignUp ? 'Sign Up' : 'Login')}
          </button>
        </div>
        <div className="text-center">
          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 text-xs sm:text-sm"
          >
            {isSignUp ? 'Already have an account? Login' : "Don't have an account? Sign Up"}
          </button>
        </div>
      </form>
    </div>
  )
}

export default function LearningPage() {
  const [activeView, setActiveView] = useState('goals')
  const [sessionTimer, setSessionTimer] = useState(null)
  const [timeElapsed, setTimeElapsed] = useState(0)
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingGoal, setEditingGoal] = useState(null)
  const [goals, setGoals] = useState([])
  const [studySessions, setStudySessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [showAuth, setShowAuth] = useState(false)

  const navigate = useNavigate()

  useEffect(() => { 
    checkUser()
  }, [])

  const checkUser = async () => {
    if (isSupabaseConfigured && supabase?.auth) {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user || null)
      
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          setUser(session?.user || null)
          if (event === 'SIGNED_IN') {
            setShowAuth(false)
            await loadGoals()
            await loadStudySessions()
          }
        }
      )

      return () => subscription.unsubscribe()
    }
  }

  const loadGoals = async () => {
    setLoading(true);
    try {
      if (isSupabaseConfigured && user) {
        const { data, error } = await supabase
          .from('learning_goals')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (error) throw error;
        setGoals(data || []);
      } else {
        const savedGoals = localStorage.getItem('learning_goals')
        setGoals(savedGoals ? JSON.parse(savedGoals) : mockLearningData.goals)
      }
    } catch (err) {
      console.error('Error loading goals:', err);
      const savedGoals = localStorage.getItem('learning_goals')
      setGoals(savedGoals ? JSON.parse(savedGoals) : mockLearningData.goals)
    } finally {
      setLoading(false);
    }
  };

  const loadStudySessions = async () => {
    try {
      if (isSupabaseConfigured && user) {
        const { data, error } = await supabase
          .from('study_sessions')
          .select('*')
          .eq('user_id', user.id)
          .order('session_date', { ascending: false })

        if (error) throw error;
        setStudySessions(data || []);
      } else {
        const savedSessions = localStorage.getItem('study_sessions')
        setStudySessions(savedSessions ? JSON.parse(savedSessions) : mockLearningData.study_sessions)
      }
    } catch (err) {
      console.error('Error loading study sessions:', err);
      const savedSessions = localStorage.getItem('study_sessions')
      setStudySessions(savedSessions ? JSON.parse(savedSessions) : mockLearningData.study_sessions)
    }
  };

  // Reload data when user changes
  useEffect(() => {
    if (user !== null) {
      loadGoals()
      loadStudySessions()
    }
  }, [user])

  const createGoal = async (goalData) => {
    try {
      if (isSupabaseConfigured && user) {
        const payload = {
          user_id: user.id,
          title: goalData.title,
          description: goalData.description || null,
          target_hours_per_week: goalData.target_hours_per_week || null,
          color: goalData.color,
          current_progress: 0
        };

        const { data, error } = await supabase
          .from('learning_goals')
          .insert([payload])
          .select()
          .single();

        if (error) throw error;
        
        setGoals(prev => [data, ...prev]);
        return data;
      } else {
        const fakeGoal = { 
          ...goalData, 
          id: Date.now().toString(),
          user_id: 'demo-user',
          current_progress: 0,
          created_at: new Date().toISOString(),
          _localOnly: true 
        };
        
        const newGoals = [fakeGoal, ...goals]
        setGoals(newGoals)
        localStorage.setItem('learning_goals', JSON.stringify(newGoals))
        
        return fakeGoal;
      }

    } catch (err) {
      console.error('Error creating goal:', err);
      alert('Failed to create goal. Please try again.');
      
      const fakeGoal = { 
        ...goalData, 
        id: Date.now().toString(),
        current_progress: 0,
        created_at: new Date().toISOString(),
        _localOnly: true 
      };
      setGoals(prev => [fakeGoal, ...prev]);
      return fakeGoal;
    }
  };

  const updateGoal = async (goalId, goalData) => {
    try {
      if (isSupabaseConfigured && user) {
        const { data, error } = await supabase
          .from('learning_goals')
          .update({
            title: goalData.title,
            description: goalData.description,
            target_hours_per_week: goalData.target_hours_per_week,
            color: goalData.color
          })
          .eq('id', goalId)
          .eq('user_id', user.id)
          .select()
          .single();

        if (error) throw error;

        setGoals(prev => prev.map(g => g.id === goalId ? data : g));
        return data;
      } else {
        const updatedGoal = {
          ...goals.find(g => g.id.toString() === goalId.toString()),
          ...goalData
        };

        const newGoals = goals.map(g => g.id.toString() === goalId.toString() ? updatedGoal : g);
        setGoals(newGoals);
        localStorage.setItem('learning_goals', JSON.stringify(newGoals));
        
        return updatedGoal;
      }
    } catch (err) {
      console.error('Error updating goal:', err);
      alert('Failed to update goal. Please try again.');
    }
  };

  const deleteGoal = async (goalId) => {
    if (!confirm('Are you sure you want to delete this goal and all its study sessions?')) return;
    
    try {
      if (isSupabaseConfigured && user) {
        // Hapus study sessions terkait dulu
        await supabase
          .from('study_sessions')
          .delete()
          .eq('goal_id', goalId)
          .eq('user_id', user.id);

        // Hapus goal
        const { error } = await supabase
          .from('learning_goals')
          .delete()
          .eq('id', goalId)
          .eq('user_id', user.id);

        if (error) throw error;
      }
      
      // Hapus dari state
      const newGoals = goals.filter(g => g.id.toString() !== goalId.toString())
      setGoals(newGoals)
      
      // Hapus study sessions terkait dari state
      const newSessions = studySessions.filter(s => s.goal_id.toString() !== goalId.toString())
      setStudySessions(newSessions)
      
      // Update localStorage jika demo mode
      if (!user) {
        localStorage.setItem('learning_goals', JSON.stringify(newGoals))
        localStorage.setItem('study_sessions', JSON.stringify(newSessions))
      }

    } catch (err) {
      console.error('Error deleting goal:', err);
      alert('Failed to delete goal. Please try again.');
    }
  };

  const deleteStudySession = async (sessionId) => {
    if (!confirm('Are you sure you want to delete this study session?')) return;
    
    try {
      if (isSupabaseConfigured && user) {
        const { error } = await supabase
          .from('study_sessions')
          .delete()
          .eq('id', sessionId)
          .eq('user_id', user.id);

        if (error) throw error;
      }
      
      const newSessions = studySessions.filter(s => s.id.toString() !== sessionId.toString())
      setStudySessions(newSessions)
      
      if (!user) {
        localStorage.setItem('study_sessions', JSON.stringify(newSessions))
      }
    } catch (err) {
      console.error('Error deleting study session:', err);
      alert('Failed to delete study session. Please try again.');
    }
  };

  const handleEditGoal = (goal) => {
    setEditingGoal(goal)
    setIsModalOpen(true)
  }

  const handleSaveGoal = async (goalData) => {
    if (editingGoal) {
      await updateGoal(editingGoal.id, goalData)
    } else {
      await createGoal(goalData)
    }
    setEditingGoal(null)
  }

  const startTimer = (goalId) => { 
    // Jika session sudah aktif tapi timer tidak berjalan, berarti resume
    if (sessionTimer === goalId && !isTimerRunning) {
      setIsTimerRunning(true);
    } else {
      // Jika session berbeda atau belum ada session, mulai baru
      setSessionTimer(goalId);
      setIsTimerRunning(true);
      setTimeElapsed(0);
    }
  }

  const stopTimer = () => { 
    setIsTimerRunning(false);
  }

  const completeSession = async () => {
    if (sessionTimer && timeElapsed > 0) {
      try {
        const goal = goals.find(g => g.id.toString() === sessionTimer.toString());
        if (goal) {
          const minutesStudied = Math.floor(timeElapsed / 60);
          const newProgress = (goal.current_progress || 0) + minutesStudied;
          
          // Update goal progress
          if (isSupabaseConfigured && user) {
            const { error } = await supabase
              .from('learning_goals')
              .update({ current_progress: newProgress })
              .eq('id', sessionTimer)
              .eq('user_id', user.id);

            if (error) throw error;
          }

          // Create study session record
          const sessionData = {
            goal_id: sessionTimer,
            duration: minutesStudied,
            notes: `Completed ${minutesStudied} minutes of study`,
            session_date: new Date().toISOString()
          }

          if (isSupabaseConfigured && user) {
            const { data, error } = await supabase
              .from('study_sessions')
              .insert([{ ...sessionData, user_id: user.id }])
              .select()
              .single();

            if (error) throw error;
            setStudySessions(prev => [data, ...prev]);
          } else {
            const fakeSession = {
              ...sessionData,
              id: Date.now().toString(),
              user_id: 'demo-user',
              created_at: new Date().toISOString(),
              _localOnly: true
            };
            const newSessions = [fakeSession, ...studySessions];
            setStudySessions(newSessions);
            localStorage.setItem('study_sessions', JSON.stringify(newSessions));
          }

          // Update local goal state
          setGoals(prev => prev.map(g => 
            g.id.toString() === sessionTimer.toString()
              ? { ...g, current_progress: newProgress }
              : g
          ));

          // Update localStorage if in demo mode
          if (!user) {
            const updatedGoals = goals.map(g => 
              g.id.toString() === sessionTimer.toString()
                ? { ...g, current_progress: newProgress }
                : g
            );
            localStorage.setItem('learning_goals', JSON.stringify(updatedGoals));
          }

          alert(`Great! You studied for ${minutesStudied} minutes. Progress updated!`);
        }
      } catch (err) {
        console.error('Error completing session:', err);
        alert('Error updating progress, but session was completed.');
      }
    }

    // Reset semua state timer
    setSessionTimer(null); 
    setIsTimerRunning(false); 
    setTimeElapsed(0);
  }

  // Timer effect
  useEffect(() => {
    let interval
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimeElapsed(prev => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isTimerRunning])

  const formatTime = (seconds) => { 
    const mins = Math.floor(seconds / 60); 
    const secs = seconds % 60; 
    return `${mins.toString().padStart(2,'0')}:${secs.toString().padStart(2,'0')}` 
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-indigo-600 mx-auto mb-3 sm:mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">Loading goals...</p>
      </div>
    </div>
  )

  const views = [
    { id: 'goals', label: 'Goals', icon: Target },
    { id: 'schedule', label: 'Schedule', icon: Calendar },
    { id: 'progress', label: 'Progress', icon: TrendingUp }
  ]

  return (
    <div className="min-h-screen bg-transparent sm:bg-gray-50 dark:bg-gray-900 p-3 sm:p-4 md:p-6">
      <div className="max-w-5xl mx-auto w-full">
      {/* Auth Modal */}
      {showAuth && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
          <div className="bg-gray-50 dark:bg-gray-900 sm:bg-white dark:sm:bg-gray-800 rounded-t-2xl sm:rounded-2xl p-3 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            {/* Swipe indicator for mobile */}
            <div className="sm:hidden flex justify-center mb-2">
              <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
            </div>
            
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">Login Required</h2>
              <button onClick={() => setShowAuth(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <X size={20} className="text-white" />
              </button>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm sm:text-base">
              Please login to save your goals permanently to the cloud.
            </p>
            <Auth />
          </div>
        </div>
      )}

      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-7">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Learning Planner
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base mb-4">
              Track your learning goals and monitor progress
            </p>
            {!user && isSupabaseConfigured && (
              <p className="text-amber-600 dark:text-amber-400 text-xs sm:text-sm mt-1">
                Demo mode - <button 
                  onClick={() => setShowAuth(true)} 
                  className="underline hover:text-amber-700"
                >
                  Login to save permanently
                </button>
              </p>
            )}
            {!user && isSupabaseConfigured && (
              <button 
                onClick={() => setShowAuth(true)}
                className="bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
              >
                Login
              </button>
            )}
            <button 
              onClick={() => {
                setEditingGoal(null)
                setIsModalOpen(true)
              }} 
              className="bg-linear-to-r from-indigo-500 to-purple-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:shadow-lg transition-all duration-300 flex items-center gap-2"
            >
              <Plus size={18} /> 
              <span className="hidden sm:inline">New Goal</span>
              <span className="sm:hidden">Goal</span>
            </button>
          </div>
        </div>

        <div className="flex gap-1 overflow-x-auto pb-2 -mx-2 px-2">
          {views.map(view => {
            const Icon = view.icon
            return (
              <button 
                key={view.id} 
                onClick={() => setActiveView(view.id)} 
                className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-300 flex items-center gap-2 min-w-max ${
                  activeView === view.id 
                    ? 'bg-indigo-500 text-white shadow-md' 
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <Icon size={16} />
                <span>{view.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {sessionTimer && (
        <div className={`rounded-xl sm:rounded-2xl p-4 mb-4 sm:mb-6 shadow-lg ${
          isTimerRunning 
            ? 'bg-linear-to-r from-amber-500 to-orange-600 text-white' 
            : 'bg-linear-to-r from-gray-500 to-gray-600 text-white'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <Clock size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-base truncate">
                  {isTimerRunning ? 'Active Study' : 'Paused'}
                </h3>
                <p className="opacity-90 text-sm truncate">
                  {goals.find(g => g.id.toString() === sessionTimer.toString())?.title}
                </p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-xl font-bold">{formatTime(timeElapsed)}</div>
              <div className="opacity-90 text-xs">
                {isTimerRunning ? 'Time elapsed' : 'Paused'}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeView === 'goals' && (
        <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {goals.map(goal => (
            <GoalCard 
              key={goal.id} 
              goal={goal} 
              sessionTimer={sessionTimer} 
              timeElapsed={timeElapsed} 
              isTimerRunning={isTimerRunning}
              onStartTimer={startTimer} 
              onStopTimer={stopTimer} 
              onCompleteSession={completeSession} 
              onEditGoal={handleEditGoal}
              onDeleteGoal={deleteGoal}
              onOpen={() => navigate(`/learning/${goal.id}`)}
            />
          ))}
        </div>
      )}

      {activeView === 'schedule' && (
        <StudySchedule 
          goals={goals} 
          studySessions={studySessions} 
          onDeleteSession={deleteStudySession}
        />
      )}

      {activeView === 'progress' && (
        <ProgressStats goals={goals} studySessions={studySessions} />
      )}

      {activeView === 'goals' && goals.length === 0 && (
        <div className="text-center py-8 sm:py-12">
          <div className="w-16 h-16 sm:w-24 sm:h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
            <Target size={24} className="sm:w-10 sm:h-10 text-gray-400" />
          </div>
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2">No learning goals yet</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4 sm:mb-6 text-sm sm:text-base">Start your learning journey by creating your first goal.</p>
          <button 
            onClick={() => {
              setEditingGoal(null)
              setIsModalOpen(true)
            }} 
            className="bg-linear-to-r from-indigo-500 to-purple-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:shadow-lg transition-all duration-300 flex items-center gap-2 mx-auto"
          >
            <Plus size={18} /> Create Your First Goal
          </button>
        </div>
      )}

      <GoalModal 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false)
          setEditingGoal(null)
        }} 
        onSave={handleSaveGoal} 
        goal={editingGoal}
        isEditing={!!editingGoal}
      />
      </div>
    </div>
  )
}