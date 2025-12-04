// pages/TaskDetailPage.js - VERSI YANG SUDAH DIINTEGRASIKAN
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Clock, 
  Calendar, 
  Flag, 
  Tag, 
  CheckCircle, 
  Circle,
  Plus,
  Save,
  X
} from 'lucide-react'

import { supabase, isSupabaseConfigured } from '../services/supabaseClient.js'
import taskService from '../services/taskService.js'

export default function TaskDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [task, setTask] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editedTask, setEditedTask] = useState(null)
  const [newSubtask, setNewSubtask] = useState('')
  const [user, setUser] = useState(null)

  // Check user
  useEffect(() => {
    const checkUser = async () => {
      if (isSupabaseConfigured) {
        const { data: { session } } = await supabase.auth.getSession()
        setUser(session?.user || null)
      }
    }
    checkUser()
  }, [])

  // Fetch task data
  useEffect(() => {
    const fetchTask = async () => {
      try {
        setLoading(true)
        if (!user) {
          setError('Please login to view task details')
          return
        }

        const taskData = await taskService.getById(id, user.id)
        setTask(taskData)
        setEditedTask(taskData)
      } catch (err) {
        setError('Failed to load task details')
        console.error('Error fetching task:', err)
      } finally {
        setLoading(false)
      }
    }

    if (id && user) {
      fetchTask()
    }
  }, [id, user])

  // Handler functions
  const handleSave = async () => {
    try {
      const updatedTask = await taskService.update(id, editedTask, user.id)
      setTask(updatedTask)
      setIsEditing(false)
    } catch (err) {
      setError('Failed to update task')
      console.error('Error updating task:', err)
    }
  }

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await taskService.delete(id, user.id)
        navigate('/tasks')
      } catch (err) {
        setError('Failed to delete task')
        console.error('Error deleting task:', err)
      }
    }
  }

  const handleSubtaskToggle = async (subtaskId, currentStatus) => {
    try {
      const updatedSubtask = await taskService.updateSubtask(subtaskId, {
        is_completed: !currentStatus
      })
      
      // Update local state
      setTask(prev => ({
        ...prev,
        subtasks: prev.subtasks.map(st => 
          st.id === subtaskId ? updatedSubtask : st
        )
      }))
    } catch (err) {
      setError('Failed to update subtask')
      console.error('Error updating subtask:', err)
    }
  }

  const handleAddSubtask = async () => {
    if (!newSubtask.trim()) return

    try {
      const newSubtaskData = await taskService.createSubtask(id, {
        title: newSubtask.trim()
      })

      setTask(prev => ({
        ...prev,
        subtasks: [...(prev.subtasks || []), newSubtaskData]
      }))
      
      setNewSubtask('')
    } catch (err) {
      setError('Failed to add subtask')
      console.error('Error adding subtask:', err)
    }
  }

  const handleStatusChange = async (newStatus) => {
    try {
      const updatedTask = await taskService.update(id, {
        ...task,
        status: newStatus
      }, user.id)
      
      setTask(updatedTask)
      setEditedTask(updatedTask)
    } catch (err) {
      setError('Failed to update status')
      console.error('Error updating status:', err)
    }
  }

  // Utility functions
  const getPriorityColor = (priority) => {
    const colors = {
      high: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border-rose-200 dark:border-rose-800',
      medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800',
      low: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800'
    }
    return colors[priority] || colors.medium
  }

  const getStatusColor = (status) => {
    const colors = {
      todo: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
      in_progress: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      done: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
    }
    return colors[status] || colors.todo
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'No due date'
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatDateTime = (dateString) => {
    if (!dateString) return ''
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
  }

  const calculateProgress = (subtasks) => {
    if (!subtasks || subtasks.length === 0) return 0
    const completed = subtasks.filter(st => st.is_completed).length
    return Math.round((completed / subtasks.length) * 100)
  }

  const minutesToHours = (minutes) => {
    return minutes ? (minutes / 60).toFixed(1) : 0
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading task details...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <button
            onClick={() => navigate('/tasks')}
            className="bg-indigo-500 text-white px-6 py-2 rounded-lg hover:bg-indigo-600 transition-colors"
          >
            Back to Tasks
          </button>
        </div>
      </div>
    )
  }

  if (!task) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">Task not found</p>
          <button
            onClick={() => navigate('/tasks')}
            className="bg-indigo-500 text-white px-6 py-2 rounded-lg hover:bg-indigo-600 transition-colors"
          >
            Back to Tasks
          </button>
        </div>
      </div>
    )
  }

  const progress = calculateProgress(task.subtasks)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-transparent dark:bg-transparent border-b border-transparent sm:border-gray-200 dark:border-transparent dark:sm:border-gray-700 sticky top-0 z-40 sm:bg-white dark:sm:bg-gray-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/tasks')}
                className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="font-medium">Back to Tasks</span>
              </button>
            </div>

            <div className="flex items-center gap-3">
              {!isEditing ? (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                    Edit Task
                  </button>
                  <button
                    onClick={handleDelete}
                    className="flex items-center gap-2 px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    Save Changes
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Task Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Task Header */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
              {isEditing ? (
                <div className="space-y-4">
                  <input
                    type="text"
                    value={editedTask.title}
                    onChange={(e) => setEditedTask(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full text-2xl font-bold bg-transparent border-b border-gray-200 dark:border-gray-600 pb-2 focus:outline-none focus:border-indigo-500 text-gray-900 dark:text-white"
                  />
                  <textarea
                    value={editedTask.description}
                    onChange={(e) => setEditedTask(prev => ({ ...prev, description: e.target.value }))}
                    rows={4}
                    className="w-full bg-transparent border border-gray-200 dark:border-gray-600 rounded-lg p-3 focus:outline-none focus:border-indigo-500 text-gray-600 dark:text-gray-400 resize-none"
                  />
                </div>
              ) : (
                <>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    {task.title}
                  </h1>
                  {task.description && (
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                      {task.description}
                    </p>
                  )}
                </>
              )}

              {/* Tags and Metadata */}
              <div className="flex flex-wrap items-center gap-3 mt-6">
                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getPriorityColor(task.priority)}`}>
                  <Flag className="w-3 h-3 inline mr-1" />
                  {task.priority}
                </span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(task.status)}`}>
                  {task.status.replace('_', ' ')}
                </span>
                {task.categories && (
                  <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm font-medium">
                    <Tag className="w-3 h-3 inline mr-1" />
                    {task.categories.name}
                  </span>
                )}
              </div>
            </div>

            {/* Progress Section */}
            {task.subtasks && task.subtasks.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Progress
                  </h3>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {progress}% complete
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-4">
                  <div
                    className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>

                {/* Subtasks */}
                <div className="space-y-3">
                  {task.subtasks.map((subtask) => (
                    <div key={subtask.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <button
                        onClick={() => handleSubtaskToggle(subtask.id, subtask.is_completed)}
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                          subtask.is_completed 
                            ? 'bg-emerald-500 border-emerald-500 text-white' 
                            : 'border-gray-300 dark:border-gray-600 hover:border-emerald-400'
                        }`}
                      >
                        {subtask.is_completed && <CheckCircle className="w-3 h-3" />}
                      </button>
                      <span className={`flex-1 text-gray-700 dark:text-gray-300 ${
                        subtask.is_completed ? 'line-through text-gray-500' : ''
                      }`}>
                        {subtask.title}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDateTime(subtask.created_at)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Add Subtask */}
                <div className="flex gap-2 mt-4">
                  <input
                    type="text"
                    value={newSubtask}
                    onChange={(e) => setNewSubtask(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddSubtask()}
                    placeholder="Add a new subtask..."
                    className="flex-1 px-3 py-2 bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-500 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-white"
                  />
                  <button
                    onClick={handleAddSubtask}
                    className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Status Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Task Status
              </h3>
              <div className="space-y-2">
                {['todo', 'in_progress', 'done'].map((status) => (
                  <button
                    key={status}
                    onClick={() => handleStatusChange(status)}
                    className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${
                      task.status === status
                        ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300'
                        : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {task.status === status ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <Circle className="w-5 h-5" />
                      )}
                      <span className="capitalize">{status.replace('_', ' ')}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Task Metadata */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Details
              </h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Due Date</div>
                    <div className="text-gray-900 dark:text-white">
                      {task.due_date ? formatDate(task.due_date) : 'No due date'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Estimated Time</div>
                    <div className="text-gray-900 dark:text-white">
                      {task.estimated_duration ? `${minutesToHours(task.estimated_duration)} hours` : 'Not set'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Activity Log */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Activity
              </h3>
              <div className="space-y-3">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Created on {formatDateTime(task.created_at)}
                </div>
                {task.updated_at !== task.created_at && (
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Updated {formatDateTime(task.updated_at)}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}