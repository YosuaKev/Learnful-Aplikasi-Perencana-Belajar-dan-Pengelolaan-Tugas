import { useState, useEffect } from 'react'
import { 
  Calendar, 
  Clock, 
  TrendingUp, 
  Target, 
  CheckCircle, 
  AlertCircle,
  Brain,
  BookOpen,
  Coffee,
  Activity,
  Plus,
  ChevronRight,
  Flame,
  Zap,
  BarChart3,
  PieChart,
  LineChart,
  Users,
  Award,
  CheckSquare,
  ListTodo,
  BookMarked,
  GraduationCap,
  Clock4,
  Star,
  TrendingDown,
  Eye
} from 'lucide-react'

// alias Target for places where a different name is convenient
const TargetIcon = Target
import { supabase } from '../services/supabaseClient.js'

// Import Chart.js
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Bar, Line, Doughnut } from 'react-chartjs-2'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
)

// Database service functions (module scope so identity is stable)
const dashboardService = {
  async getTasks(userId) {
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        categories:category_id (
          name,
          color
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  async getLearningGoals(userId) {
    const { data, error } = await supabase
      .from('learning_goals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  async getStudySessions(userId) {
    const { data, error } = await supabase
      .from('study_sessions')
      .select(`
        *,
        learning_goals:goal_id (
          title,
          color
        )
      `)
      .eq('user_id', userId)
      .order('session_date', { ascending: false })

    if (error) throw error
    return data || []
  },

  async updateTaskStatus(taskId, status) {
    const updateData = { status }
    if (status === 'done') {
      updateData.completed_at = new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', taskId)
      .select()
      .single()

    if (error) throw error
    return data
  }
}

// Reusable UI components
const ProgressRing = ({ progress, color = 'indigo', size = 80 }) => {
  const strokeWidth = 6
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const strokeDashoffset = circumference - (progress / 100) * circumference

  const colorClasses = {
    indigo: 'text-indigo-500',
    emerald: 'text-emerald-500',
    amber: 'text-amber-500',
    rose: 'text-rose-500',
    blue: 'text-blue-500',
    purple: 'text-purple-500'
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
          className={`transition-all duration-500 ease-out ${colorClasses[color]}`}
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

const StatCard = (props) => {
  const { icon: IconComponent, title, value, subtitle, trend, color = 'indigo' } = props
  const Icon = IconComponent || null

  const colorClasses = {
    indigo: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400',
    emerald: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400',
    amber: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
    rose: 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400'
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2 sm:p-3 rounded-xl ${colorClasses[color]}`}>
          {Icon ? <Icon className="w-5 h-5 sm:w-6 sm:h-6" /> : null}
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-sm ${
            trend > 0 ? 'text-emerald-600' : trend < 0 ? 'text-rose-600' : 'text-gray-500'
          }`}>
            <TrendingUp className={`w-4 h-4 ${trend < 0 ? 'rotate-180' : ''}`} />
            <span>{trend !== 0 ? `${Math.abs(trend)}%` : '0%'}</span>
          </div>
        )}
      </div>
      <div>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
          {value}
        </h3>
        <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
          {title}
        </p>
        {subtitle && (
          <p className="text-gray-500 dark:text-gray-500 text-xs mt-1">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  )
}

// Analytics Chart Component (Fixed)
const AnalyticsChart = ({ title, data, type = 'bar' }) => {
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#6B7280',
          usePointStyle: true,
        },
      },
      title: {
        display: false,
      },
    },
    scales: type !== 'doughnut' ? {
      x: {
        grid: {
          color: 'rgba(107, 114, 128, 0.1)',
        },
        ticks: {
          color: '#6B7280',
        },
      },
      y: {
        grid: {
          color: 'rgba(107, 114, 128, 0.1)',
        },
        ticks: {
          color: '#6B7280',
        },
      },
    } : {},
  }

  const getChartData = () => {
    switch (type) {
      case 'bar':
        return {
          labels: data.map(item => item.day || item.name || item.label),
          datasets: [
            {
              label: title.includes('Distribution') ? 'Study Hours' : 'Value',
              data: data.map(item => item.time || item.value || item.count || item.productivity),
              backgroundColor: 'rgba(99, 102, 241, 0.8)',
              borderColor: 'rgb(99, 102, 241)',
              borderWidth: 2,
              borderRadius: 6,
            },
          ],
        }
      
      case 'line':
        return {
          labels: data.map(item => item.day || item.label),
          datasets: [
            {
              label: 'Productivity Score',
              data: data.map(item => item.productivity || item.value),
              borderColor: 'rgb(16, 185, 129)',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              tension: 0.4,
              fill: true,
              pointBackgroundColor: 'rgb(16, 185, 129)',
              pointBorderColor: '#fff',
              pointBorderWidth: 2,
            },
          ],
        }
      
      case 'doughnut': {
        // Handle kedua jenis data: goal progress dan task completion
        const isGoalProgress = title.includes('Goal Progress')

        return {
          labels: data.map(item => item.name || item.status || item.label),
          datasets: [
            {
              data: data.map(item => item.progress || item.count || item.value),
              backgroundColor: isGoalProgress 
                ? [ // Warna untuk Goal Progress
                    'rgba(99, 102, 241, 0.8)',   // indigo
                    'rgba(139, 92, 246, 0.8)',   // purple
                    'rgba(14, 165, 233, 0.8)',   // blue
                    'rgba(16, 185, 129, 0.8)',   // emerald
                    'rgba(245, 158, 11, 0.8)',   // amber
                  ]
                : [ // Warna untuk Task Completion
                    'rgba(16, 185, 129, 0.8)',   // emerald (completed)
                    'rgba(14, 165, 233, 0.8)',   // blue (in progress)
                    'rgba(156, 163, 175, 0.8)',  // gray (todo)
                  ],
              borderColor: isGoalProgress
                ? [
                    'rgb(99, 102, 241)',
                    'rgb(139, 92, 246)',
                    'rgb(14, 165, 233)',
                    'rgb(16, 185, 129)',
                    'rgb(245, 158, 11)',
                  ]
                : [
                    'rgb(16, 185, 129)',
                    'rgb(14, 165, 233)',
                    'rgb(156, 163, 175)',
                  ],
              borderWidth: 2,
            },
          ],
        }
      }
      
      default:
        return {
          labels: [],
          datasets: [],
        }
    }
  }

  const renderChart = () => {
    const chartData = getChartData()

    switch (type) {
      case 'bar':
        return <Bar data={chartData} options={chartOptions} />
      
      case 'line':
        return <Line data={chartData} options={chartOptions} />
      
      case 'doughnut':
        return <Doughnut data={chartData} options={chartOptions} />
      
      default:
        return <Bar data={chartData} options={chartOptions} />
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
      <h3 className="font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>
      <div className="h-64">
        {data && data.length > 0 ? (
          renderChart()
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
            <div className="text-center">
              <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No data available</p>
            </div>
          </div>
        )}
      </div>
      {data && data.length > 0 && (
        <div className="mt-3 text-xs text-gray-500 dark:text-gray-400 text-center">
          Showing {data.length} {data.length === 1 ? 'item' : 'items'}
        </div>
      )}
    </div>
  )
}

// Tasks Components
const TaskItem = ({ task, onToggleComplete }) => {
  const priorityColors = {
    high: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
    medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    low: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
  }

  const statusColors = {
    todo: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
    in_progress: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    done: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
  }

  return (
    <div className="flex items-center gap-4 p-3 sm:p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all duration-300 group">
      <button 
        onClick={() => onToggleComplete(task.id, !task.completed)}
        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
          task.completed 
            ? 'bg-emerald-500 border-emerald-500 text-white' 
            : 'border-gray-300 dark:border-gray-600 hover:border-emerald-400'
        }`}
      >
        {task.completed && <CheckCircle className="w-3 h-3" />}
      </button>
      
      <div className="flex-1 min-w-0">
        <h4 className={`font-medium text-gray-900 dark:text-white truncate ${
          task.completed ? 'line-through text-gray-500' : ''
        }`}>
          {task.title}
        </h4>
        <div className="flex items-center gap-3 mt-1">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityColors[task.priority]}`}>
            {task.priority}
          </span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[task.status]}`}>
            {task.status.replace('_', ' ')}
          </span>
          {task.due_date && (
            <span className="text-gray-500 dark:text-gray-400 text-sm flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {new Date(task.due_date).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>

      {task.priority === 'high' && !task.completed && (
        <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
      )}
    </div>
  )
}

const TasksView = ({ tasks, onToggleTaskComplete, loading }) => {
  const [filter, setFilter] = useState('all')
  
  const filteredTasks = tasks.filter(task => {
    if (filter === 'all') return true
    if (filter === 'active') return !task.completed
    if (filter === 'completed') return task.completed
    return task.status === filter
  })

  const taskStats = {
    total: tasks.length,
    completed: tasks.filter(t => t.completed).length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    highPriority: tasks.filter(t => t.priority === 'high' && !t.completed).length
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-2xl"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Task Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={ListTodo}
          title="Total Tasks"
          value={taskStats.total}
          color="indigo"
        />
        <StatCard
          icon={CheckCircle}
          title="Completed"
          value={taskStats.completed}
          color="emerald"
        />
        <StatCard
          icon={Clock4}
          title="In Progress"
          value={taskStats.inProgress}
          color="amber"
        />
        <StatCard
          icon={AlertCircle}
          title="High Priority"
          value={taskStats.highPriority}
          color="rose"
        />
      </div>

      {/* Filter Buttons */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[
          { key: 'all', label: 'All Tasks', icon: ListTodo },
          { key: 'active', label: 'Active', icon: CheckSquare },
          { key: 'completed', label: 'Completed', icon: CheckCircle },
          { key: 'in_progress', label: 'In Progress', icon: Clock4 },
          { key: 'high', label: 'High Priority', icon: AlertCircle }
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg font-medium transition-all duration-300 whitespace-nowrap ${
              filter === key
                ? 'bg-indigo-500 text-white shadow-md'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Tasks List */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Your Tasks
          </h2>
          <button className="text-indigo-600 dark:text-indigo-400 text-sm font-medium flex items-center gap-1 hover:gap-2 transition-all">
            View All <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        
        <div className="space-y-3">
          {filteredTasks.length > 0 ? (
            filteredTasks.map(task => (
              <TaskItem 
                key={task.id} 
                task={task} 
                onToggleComplete={onToggleTaskComplete}
              />
            ))
          ) : (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <CheckSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No tasks found</p>
              <p>Create your first task or adjust your filters</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Learning Components
const LearningGoalCard = ({ goal }) => {
  const colorClasses = {
    indigo: 'from-indigo-500 to-purple-600',
    emerald: 'from-emerald-500 to-teal-600',
    amber: 'from-amber-500 to-orange-600',
    rose: 'from-rose-500 to-pink-600',
    purple: 'from-purple-500 to-indigo-600'
  }

  const currentHours = Math.floor((goal.current_progress || 0) / 60)
  const currentMinutes = (goal.current_progress || 0) % 60
  const targetHours = goal.target_hours_per_week || 0
  const progress = targetHours > 0 ? Math.min(Math.round(((goal.current_progress || 0) / (targetHours * 60)) * 100), 100) : 0

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all duration-300 group">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-xl bg-linear-to-r ${colorClasses[goal.color] || colorClasses.indigo} text-white`}>
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white text-lg">
              {goal.title}
            </h4>
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
              {goal.description || 'No description'}
            </p>
          </div>
        </div>
        <ProgressRing progress={progress} color={goal.color} size={60} />
      </div>
      
      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Progress</span>
          <span className="font-medium text-gray-900 dark:text-white">
            {currentHours}h {currentMinutes > 0 ? `${currentMinutes}m` : ''} / {targetHours}h
          </span>
        </div>
        
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div 
            className={`h-2 rounded-full bg-linear-to-r ${colorClasses[goal.color] || colorClasses.indigo} transition-all duration-500`}
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Sessions</div>
            <div className="font-bold text-gray-900 dark:text-white">
              {goal.session_count || 0}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Avg Time</div>
            <div className="font-bold text-gray-900 dark:text-white">
              {goal.avg_duration ? `${Math.round(goal.avg_duration)}m` : '0m'}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const LearningView = ({ learningGoals, studySessions, currentStreak, loading }) => {
  const [timeRange, setTimeRange] = useState('week')

  const learningStats = {
    totalGoals: learningGoals.length,
    activeGoals: learningGoals.filter(g => g.current_progress > 0).length,
    totalStudyTime: Math.round(studySessions.reduce((total, session) => total + session.duration, 0) / 60),
    completedSessions: studySessions.length
  }

  const recentSessions = studySessions.slice(0, 5)

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-2xl"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Learning Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          icon={TargetIcon}
          title="Learning Goals"
          value={learningStats.totalGoals}
          color="indigo"
        />
        <StatCard
          icon={TrendingUp}
          title="Active Goals"
          value={learningStats.activeGoals}
          color="emerald"
        />
        <StatCard
          icon={Clock}
          title="Total Study Hours"
          value={learningStats.totalStudyTime}
          color="amber"
        />
        <StatCard
          icon={BookOpen}
          title="Study Sessions"
          value={learningStats.completedSessions}
          color="purple"
        />
      </div>

      {/* Time Range Filter */}
      <div className="flex gap-2">
        {['week', 'month', 'all'].map(range => (
          <button
            key={range}
            onClick={() => setTimeRange(range)}
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
              timeRange === range
                ? 'bg-indigo-500 text-white shadow-md'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            {range.charAt(0).toUpperCase() + range.slice(1)}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Learning Goals */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Learning Goals
              </h2>
              <button className="text-indigo-600 dark:text-indigo-400 text-sm font-medium flex items-center gap-1 hover:gap-2 transition-all">
                View All <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-4">
              {learningGoals.length > 0 ? (
                learningGoals.map(goal => (
                  <LearningGoalCard key={goal.id} goal={goal} />
                ))
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <TargetIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">No learning goals yet</p>
                  <p>Start by creating your first learning goal</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Study Sessions */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
              Recent Study Sessions
            </h2>
            
            <div className="space-y-4">
              {recentSessions.length > 0 ? (
                recentSessions.map(session => (
                  <div key={session.id} className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                    <div className={`p-2 rounded-lg bg-${session.learning_goals?.color || 'indigo'}-100 dark:bg-${session.learning_goals?.color || 'indigo'}-900/30`}>
                      <BookOpen className={`w-5 h-5 text-${session.learning_goals?.color || 'indigo'}-600 dark:text-${session.learning_goals?.color || 'indigo'}-400`} />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {session.learning_goals?.title || 'Study Session'}
                      </h4>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-600 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {session.duration} minutes
                        </span>
                        <span>
                          {new Date(session.session_date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No study sessions recorded yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Study Streak - Now using actual streak data */}
          <div className="bg-linear-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">Study Streak</h3>
              <Flame className="w-6 h-6" />
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold mb-2">{currentStreak} days</div>
              <p className="text-indigo-100">
                {currentStreak === 0 
                  ? "Start your learning journey today! 📚" 
                  : currentStreak < 3 
                  ? "Keep building your streak! 💪" 
                  : currentStreak < 7 
                  ? "Great consistency! 🔥" 
                  : "You're on fire! Amazing work! 🚀"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Enhanced Goal Progress Chart Component
const GoalProgressChart = ({ goals }) => {
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(107, 114, 128, 0.1)',
        },
        ticks: {
          color: '#6B7280',
          callback: function(value) {
            return value + '%';
          }
        },
        max: 100,
      },
      y: {
        grid: {
          color: 'rgba(107, 114, 128, 0.1)',
        },
        ticks: {
          color: '#6B7280',
        },
      },
    },
  }

  const chartData = {
    labels: goals.map(goal => goal.title),
    datasets: [
      {
        label: 'Progress',
        data: goals.map(goal => {
          const progress = goal.target_hours_per_week ? 
            Math.min(Math.round(((goal.current_progress || 0) / (goal.target_hours_per_week * 60)) * 100), 100) : 0
          return progress
        }),
        backgroundColor: goals.map((_, index) => {
          const colors = [
            'rgba(99, 102, 241, 0.8)',
            'rgba(16, 185, 129, 0.8)',
            'rgba(245, 158, 11, 0.8)',
            'rgba(244, 63, 94, 0.8)',
            'rgba(139, 92, 246, 0.8)',
          ]
          return colors[index % colors.length]
        }),
        borderColor: goals.map((_, index) => {
          const colors = [
            'rgb(99, 102, 241)',
            'rgb(16, 185, 129)',
            'rgb(245, 158, 11)',
            'rgb(244, 63, 94)',
            'rgb(139, 92, 246)',
          ]
          return colors[index % colors.length]
        }),
        borderWidth: 2,
        borderRadius: 6,
      },
    ],
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
      <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Goal Progress Details</h3>
      <div className="h-80">
        {goals && goals.length > 0 ? (
          <Bar data={chartData} options={chartOptions} />
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
            <div className="text-center">
              <Target className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No learning goals available</p>
            </div>
          </div>
        )}
      </div>
      {goals && goals.length > 0 && (
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {goals.map((goal, index) => {
            const progress = goal.target_hours_per_week ? 
              Math.min(Math.round(((goal.current_progress || 0) / (goal.target_hours_per_week * 60)) * 100), 100) : 0
            const colors = ['indigo', 'emerald', 'amber', 'rose', 'purple']
            const color = colors[index % colors.length]
            
            return (
              <div key={goal.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className={`w-3 h-3 rounded-full bg-${color}-500`}></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {goal.title}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {progress}% complete
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// Analytics Components
const AnalyticsView = ({ tasks, learningGoals, studySessions, loading }) => {
  const [timeRange, setTimeRange] = useState('month')

  // Calculate analytics data
  const taskCompletionRate = tasks.length > 0 ? 
    Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100) : 0

  const avgTaskCompletionTime = 2.5

  // Study time by day data
  const studyTimeByDay = studySessions.reduce((acc, session) => {
    const day = new Date(session.session_date).toLocaleDateString('en-US', { weekday: 'short' })
    acc[day] = (acc[day] || 0) + session.duration
    return acc
  }, {})

  const studyTimeData = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => ({
    day,
    time: Math.round((studyTimeByDay[day] || 0) / 60) // Convert to hours
  }))

  const goalProgressData = learningGoals.map(goal => ({
    name: goal.title,
    progress: goal.target_hours_per_week ? 
      Math.min(Math.round(((goal.current_progress || 0) / (goal.target_hours_per_week * 60)) * 100), 100) : 0
  }))

  const productivityData = [
    { day: 'Mon', productivity: 85 },
    { day: 'Tue', productivity: 92 },
    { day: 'Wed', productivity: 78 },
    { day: 'Thu', productivity: 88 },
    { day: 'Fri', productivity: 95 },
    { day: 'Sat', productivity: 65 },
    { day: 'Sun', productivity: 70 }
  ]

  const taskStatusData = [
    { status: 'Completed', count: tasks.filter(t => t.completed).length },
    { status: 'In Progress', count: tasks.filter(t => t.status === 'in_progress').length },
    { status: 'Todo', count: tasks.filter(t => t.status === 'todo' && !t.completed).length }
  ]

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-2xl"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Analytics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          icon={TrendingUp}
          title="Productivity Score"
          value="87%"
          trend={5}
          color="emerald"
        />
        <StatCard
          icon={Target}
          title="Goal Completion"
          value={`${taskCompletionRate}%`}
          trend={2}
          color="indigo"
        />
        <StatCard
          icon={Clock}
          title="Avg Focus Time"
          value={`${avgTaskCompletionTime}h`}
          trend={-1}
          color="amber"
        />
        <StatCard
          icon={Award}
          title="Consistency"
          value="94%"
          trend={3}
          color="purple"
        />
      </div>

      {/* Time Range Filter */}
      <div className="flex gap-2">
        {['week', 'month', 'quarter', 'year'].map(range => (
          <button
            key={range}
            onClick={() => setTimeRange(range)}
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
              timeRange === range
                ? 'bg-indigo-500 text-white shadow-md'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            {range.charAt(0).toUpperCase() + range.slice(1)}
          </button>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AnalyticsChart
          title="Productivity Trends"
          data={productivityData}
          type="line"
        />
        <AnalyticsChart
          title="Study Time Distribution"
          data={studyTimeData}
          type="bar"
        />
        <AnalyticsChart
          title="Goal Progress Overview"
          data={goalProgressData}
          type="radial"
        />
        <AnalyticsChart
          title="Task Completion Rate"
          data={taskStatusData}
          type="doughnut"
        />
      </div>

      {/* Enhanced Goal Progress Section */}
      <GoalProgressChart goals={learningGoals} />

      {/* Insights Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Performance Insights</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  Study consistency improved
                </span>
              </div>
              <span className="text-emerald-600 dark:text-emerald-400 text-sm font-medium">+15%</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  Focus time decreased
                </span>
              </div>
              <span className="text-amber-600 dark:text-amber-400 text-sm font-medium">-8%</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
              <div className="flex items-center gap-3">
                <Target className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  Goal completion rate
                </span>
              </div>
              <span className="text-indigo-600 dark:text-indigo-400 text-sm font-medium">92%</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Recommendations</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <Star className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                  Increase morning study sessions
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Your productivity is highest between 8-11 AM
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <Zap className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                  Break down large tasks
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Tasks taking more than 2 hours have lower completion rates
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <Eye className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                  Review learning goals weekly
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Consistent review improves goal achievement by 40%
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Main Dashboard Component
const DashboardPage = () => {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [activeView, setActiveView] = useState('overview')
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [dashboardData, setDashboardData] = useState({
    tasks: [],
    learningGoals: [],
    studySessions: [],
    stats: {
      weeklyStudyHours: 0,
      tasksCompleted: 0,
      productivity: 75,
      focusTime: 0,
      currentStreak: 0
    }
  })

  // Helper: calculate consecutive-day streak from study sessions
  const calculateCurrentStreak = (sessions) => {
    if (!sessions || !sessions.length) return 0

    let streak = 0
    const dates = [...new Set(sessions.map(s => new Date(s.session_date).toDateString()))].sort().reverse()
    let currentDate = new Date()
    for (let i = 0; i < dates.length; i++) {
      if (dates[i] === currentDate.toDateString()) {
        streak++
        currentDate.setDate(currentDate.getDate() - 1)
      } else {
        break
      }
    }
    return streak
  }

  

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)
    return () => clearInterval(timer)
  }, [])

  // fetch current user once on mount (loadDashboardData is stable via service usage)
  useEffect(() => {
    // Inline current-user + subscription flow to avoid hook-deps on local helper functions
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)
        if (user) {
          // load dashboard data inline
          try {
            const [tasks, learningGoals, studySessions] = await Promise.all([
              dashboardService.getTasks(user.id),
              dashboardService.getLearningGoals(user.id),
              dashboardService.getStudySessions(user.id)
            ])

            const transformedTasks = tasks.map(task => ({ ...task, completed: task.status === 'done' }))

            const enhancedGoals = learningGoals.map(goal => {
              const goalSessions = studySessions.filter(session => session.goal_id === goal.id)
              const totalDuration = goalSessions.reduce((total, session) => total + session.duration, 0)
              const avgDuration = goalSessions.length > 0 ? totalDuration / goalSessions.length : 0
              return { ...goal, session_count: goalSessions.length, avg_duration: avgDuration, current_progress: totalDuration }
            })

            const currentStreak = calculateCurrentStreak(studySessions)

            setDashboardData({
              tasks: transformedTasks,
              learningGoals: enhancedGoals,
              studySessions,
              stats: {
                weeklyStudyHours: Math.round(studySessions.reduce((total, session) => total + session.duration, 0) / 60),
                tasksCompleted: transformedTasks.filter(t => t.completed).length,
                productivity: transformedTasks.length > 0 ? Math.round((transformedTasks.filter(t => t.completed).length / transformedTasks.length) * 100) : 0,
                focusTime: 2.5,
                currentStreak
              }
            })
          } catch (err) {
            console.error('Error loading dashboard data (inline):', err)
          }
        }
      } catch (err) {
        console.error('Error getting user (inline):', err)
      } finally {
        setLoading(false)
      }
    })()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user)
        // attempt to load dashboard data on sign-in
        try {
          const [tasks, learningGoals, studySessions] = await Promise.all([
            dashboardService.getTasks(session.user.id),
            dashboardService.getLearningGoals(session.user.id),
            dashboardService.getStudySessions(session.user.id)
          ])
          // same transform as above
          const transformedTasks = tasks.map(task => ({ ...task, completed: task.status === 'done' }))
          const enhancedGoals = learningGoals.map(goal => {
            const goalSessions = studySessions.filter(s => s.goal_id === goal.id)
            const totalDuration = goalSessions.reduce((t, s) => t + s.duration, 0)
            const avgDuration = goalSessions.length > 0 ? totalDuration / goalSessions.length : 0
            return { ...goal, session_count: goalSessions.length, avg_duration: avgDuration, current_progress: totalDuration }
          })
          const currentStreak = calculateCurrentStreak(studySessions)
          setDashboardData({ tasks: transformedTasks, learningGoals: enhancedGoals, studySessions, stats: { weeklyStudyHours: Math.round(studySessions.reduce((total, session) => total + session.duration, 0) / 60), tasksCompleted: transformedTasks.filter(t => t.completed).length, productivity: transformedTasks.length > 0 ? Math.round((transformedTasks.filter(t => t.completed).length / transformedTasks.length) * 100) : 0, focusTime: 2.5, currentStreak } })
        } catch (err) {
          console.error('Error loading dashboard data on SIGNED_IN:', err)
        }
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  

  

  const handleToggleTaskComplete = async (taskId, completed) => {
    try {
      const newStatus = completed ? 'done' : 'todo'
      await dashboardService.updateTaskStatus(taskId, newStatus)
      
      // Reload tasks to get updated data
      if (user) {
        const tasks = await dashboardService.getTasks(user.id)
        const transformedTasks = tasks.map(task => ({
          ...task,
          completed: task.status === 'done'
        }))
        
        setDashboardData(prev => ({
          ...prev,
          tasks: transformedTasks,
          stats: {
            ...prev.stats,
            tasksCompleted: transformedTasks.filter(t => t.completed).length,
            productivity: transformedTasks.length > 0 ? 
              Math.round((transformedTasks.filter(t => t.completed).length / transformedTasks.length) * 100) : 0
          }
        }))
      }
    } catch (error) {
      console.error('Error updating task:', error)
      alert('Failed to update task')
    }
  }

  const renderActiveView = () => {
    switch (activeView) {
      case 'tasks':
        return (
          <TasksView
            tasks={dashboardData.tasks}
            onToggleTaskComplete={handleToggleTaskComplete}
            loading={loading}
          />
        )
      case 'learning':
        return (
          <LearningView
            learningGoals={dashboardData.learningGoals}
            studySessions={dashboardData.studySessions}
            currentStreak={dashboardData.stats.currentStreak}
            loading={loading}
          />
        )
      case 'analytics':
        return (
          <AnalyticsView
            tasks={dashboardData.tasks}
            learningGoals={dashboardData.learningGoals}
            studySessions={dashboardData.studySessions}
            loading={loading}
          />
        )
      default:
        return <OverviewView data={dashboardData} loading={loading} />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Learner'

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
      <div className="max-w-7xl mx-auto px-2 sm:px-0">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Good {currentTime.getHours() < 12 ? 'Morning' : currentTime.getHours() < 18 ? 'Afternoon' : 'Evening'}, {displayName}!
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {currentTime.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
          
          <div className="flex items-center gap-4">
                <div className="hidden md:flex items-center gap-2 bg-white dark:bg-gray-800 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {dashboardData.stats.currentStreak} day streak
              </span>
            </div>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex gap-2 mt-6 overflow-x-auto pb-2 -mx-2 sm:mx-0">
          {['overview', 'tasks', 'learning', 'analytics'].map((view) => (
            <button
              key={view}
              onClick={() => setActiveView(view)}
              className={`px-3 py-2 text-sm rounded-lg font-medium transition-all duration-300 ${
                activeView === view
                  ? 'bg-indigo-500 text-white shadow-md'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              {view.charAt(0).toUpperCase() + view.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      {renderActiveView()}
      </div>
    </div>
  )
}

// Overview View Component
const OverviewView = ({ data, loading }) => {
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-2xl"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          icon={Clock}
          title="Study Hours"
          value={data.stats.weeklyStudyHours}
          subtitle="This week"
          color="indigo"
        />
        <StatCard
          icon={CheckCircle}
          title="Tasks Done"
          value={data.stats.tasksCompleted}
          subtitle="This week"
          color="emerald"
        />
        <StatCard
          icon={Activity}
          title="Productivity"
          value={`${data.stats.productivity}%`}
          color="amber"
        />
        <StatCard
          icon={Target}
          title="Focus Time"
          value={`${data.stats.focusTime}h`}
          color="rose"
        />
      </div>
      
      {/* Quick Overview Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Tasks */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Recent Tasks</h3>
          <div className="space-y-3">
            {data.tasks.slice(0, 5).map(task => (
              <div key={task.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className={`w-3 h-3 rounded-full ${
                  task.completed ? 'bg-emerald-500' : 
                  task.priority === 'high' ? 'bg-rose-500' : 
                  'bg-amber-500'
                }`}></div>
                <span className={`flex-1 text-sm ${task.completed ? 'line-through text-gray-500' : 'text-gray-700 dark:text-gray-300'}`}>
                  {task.title}
                </span>
                {!task.completed && task.priority === 'high' && (
                  <AlertCircle className="w-4 h-4 text-rose-500" />
                )}
              </div>
            ))}
            {data.tasks.length === 0 && (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">No tasks yet</p>
            )}
          </div>
        </div>

        {/* Learning Progress - Fixed white percentage text */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Learning Progress</h3>
          <div className="space-y-4">
            {data.learningGoals.slice(0, 3).map(goal => {
              const progress = goal.target_hours_per_week ? 
                Math.min(Math.round(((goal.current_progress || 0) / (goal.target_hours_per_week * 60)) * 100), 100) : 0
              return (
                <div key={goal.id} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-700 dark:text-gray-300">{goal.title}</span>
                    <span className="font-medium text-gray-900 dark:text-white">{progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full bg-indigo-500 transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>
              )
            })}
            {data.learningGoals.length === 0 && (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">No learning goals yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage