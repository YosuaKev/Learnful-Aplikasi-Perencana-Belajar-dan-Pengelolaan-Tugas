import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Plus, 
  Search, 
  Filter, 
  Grid3X3, 
  List, 
  Clock,
  Flag,
  Edit,
  Trash2,
  CheckCircle,
  ChevronDown,
  Save,
  X,
  Circle,
  CheckCircle2
} from 'lucide-react'

import { supabase, isSupabaseConfigured } from '../services/supabaseClient.js'

// Demo categories data
const demoCategories = [
  { id: '1', name: 'Work', color: '#3B82F6' },
  { id: '2', name: 'Personal', color: '#10B981' },
  { id: '3', name: 'Learning', color: '#8B5CF6' },
  { id: '4', name: 'Health', color: '#EF4444' },
  { id: '5', name: 'Finance', color: '#F59E0B' },
  { id: '6', name: 'Shopping', color: '#EC4899' }
]

// Helper functions
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

const calculateProgress = (subtasks) => {
  if (!subtasks || subtasks.length === 0) return 0
  const completed = subtasks.filter(st => st.is_completed).length
  return Math.round((completed / subtasks.length) * 100)
}

const formatDate = (dateString) => {
  if (!dateString) return 'No due date'
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

const isOverdue = (dueDate) => {
  if (!dueDate) return false
  return new Date(dueDate) < new Date()
}

const minutesToHours = (minutes) => {
  return minutes ? (minutes / 60) : 0
}

// Task Card Component
const TaskCard = ({ task, onEdit, onDelete, onStatusChange, onOpen }) => {
  const progress = calculateProgress(task.subtasks)
  const overdue = isOverdue(task.due_date)
  const categoryName = task.categories?.name || 'Uncategorized'
  const categoryColor = task.categories?.color || '#6B7280'

  return (
    <div onClick={() => onOpen && onOpen(task)} className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all duration-300 group cursor-pointer">
      {/* Header */}
      <div className="flex items-start justify-between mb-3 sm:mb-4">
        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
          <button 
            onClick={(e) => {
              e.stopPropagation()
              const newStatus = task.status === 'done' ? 'todo' : 'done'
              onStatusChange(task.id, newStatus)
            }}
            className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ${
              task.status === 'done' 
                ? 'bg-emerald-500 border-emerald-500 text-white' 
                : 'border-gray-300 dark:border-gray-600 hover:border-emerald-400'
            }`}
          >
            {task.status === 'done' && <CheckCircle className="w-2 h-2 sm:w-3 sm:h-3" />}
          </button>
          <div className="flex-1 min-w-0">
            <h3 className={`font-semibold text-gray-900 dark:text-white text-sm sm:text-base truncate ${
              task.status === 'done' ? 'line-through text-gray-500 dark:text-gray-500' : ''
            }`}>
              {task.title}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm mt-1 line-clamp-2">
              {task.description || 'No description'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-1 sm:gap-2 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
          <button 
            onClick={(e) => { e.stopPropagation(); onEdit(task) }}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete(task.id) }}
            className="p-1 text-gray-400 hover:text-rose-500"
          >
            <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
          </button>
        </div>
      </div>

      {/* Tags and Category */}
      <div className="flex items-center gap-1 sm:gap-2 mb-3 sm:mb-4 flex-wrap">
        <span className={`px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)} border`}>
          <Flag className="w-2 h-2 sm:w-3 sm:h-3 inline mr-0.5 sm:mr-1" />
          <span className="hidden xs:inline">{task.priority}</span>
          <span className="xs:hidden">{task.priority.charAt(0)}</span>
        </span>
        <span className={`px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
          <span className="hidden sm:inline">{task.status.replace('_', ' ')}</span>
          <span className="sm:hidden">{task.status === 'in_progress' ? 'In Prog' : task.status}</span>
        </span>
        <span className="flex items-center gap-1 px-1.5 py-0.5 sm:px-2 sm:py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-xs text-gray-600 dark:text-gray-400">
          <div 
            className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full" 
            style={{ backgroundColor: categoryColor }}
          ></div>
          <span className="truncate max-w-[60px] sm:max-w-none">{categoryName}</span>
        </span>
      </div>

      {/* Progress Bar */}
      {task.subtasks && task.subtasks.length > 0 && (
        <div className="mb-3 sm:mb-4">
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1 sm:mb-2">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 sm:h-2">
            <div 
              className="bg-emerald-500 h-1.5 sm:h-2 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {task.subtasks.filter(st => st.is_completed).length}/{task.subtasks.length} done
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 sm:pt-4 border-t border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 dark:text-gray-300" />
            <span>{minutesToHours(task.estimated_duration)}h</span>
          </div>
          <div className={`flex items-center gap-1 ${overdue && task.status !== 'done' ? 'text-rose-500' : ''}`}>
            <span className="text-xs">{formatDate(task.due_date)}</span>
            {overdue && task.status !== 'done' && <span className="text-xs">(Overdue)</span>}
          </div>
        </div>

        {/* Completed Date */}
        {task.completed_at && (
          <div className="text-xs text-emerald-600 dark:text-emerald-400 hidden sm:block">
            Done: {formatDate(task.completed_at)}
          </div>
        )}
      </div>
    </div>
  )
}

// Kanban Column Component
const KanbanColumn = ({ title, tasks, onEdit, onDelete, onStatusChange, onOpen }) => {
  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl sm:rounded-2xl p-3 sm:p-4 min-h-[400px] sm:min-h-[600px]">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <h3 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base capitalize">
          {title} <span className="text-gray-500 dark:text-gray-400">({tasks.length})</span>
        </h3>
      </div>
      
      <div className="space-y-2 sm:space-y-3">
        {tasks.map(task => (
          <TaskCard 
            key={task.id} 
            task={task}
            onEdit={onEdit}
            onDelete={onDelete}
            onStatusChange={onStatusChange}
            onOpen={onOpen}
          />
        ))}
      </div>
    </div>
  )
}

// Task Modal Component
const TaskModal = ({ 
  taskForm, 
  setTaskForm, 
  categories, 
  onSave, 
  onClose, 
  saving, 
  isEditing 
}) => {
  const handleSubmit = (e) => {
    e.preventDefault()
    onSave()
  }

  const hoursToMinutes = (hours) => {
    return hours ? (hours * 60) : 0
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Swipe indicator for mobile */}
        <div className="sm:hidden flex justify-center py-2">
          <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
        </div>
        
        <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
              {isEditing ? 'Edit Task' : 'New Task'}
            </h2>
            <button 
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Task Title *
            </label>
            <input
              type="text"
              required
              value={taskForm.title}
              onChange={(e) => setTaskForm(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 sm:px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-sm sm:text-base"
              placeholder="Enter task title"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={taskForm.description}
              onChange={(e) => setTaskForm(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full px-3 sm:px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-sm sm:text-base"
              placeholder="Enter task description"
            />
          </div>

          {/* Form Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category
              </label>
              <select
                value={taskForm.category || ""}
                onChange={(e) => setTaskForm(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 sm:px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-white text-sm sm:text-base"
              >
                <option value="">Select Category</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id} className="text-gray-900 dark:text-white">
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Priority
              </label>
              <select
                value={taskForm.priority}
                onChange={(e) => setTaskForm(prev => ({ ...prev, priority: e.target.value }))}
                className="w-full px-3 sm:px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-white text-sm sm:text-base"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <select
                value={taskForm.status}
                onChange={(e) => setTaskForm(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-3 sm:px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-white text-sm sm:text-base"
              >
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>

            {/* Estimated Duration */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Duration (hours)
              </label>
              <input
                type="number"
                min="0.5"
                step="0.5"
                value={minutesToHours(taskForm.estimated_duration)}
                onChange={(e) => setTaskForm(prev => ({ 
                  ...prev, 
                  estimated_duration: hoursToMinutes(parseFloat(e.target.value) || 0.5) 
                }))}
                className="w-full px-3 sm:px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-white text-sm sm:text-base"
              />
            </div>

            {/* Due Date */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Due Date
              </label>
              <input
                type="date"
                value={taskForm.due_date}
                onChange={(e) => setTaskForm(prev => ({ ...prev, due_date: e.target.value }))}
                className="w-full px-3 sm:px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-white text-sm sm:text-base"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 sm:gap-3 pt-4 border-t border-gray-200 dark:border-gray-700 sticky bottom-0 bg-white dark:bg-gray-800 pb-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-3 sm:px-4 py-2 bg-gray-500 text-white rounded-lg sm:rounded-xl hover:bg-gray-600 transition-colors text-sm sm:text-base"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-3 sm:px-4 py-2 bg-linear-to-r from-indigo-500 to-purple-600 text-white rounded-lg sm:rounded-xl hover:shadow-lg transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saving ? 'Saving...' : (isEditing ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function TasksPage() {
  const [viewMode, setViewMode] = useState('list')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [selectedPriority, setSelectedPriority] = useState('all')
  const [showFilters, setShowFilters] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [tasks, setTasks] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState(null)
  const [showAuth, setShowAuth] = useState(false)
  const navigate = useNavigate()

  // Form state untuk new/edit task
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    category: '',
    priority: 'medium',
    status: 'todo',
    due_date: '',
    estimated_duration: 120 // 2 jam dalam menit
  })

  // Check user authentication
  const checkUser = useCallback(async () => {
    if (!isSupabaseConfigured) {
      console.log('Supabase not configured, using demo mode');
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.error('Error getting session:', error);
        setUser(null);
      } else {
        console.log('User session found:', session?.user);
        setUser(session?.user || null);
      }
    } catch (error) {
      console.error('Error checking user:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [])

  // Load tasks dari Supabase - VERSI DIPERBAIKI
  const loadTasks = useCallback(async () => {
    setLoading(true);
    try {
      if (isSupabaseConfigured && user) {
        console.log('Loading tasks from Supabase for user:', user.id);
        
        const { data, error } = await supabase
          .from('tasks')
          .select(`
            *,
            categories (
              id,
              name,
              color
            ),
            subtasks (
              id,
              title,
              is_completed
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Supabase tasks error:', error);
          setTasks([]);
          return;
        }
        
        console.log('Tasks loaded successfully from Supabase:', data?.length);
        setTasks(data || []);
        
      } else {
        console.log('No user or Supabase not configured');
        setTasks([]);
      }
      } catch (err) {
      console.error('Error loading tasks:', err);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Load categories dari Supabase - VERSI DIPERBAIKI
  const loadCategories = useCallback(async () => {
    try {
      if (isSupabaseConfigured && user) {
        console.log('Loading categories from Supabase for user:', user.id);
        
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .eq('user_id', user.id)
          .order('name');

        if (error) {
          console.error('Supabase categories error:', error);
          setCategories(demoCategories);
          return;
        }

        console.log('Categories loaded from Supabase:', data?.length);
        
        if (!data || data.length === 0) {
          console.log('No categories in DB, creating demo categories for user');
          
          const demoCategoriesWithUserId = demoCategories.map(cat => ({
            name: cat.name,
            color: cat.color,
            user_id: user.id
          }));

          const { data: newCats, error: insertError } = await supabase
            .from('categories')
            .insert(demoCategoriesWithUserId)
            .select();

          if (insertError) {
            console.error('Error inserting demo categories:', insertError);
            setCategories(demoCategories);
          } else {
            console.log('Demo categories created successfully');
            setCategories(newCats || demoCategories);
          }
        } else {
          setCategories(data);
        }
      } else {
        console.log('Using demo categories (no Supabase or no user)');
        setCategories(demoCategories);
      }
    } catch (err) {
      console.error('Error in loadCategories:', err);
      setCategories(demoCategories);
    }
  }, [user]);

  // Create task function - VERSI DIPERBAIKI
  const createTask = async (taskData) => {
    if (!taskData.title.trim()) {
      throw new Error('Task title is required');
    }

    try {
      if (isSupabaseConfigured && user) {
        console.log('Attempting to save to Supabase...');
        
        const categoryId = taskData.category && taskData.category !== '' ? taskData.category : null;
        
        const payload = {
          user_id: user.id,
          title: taskData.title.trim(),
          description: taskData.description?.trim() || null,
          category_id: categoryId,
          priority: taskData.priority,
          status: taskData.status,
          due_date: taskData.due_date || null,
          estimated_duration: taskData.estimated_duration || 120
        };

        console.log('Creating task with payload:', payload);

        const { data, error } = await supabase
          .from('tasks')
          .insert([payload])
          .select(`
            *,
            categories (
              id,
              name,
              color
            ),
            subtasks (
              id,
              title,
              is_completed
            )
          `)
          .single();

        if (error) {
          console.error('Supabase insert error details:', error);
          throw new Error(`Database error: ${error.message}`);
        }

        console.log('Task successfully created in Supabase:', data);
        return data;
      } else {
        throw new Error('Not authenticated or Supabase not configured');
      }
    } catch (err) {
      console.error('Error creating task:', err);
      throw err;
    }
  };

  // Update task function - VERSI DIPERBAIKI
  const updateTask = async (taskId, taskData) => {
    try {
      if (isSupabaseConfigured && user) {
        const categoryId = taskData.category && taskData.category !== '' ? taskData.category : null;
        
        const updateData = {
          title: taskData.title,
          description: taskData.description,
          category_id: categoryId,
          priority: taskData.priority,
          status: taskData.status,
          due_date: taskData.due_date || null,
          estimated_duration: taskData.estimated_duration,
          completed_at: taskData.status === 'done' ? new Date().toISOString() : null
        };

        console.log('Updating task:', taskId, updateData);

        const { data, error } = await supabase
          .from('tasks')
          .update(updateData)
          .eq('id', taskId)
          .eq('user_id', user.id)
          .select(`
            *,
            categories (
              id,
              name,
              color
            )
          `)
          .single();

        if (error) {
          console.error('Supabase update error:', error);
          throw error;
        }

        setTasks(prev => prev.map(t => t.id === taskId ? data : t));
        return data;
        
      } else {
        throw new Error('Not authenticated or Supabase not configured');
      }
    } catch (err) {
      console.error('Error in updateTask:', err);
      throw err;
    }
  };

  // Delete task function
  const deleteTask = async (taskId) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    
    try {
      if (isSupabaseConfigured && user) {
        const { error } = await supabase
          .from('tasks')
          .delete()
          .eq('id', taskId)
          .eq('user_id', user.id);

        if (error) {
          console.error('Supabase delete error:', error);
          throw error;
        }
      }
      
      const newTasks = tasks.filter(t => t.id !== taskId)
      setTasks(newTasks);
      
    } catch (err) {
      console.error('Error deleting task:', err);
      alert('Failed to delete task. Please try again.');
    }
  };

  // Update task status
  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      if (isSupabaseConfigured && user) {
        const updateData = { status: newStatus };
        if (newStatus === 'done') {
          updateData.completed_at = new Date().toISOString();
        }

        const { error } = await supabase
          .from('tasks')
          .update(updateData)
          .eq('id', taskId)
          .eq('user_id', user.id);

        if (error) {
          console.error('Supabase status update error:', error);
          throw error;
        }
      }

      setTasks(prev => prev.map(task => 
        task.id === taskId 
          ? { 
              ...task, 
              status: newStatus,
              completed_at: newStatus === 'done' ? new Date().toISOString() : null
            }
          : task
      ));

    } catch (err) {
      console.error('Error updating task status:', err);
      alert('Error updating task status.');
    }
  };

  // Handle create task - VERSI DIPERBAIKI
  const handleCreateTask = async () => {
    if (!taskForm.title.trim()) {
      alert('Task title is required');
      return;
    }

    setSaving(true);
    try {
      console.log('Creating task...', {
        user: user?.email,
        supabaseConfigured: isSupabaseConfigured,
        taskData: taskForm
      });

      const result = await createTask({
        title: taskForm.title,
        description: taskForm.description,
        category: taskForm.category,
        priority: taskForm.priority,
        status: taskForm.status,
        due_date: taskForm.due_date || null,
        estimated_duration: taskForm.estimated_duration
      });

      console.log('Task creation result:', result);

      setTasks(prev => [result, ...prev]);
      
      resetTaskForm();
      setShowTaskModal(false);
      
      console.log('Task created successfully!');
      
    } catch (error) {
      console.error('Error creating task:', error);
      alert(`Failed to create task: ${error.message}`);
      
      if (error.message.includes('foreign key')) {
        console.error('Foreign key error - mungkin category_id tidak valid');
      }
      if (error.message.includes('ROW LEVEL SECURITY')) {
        console.error('RLS error - policies mungkin tidak berfungsi');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateTask = async () => {
    if (!taskForm.title.trim()) {
      alert('Task title is required')
      return
    }

    setSaving(true)
    try {
      await updateTask(editingTask.id, {
        title: taskForm.title,
        description: taskForm.description,
        category: taskForm.category,
        priority: taskForm.priority,
        status: taskForm.status,
        due_date: taskForm.due_date || null,
        estimated_duration: taskForm.estimated_duration
      })

      resetTaskForm()
      setShowTaskModal(false)
      setEditingTask(null)
    } catch (error) {
      console.error('Error updating task:', error)
      alert(`Failed to update task: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  const resetTaskForm = () => {
    setTaskForm({
      title: '',
      description: '',
      category: '',
      priority: 'medium',
      status: 'todo',
      due_date: '',
      estimated_duration: 120
    })
  }

  const openEditModal = (task) => {
    setEditingTask(task)
    setTaskForm({
      title: task.title,
      description: task.description || '',
      category: task.category_id || '',
      priority: task.priority,
      status: task.status,
      due_date: task.due_date ? task.due_date.split('T')[0] : '',
      estimated_duration: task.estimated_duration || 120
    })
    setShowTaskModal(true)
  }

  const openCreateModal = () => {
    if (isSupabaseConfigured && !user) {
      setShowAuth(true);
      return;
    }
    
    setEditingTask(null)
    resetTaskForm()
    setShowTaskModal(true)
  }

  const closeModal = () => {
    setShowTaskModal(false)
    setEditingTask(null)
    resetTaskForm()
  }

  // Filter tasks based on selections
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesCategory = selectedCategory === 'all' || task.category_id === selectedCategory
    const matchesStatus = selectedStatus === 'all' || task.status === selectedStatus
    const matchesPriority = selectedPriority === 'all' || task.priority === selectedPriority

    return matchesSearch && matchesCategory && matchesStatus && matchesPriority
  })

  // Auth state listener
  useEffect(() => {
    if (isSupabaseConfigured) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          console.log('Auth state changed:', event);
          setUser(session?.user || null);
        }
      );

      return () => subscription.unsubscribe();
    }
    // `isSupabaseConfigured` is static from the client module and does not need
    // to be in the dependency array for this mount-only effect.
  }, []);

  // Initial load
  useEffect(() => {
    checkUser()
  }, [checkUser])

  // Load data when user changes - VERSI DIPERBAIKI
  useEffect(() => {
    if (user !== null) {
      console.log('User state determined, loading data...', { 
        user: user?.email, 
        userId: user?.id,
        supabaseConfigured: isSupabaseConfigured 
      });
      
      const timer = setTimeout(() => {
        loadTasks();
        loadCategories();
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [user, loadTasks, loadCategories]);

  // Debug effect untuk monitor state
  useEffect(() => {
    console.log('Current app state:', {
      user: user?.email,
      tasksCount: tasks.length,
      categoriesCount: categories.length,
      loading,
      supabaseConfigured: isSupabaseConfigured
    });
  }, [user, tasks, categories, loading]);

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
        }
      } catch (error) {
        alert(error.message)
      } finally {
        setLoading(false)
      }
    }

    return (
      <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-indigo-600 mx-auto mb-3 sm:mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">Loading your tasks...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-3 sm:p-4 md:p-6">
      {/* Auth Modal */}
      {showAuth && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl p-4 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            {/* Swipe indicator for mobile */}
            <div className="sm:hidden flex justify-center mb-2">
              <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
            </div>
            
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">Login Required</h2>
              <button onClick={() => setShowAuth(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm sm:text-base">
              Please login to save your tasks permanently to the cloud.
            </p>
            <Auth />
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Tasks & Projects
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
              Manage your tasks, projects, and deadlines
            </p>
            </div>
          
          <div className="flex items-center gap-2 self-end sm:self-auto">
            {!user && isSupabaseConfigured && (
              <button 
                onClick={() => setShowAuth(true)}
                className="bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
              >
                Login
              </button>
            )}
            <button 
              onClick={openCreateModal}
              className="bg-linear-to-r from-indigo-500 to-purple-600 text-white px-4 py-2.5 rounded-xl font-medium hover:shadow-lg transition-all duration-300 flex items-center gap-2 text-sm"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New Task</span>
              <span className="sm:hidden">Task</span>
            </button>
          </div>
        </div>

        {/* View Toggle and Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex gap-1 sm:gap-2">
            {[
              { id: 'list', icon: List, label: 'List' },
              { id: 'kanban', icon: Grid3X3, label: 'Kanban' },
            ].map((view) => {
              const Icon = view.icon
              return (
                <button
                  key={view.id}
                  onClick={() => setViewMode(view.id)}
                  className={`flex items-center gap-1 sm:gap-2 px-3 py-2 rounded-lg font-medium transition-all duration-300 text-sm ${
                    viewMode === view.id
                      ? 'bg-indigo-500 text-white shadow-md'
                      : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <Icon className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>{view.label}</span>
                </button>
              )
            })}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:flex-none">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-full sm:w-48 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-sm"
              />
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-1 sm:gap-2 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:shadow-md transition-all text-gray-700 dark:text-gray-300 text-sm"
            >
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">Filters</span>
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100 dark:border-gray-700 mb-4 sm:mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg sm:rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-white text-sm sm:text-base"
              >
                <option value="all" className="text-gray-900 dark:text-white">All Categories</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id} className="text-gray-900 dark:text-white">
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg sm:rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-white text-sm sm:text-base"
              >
                <option value="all" className="text-gray-900 dark:text-white">All Status</option>
                <option value="todo" className="text-gray-900 dark:text-white">To Do</option>
                <option value="in_progress" className="text-gray-900 dark:text-white">In Progress</option>
                <option value="done" className="text-gray-900 dark:text-white">Done</option>
              </select>
            </div>

            {/* Priority Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Priority
              </label>
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg sm:rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-white text-sm sm:text-base"
              >
                <option value="all" className="text-gray-900 dark:text-white">All Priorities</option>
                <option value="high" className="text-gray-900 dark:text-white">High</option>
                <option value="medium" className="text-gray-900 dark:text-white">Medium</option>
                <option value="low" className="text-gray-900 dark:text-white">Low</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      {viewMode === 'list' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {filteredTasks.map(task => (
                <TaskCard 
                  key={task.id} 
                  task={task} 
                  onEdit={openEditModal}
                  onDelete={deleteTask}
                  onStatusChange={updateTaskStatus}
                  onOpen={(t) => navigate(`/tasks/${t.id}`)}
                />
              ))}
        </div>
      )}

      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          <KanbanColumn 
            title="To Do" 
            tasks={filteredTasks.filter(t => t.status === 'todo')}
            onEdit={openEditModal}
            onDelete={deleteTask}
            onStatusChange={updateTaskStatus}
            onOpen={(t) => navigate(`/tasks/${t.id}`)}
          />
          <KanbanColumn 
            title="In Progress" 
            tasks={filteredTasks.filter(t => t.status === 'in_progress')}
            onEdit={openEditModal}
            onDelete={deleteTask}
            onStatusChange={updateTaskStatus}
            onOpen={(t) => navigate(`/tasks/${t.id}`)}
          />
          <KanbanColumn 
            title="Done" 
            tasks={filteredTasks.filter(t => t.status === 'done')}
            onEdit={openEditModal}
            onDelete={deleteTask}
            onStatusChange={updateTaskStatus}
            onOpen={(t) => navigate(`/tasks/${t.id}`)}
          />
        </div>
      )}

      {/* Empty State */}
      {filteredTasks.length === 0 && searchQuery === '' && (
        <div className="text-center py-8 sm:py-12">
          <div className="w-16 h-16 sm:w-24 sm:h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
            <CheckCircle className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" />
          </div>
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No tasks yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4 sm:mb-6 text-sm sm:text-base">
            Get started by creating your first task.
          </p>
          <button 
            onClick={openCreateModal}
            className="bg-linear-to-r from-indigo-500 to-purple-600 text-white px-4 py-2.5 rounded-xl font-medium hover:shadow-lg transition-all duration-300 flex items-center gap-2 mx-auto text-sm"
          >
            <Plus className="w-4 h-4" />
            Create Your First Task
          </button>
        </div>
      )}

      {filteredTasks.length === 0 && searchQuery !== '' && (
        <div className="text-center py-8 sm:py-12">
          <div className="w-16 h-16 sm:w-24 sm:h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
            <Search className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" />
          </div>
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No tasks found
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4 sm:mb-6 text-sm sm:text-base">
            Try adjusting your search or filters.
          </p>
        </div>
      )}

      {/* Task Modal */}
      {showTaskModal && (
        <TaskModal 
          taskForm={taskForm}
          setTaskForm={setTaskForm}
          categories={categories}
          onSave={editingTask ? handleUpdateTask : handleCreateTask}
          onClose={closeModal}
          saving={saving}
          isEditing={!!editingTask}
        />
      )}
    </div>
  )
}