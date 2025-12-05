import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Target, 
  Clock, 
  Calendar, 
  TrendingUp, 
  Play, 
  Pause, 
  Square,
  BarChart3,
  Save,
  X,
  CheckCircle,
  Flame
} from 'lucide-react'

// Service untuk fetch data dari database
import goalService from '../services/goalService'
import sessionService from '../services/sessionService'

const ACTIVE_SESSION_KEY = (goalId) => `active_session_${goalId}`


export default function GoalDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [goal, setGoal] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editedGoal, setEditedGoal] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [sessionTimer, setSessionTimer] = useState(null)
  const [timeElapsed, setTimeElapsed] = useState(0)
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [sessions, setSessions] = useState([])
  

  // Fetch goal data dari database
  useEffect(() => {
    const fetchGoalData = async () => {
      try {
        setLoading(true)
        const goalData = await goalService.getById(id)
        setGoal(goalData)
        setEditedGoal(goalData)

        // Fetch study sessions untuk goal ini
        const sessionsData = await sessionService.getByGoalId(id)
        setSessions(sessionsData)
        // restore active session state if present
        try {
          const storedRaw = localStorage.getItem(ACTIVE_SESSION_KEY(id))
          if (storedRaw) {
            const stored = JSON.parse(storedRaw)
            let elapsed = stored.elapsed || 0
            if (stored.isRunning && stored.startAt) {
              elapsed = (stored.elapsed || 0) + Math.floor((Date.now() - stored.startAt) / 1000)
            }
            setTimeElapsed(elapsed)
            setSessionTimer(id)
            setIsTimerRunning(!!stored.isRunning)
          }
        } catch {
          /* ignore */
        }
      } catch (err) {
        setError('Failed to load goal details')
        console.error('Error fetching goal:', err)
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchGoalData()
    }
  }, [id])

  // Timer effect: tick when running
  useEffect(() => {
    let interval
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimeElapsed(prev => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isTimerRunning])

  // Persist active session to localStorage whenever timer state or elapsed changes
  useEffect(() => {
    if (!sessionTimer) return
    try {
      const key = ACTIVE_SESSION_KEY(sessionTimer)
      const stored = JSON.parse(localStorage.getItem(key)) || {}
      stored.elapsed = timeElapsed
      stored.isRunning = isTimerRunning
      // keep startAt if running, set when starting
      if (isTimerRunning && !stored.startAt) stored.startAt = Date.now()
      if (!isTimerRunning) stored.startAt = null
      localStorage.setItem(key, JSON.stringify(stored))
    } catch {
      // ignore
    }
  }, [sessionTimer, timeElapsed, isTimerRunning])

  // Handler functions
  const handleSave = async () => {
    try {
      const updatedGoal = await goalService.update(id, editedGoal)
      setGoal(updatedGoal)
      setIsEditing(false)
    } catch (err) {
      setError('Failed to update goal')
      console.error('Error updating goal:', err)
    }
  }

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this goal? All progress will be lost.')) {
      try {
        await goalService.delete(id)
        navigate('/learning')
      } catch (err) {
        setError('Failed to delete goal')
        console.error('Error deleting goal:', err)
      }
    }
  }

  const startTimer = () => {
    // Resume from persisted active session if exists
    const key = ACTIVE_SESSION_KEY(id)
    const storedRaw = localStorage.getItem(key)
    if (storedRaw) {
      try {
        const stored = JSON.parse(storedRaw)
        // if it was running, compute elapsed until now
        let elapsed = stored.elapsed || 0
        if (stored.isRunning && stored.startAt) {
          const since = Math.floor((Date.now() - stored.startAt) / 1000)
          elapsed = (stored.elapsed || 0) + since
        }
        setTimeElapsed(elapsed)
        setSessionTimer(id)
        setIsTimerRunning(true)
        // update startAt
        localStorage.setItem(key, JSON.stringify({ startAt: Date.now(), elapsed, isRunning: true }))
        return
      } catch {
        // fallthrough to create new
      }
    }

    // create new active session
    setSessionTimer(id)
    setIsTimerRunning(true)
    setTimeElapsed(0)
    localStorage.setItem(key, JSON.stringify({ startAt: Date.now(), elapsed: 0, isRunning: true }))
  }

  const stopTimer = () => {
    setIsTimerRunning(false)
  }

  const completeSession = async () => {
    // Create session and update progress with robust error handling
    const durationMinutes = Math.max(1, Math.round(timeElapsed / 60))
    const nowIso = new Date().toISOString()

    const sessionData = {
      goalId: id,
      duration: durationMinutes,
      efficiency: calculateEfficiency(),
      notes: null,
      session_date: nowIso
    }

    let newSession = null
    try {
      newSession = await sessionService.create(sessionData)
      if (!newSession) throw new Error('Session service returned no session')
      setSessions(prev => [newSession, ...prev])
    } catch (err) {
      console.error('Failed to create session:', err)
      setError('Failed to create session: ' + (err.message || err))
      // don't return yet — try to continue with progress update if possible
    }

    try {
      const updatedGoal = await goalService.updateProgress(id, durationMinutes)
      if (updatedGoal) {
        setGoal(updatedGoal)
        setEditedGoal(updatedGoal)
      } else {
        // fallback: refetch goal
        try {
          const refetched = await goalService.getById(id)
          setGoal(refetched)
          setEditedGoal(refetched)
        } catch (rfErr) {
          console.error('Failed to refetch goal after progress update:', rfErr)
        }
      }

      // Reset timer and clear persisted active session
      const key = ACTIVE_SESSION_KEY(id)
      localStorage.removeItem(key)
      setSessionTimer(null)
      setIsTimerRunning(false)
      setTimeElapsed(0)
    } catch (err) {
      console.error('Failed to update goal progress:', err)
      setError('Failed to update goal progress: ' + (err.message || err))
    }
  }

  const closeSession = () => {
    const key = ACTIVE_SESSION_KEY(id)
    localStorage.removeItem(key)
    setSessionTimer(null)
    setIsTimerRunning(false)
    setTimeElapsed(0)
  }

  // Add resource feature removed per request; resource list is read-only

  const calculateEfficiency = () => {
    // Simple efficiency calculation - can be enhanced with focus metrics
    return Math.min(100, 80 + Math.random() * 20)
  }

  const computeStreak = (sessionsList) => {
    const daysSet = new Set(sessionsList.map(s => {
      const d = new Date(s.date || s.session_date || s.created_at || s.sessionDate || Date.now())
      return d.toISOString().slice(0,10)
    }))
    let streak = 0
    const d = new Date()
    while (true) {
      const key = d.toISOString().slice(0,10)
      if (daysSet.has(key)) {
        streak++
        d.setDate(d.getDate() - 1)
      } else break
    }
    return streak
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getProgressColor = (progress) => {
    if (progress >= 80) return 'text-emerald-500'
    if (progress >= 50) return 'text-amber-500'
    return 'text-rose-500'
  }

  const getCategoryColor = (category) => {
    const colors = {
      Programming: 'from-blue-500 to-cyan-600',
      Language: 'from-emerald-500 to-teal-600',
      'Computer Science': 'from-purple-500 to-indigo-600',
      Music: 'from-rose-500 to-pink-600',
      Design: 'from-amber-500 to-orange-600',
      Business: 'from-indigo-500 to-purple-600'
    }
    return colors[category] || 'from-gray-500 to-gray-600'
  }

  const ProgressRing = ({ progress, size = 120 }) => {
    const strokeWidth = 8
    const radius = (size - strokeWidth) / 2
    const circumference = radius * 2 * Math.PI
    const strokeDashoffset = circumference - (progress / 100) * circumference

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
            className={`transition-all duration-1000 ease-out ${getProgressColor(progress)}`}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <span className={`text-2xl font-bold ${getProgressColor(progress)}`}>
              {progress}%
            </span>
          </div>
        </div>
      </div>
    )
  }

  const SessionCard = ({ session }) => {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="font-medium text-gray-900 dark:text-white">
              {session.duration} minutes
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              session.efficiency >= 80 ? 'bg-emerald-500' : 
              session.efficiency >= 60 ? 'bg-amber-500' : 'bg-rose-500'
            }`} />
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {session.efficiency}% efficiency
            </span>
          </div>
        </div>
        {session.notes && (
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
            {session.notes}
          </p>
        )}
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {new Date(session.session_date || session.date || session.created_at || Date.now()).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
          })}
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent sm:bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading goal details...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-transparent sm:bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <button
            onClick={() => navigate('/learning')}
            className="bg-indigo-500 text-white px-6 py-2 rounded-lg hover:bg-indigo-600 transition-colors"
          >
            Back to Learning
          </button>
        </div>
      </div>
    )
  }

  if (!goal) {
    return (
      <div className="min-h-screen bg-transparent sm:bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">Goal not found</p>
          <button
            onClick={() => navigate('/learning')}
            className="bg-indigo-500 text-white px-6 py-2 rounded-lg hover:bg-indigo-600 transition-colors"
          >
            Back to Learning
          </button>
        </div>
      </div>
    )
  }

  const totalStudyHours = sessions.reduce((total, session) => total + session.duration, 0) / 60
  const averageEfficiency = sessions.length > 0 
    ? sessions.reduce((total, session) => total + session.efficiency, 0) / sessions.length 
    : 0

  const targetHours = goal.target_hours_per_week || goal.targetHours || goal.weeklyTarget || 0
  const targetMinutes = targetHours * 60
  const currentProgressMinutes = goal.current_progress || 0
  const progressPercent = targetMinutes > 0 ? Math.min(Math.round((currentProgressMinutes / targetMinutes) * 100), 100) : 0
  const streak = computeStreak(sessions)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Active Session Banner */}
      {sessionTimer && (
        <div className="bg-linear-to-r from-amber-500 to-orange-600 text-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Active Study Session</h3>
                  <p className="text-amber-100">{goal.title}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">{formatTime(timeElapsed)}</div>
                <div className="text-amber-100 text-sm">Time elapsed</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/learning')}
                className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="font-medium">Back to Learning</span>
              </button>
            </div>

            <div className="flex items-center gap-3">
              {!isEditing ? (
                <>
                  {!sessionTimer && (
                    <button
                      onClick={startTimer}
                      className="flex items-center gap-1 sm:gap-2 px-3 py-1 sm:px-4 sm:py-2 bg-emerald-500 text-white rounded-md sm:rounded-lg hover:bg-emerald-600 transition-colors text-sm sm:text-base"
                    >
                      <Play className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="hidden sm:inline">Start Session</span>
                    </button>
                  )}
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-1 sm:gap-2 px-3 py-1 sm:px-4 sm:py-2 bg-indigo-500 text-white rounded-md sm:rounded-lg hover:bg-indigo-600 transition-colors text-sm sm:text-base"
                  >
                    <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Edit Goal</span>
                  </button>
                  <button
                    onClick={handleDelete}
                    className="flex items-center gap-1 sm:gap-2 px-3 py-1 sm:px-4 sm:py-2 bg-rose-500 text-white rounded-md sm:rounded-lg hover:bg-rose-600 transition-colors text-sm sm:text-base"
                  >
                    <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Delete</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    <X className="w-4 h-4 " />
                    <span className="hidden sm:inline">Cancel</span>
                  </button>
                  <button
                    onClick={handleSave}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    <span className="hidden sm:inline">Save Changes</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-8">
          {/* Left Column - Goal Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Goal Header */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-3 sm:p-6 shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  {isEditing ? (
                    <div className="space-y-4">
                      <input
                        type="text"
                        value={editedGoal.title}
                        onChange={(e) => setEditedGoal(prev => ({ ...prev, title: e.target.value }))}
                        className="w-full text-2xl font-bold bg-transparent border-b border-gray-200 dark:border-gray-600 pb-2 focus:outline-none focus:border-indigo-500 text-gray-900 dark:text-white"
                      />
                      <textarea
                        value={editedGoal.description}
                        onChange={(e) => setEditedGoal(prev => ({ ...prev, description: e.target.value }))}
                        rows={3}
                        className="w-full bg-transparent border border-gray-200 dark:border-gray-600 rounded-lg p-3 focus:outline-none focus:border-indigo-500 text-gray-600 dark:text-gray-400 resize-none"
                      />
                    </div>
                  ) : (
                    <>
                      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                        {goal.title}
                      </h1>
                      <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                        {goal.description}
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* Progress Section */}
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600 dark:text-gray-400">Overall Progress</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {totalStudyHours.toFixed(1)}h / {targetHours}h
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                    <div 
                      className={`h-3 rounded-full bg-linear-to-r ${getCategoryColor(goal.category)} transition-all duration-1000`}
                      style={{ width: `${progressPercent}%` }}
                    ></div>
                  </div>
                </div>
                <div className="ml-0 sm:ml-6">
                  <div className="hidden sm:block">
                    <ProgressRing progress={progressPercent} size={120} />
                  </div>
                  <div className="block sm:hidden">
                    <ProgressRing progress={progressPercent} size={72} />
                  </div>
                </div>
              </div>
            </div>

            {/* Session Timer */}
            {sessionTimer && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-3 sm:p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="text-center">
                  <div className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                    {formatTime(timeElapsed)}
                  </div>
                  <div className="flex gap-3 justify-center">
                    {isTimerRunning ? (
                        <button
                          onClick={stopTimer}
                          className="flex items-center gap-1 sm:gap-2 px-4 py-2 sm:px-6 sm:py-3 bg-amber-500 text-white rounded-md sm:rounded-lg hover:bg-amber-600 transition-colors text-sm sm:text-base"
                        >
                          <Pause className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span className="hidden sm:inline">Pause</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => setIsTimerRunning(true)}
                          className="flex items-center gap-1 sm:gap-2 px-4 py-2 sm:px-6 sm:py-3 bg-emerald-500 text-white rounded-md sm:rounded-lg hover:bg-emerald-600 transition-colors text-sm sm:text-base"
                        >
                          <Play className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span className="hidden sm:inline">Resume</span>
                        </button>
                      )}
                      <button
                        onClick={completeSession}
                        className="flex items-center gap-1 sm:gap-2 px-4 py-2 sm:px-6 sm:py-3 bg-indigo-500 text-white rounded-md sm:rounded-lg hover:bg-indigo-600 transition-colors text-sm sm:text-base"
                      >
                        <Square className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="hidden sm:inline">Complete Session</span>
                      </button>
                  </div>
                  {/* session notes removed */}
                </div>
              </div>
            )}

            {/* Tabs Navigation */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-1 shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="flex space-x-1">
                {[
                  { id: 'overview', label: 'Overview', icon: BarChart3 },
                  { id: 'sessions', label: 'Study Sessions', icon: Clock }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-300 flex-1 justify-center ${
                      activeTab === tab.id
                        ? 'bg-indigo-500 text-white shadow-md'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Statistics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-3 sm:p-4 text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                      {sessions.length}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Sessions</div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                      {totalStudyHours.toFixed(1)}h
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Total Time</div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                      {averageEfficiency.toFixed(0)}%
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Efficiency</div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                      {streak}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Day Streak</div>
                  </div>
                </div>

                {/* Skills & Milestones */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-3 sm:p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Skills & Milestones
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-3">Target Skills</h4>
                      <div className="space-y-2">
                        {goal.skills?.map((skill, index) => (
                          <div key={index} className="flex items-center gap-3">
                            <CheckCircle className="w-4 h-4 text-emerald-500" />
                            <span className="text-gray-600 dark:text-gray-400">{skill}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* Resources removed per request */}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'sessions' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Study Sessions ({sessions.length})
                </h3>
                {sessions.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {sessions.map((session) => (
                      <SessionCard key={session.id} session={session} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No study sessions yet</p>
                    <p className="text-sm">Start your first session to track progress</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Goal Metadata */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-3 sm:p-6 shadow-sm border border-gray-100 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Goal Details
              </h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Target className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Category</div>
                    <div className="text-gray-900 dark:text-white">{goal.category}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Flame className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Current Streak</div>
                    <div className="text-gray-900 dark:text-white">{streak} days</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Due Date</div>
                    <div className="text-gray-900 dark:text-white">
                      {goal.dueDate ? new Date(goal.dueDate).toLocaleDateString() : 'No due date'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <TrendingUp className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Weekly Target</div>
                    <div className="text-gray-900 dark:text-white">
                      {goal.weeklyTarget} sessions/week
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Quick Actions
              </h3>
              <div className="space-y-3">
                {!sessionTimer ? (
                  <button
                    onClick={startTimer}
                    className="w-full flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-emerald-500 text-white rounded-md sm:rounded-lg hover:bg-emerald-600 transition-colors text-sm sm:text-base"
                  >
                    <Play className="w-4 h-4 sm:w-5 sm:h-5" />
                    Start Study Session
                  </button>
                ) : (
                  <button
                    onClick={closeSession}
                    className="w-full flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-rose-500 text-white rounded-md sm:rounded-lg hover:bg-rose-600 transition-colors text-sm sm:text-base"
                  >
                    <X className="w-4 h-4 sm:w-5 sm:h-5" />
                    Close Session
                  </button>
                )}

                {/* Add Resource removed per request */}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Recent Activity
              </h3>
              <div className="space-y-3">
                {sessions.slice(0, 3).map((session) => (
                  <div key={session.id} className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                    <span className="text-gray-600 dark:text-gray-400">
                      Studied for {session.duration} minutes
                    </span>
                  </div>
                ))}
                {sessions.length === 0 && (
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    No recent activity
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Add Resource Modal */}
      {/* Add Resource modal removed */}
    </div>
  )
}