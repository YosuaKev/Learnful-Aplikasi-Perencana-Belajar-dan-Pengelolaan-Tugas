import React, { useState, useEffect, useCallback, useRef } from 'react'
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Calendar as CalendarIcon,
  Clock,
  BookOpen,
  CheckSquare,
  Coffee,
  Users,
  Target,
  Filter,
  MoreVertical,
  MapPin,
  Bell,
  Video,
  Edit,
  Trash2,
  Save,
  X
} from 'lucide-react'

import { supabase, isSupabaseConfigured } from '../services/supabaseClient.js'

// Mock data fallback
const mockCalendarData = {
  events: [],
  goals: []
}

// Demo categories
const demoCategories = [
  { id: '1', name: 'Work', color: '#3B82F6' },
  { id: '2', name: 'Personal', color: '#10B981' },
  { id: '3', name: 'Learning', color: '#8B5CF6' },
  { id: '4', name: 'Health', color: '#EF4444' },
  { id: '5', name: 'Finance', color: '#F59E0B' },
  { id: '6', name: 'Shopping', color: '#EC4899' }
]

// Event Modal Component
const EventModal = ({ event, onSave, onClose, onDelete, isEditing = [] }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_time: '',
    end_time: '',
    all_day: false,
    event_type: 'personal',
    reminders: [],
    recurring: false
  })

  const [saving, setSaving] = useState(false)

  const startInputRef = useRef(null)
  const endInputRef = useRef(null)

  // Initialize form when event changes
  useEffect(() => {
    if (event && isEditing) {
      setFormData({
        title: event.title || '',
        description: event.description || '',
        start_time: event.start_time ? event.start_time.split('T')[0] + 'T' + event.start_time.split('T')[1].substring(0, 5) : '',
        end_time: event.end_time ? event.end_time.split('T')[0] + 'T' + event.end_time.split('T')[1].substring(0, 5) : '',
        all_day: event.all_day || false,
        event_type: event.event_type || 'personal',
        reminders: event.reminders || [],
        recurring: event.recurring || false
      })
    } else if (event && !isEditing) {
      // For new event with pre-filled date
      setFormData(prev => ({
        ...prev,
        start_time: event.start_time || '',
        end_time: event.end_time || ''
      }))
    }
  }, [event, isEditing])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.title.trim()) {
      alert('Event title is required')
      return
    }

    setSaving(true)
    try {
      // Keep the relevant fields (category_id, goal_id, location) in payload so
      // they are saved when provided. The parent `onSave` will handle DB vs demo.
      const payload = { ...formData }
      await onSave(payload)
      onClose()
    } catch (error) {
      console.error('Error saving event:', error)
      alert('Failed to save event. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const addReminder = () => {
    setFormData(prev => ({
      ...prev,
      reminders: [...prev.reminders, '30 minutes before']
    }))
  }

  const removeReminder = (index) => {
    setFormData(prev => ({
      ...prev,
      reminders: prev.reminders.filter((_, i) => i !== index)
    }))
  }

  const updateReminder = (index, value) => {
    setFormData(prev => ({
      ...prev,
      reminders: prev.reminders.map((reminder, i) => i === index ? value : reminder)
    }))
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Swipe indicator for mobile */}
        <div className="sm:hidden flex justify-center py-2">
          <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
        </div>
        
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
              {isEditing ? 'Edit Event' : 'Create Event'}
            </h2>
            <button 
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Event Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 sm:px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-sm sm:text-base"
              placeholder="Enter event title"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full px-3 sm:px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-sm sm:text-base"
              placeholder="Enter event description"
            />
          </div>

          {/* Date and Time */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Start Date & Time *
                      </label>
                      <div className="relative">
                        <input
                          ref={startInputRef}
                          type="datetime-local"
                          required
                          value={formData.start_time}
                          onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                          className="w-full pr-10 px-3 sm:px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-white text-sm sm:text-base"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const el = startInputRef.current
                            if (el) {
                              if (el.showPicker) el.showPicker()
                              else el.focus()
                            }
                          }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-indigo-500 rounded text-white"
                          aria-label="Open start date picker"
                        >
                          <CalendarIcon className="w-4 h-4 text-white" />
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        End Date & Time *
                      </label>
                      <div className="relative">
                        <input
                          ref={endInputRef}
                          type="datetime-local"
                          required
                          value={formData.end_time}
                          onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                          className="w-full pr-10 px-3 sm:px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-white text-sm sm:text-base"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const el = endInputRef.current
                            if (el) {
                              if (el.showPicker) el.showPicker()
                              else el.focus()
                            }
                          }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-indigo-500 rounded text-white"
                          aria-label="Open end date picker"
                        >
                          <CalendarIcon className="w-4 h-4 text-white" />
                        </button>
                      </div>
                    </div>
                  </div>

          {/* Event Type and Category */}
          <div className="grid grid-cols-1 sm:grid-cols-1 gap-3 sm:gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Event Type
              </label>
              <select
                value={formData.event_type}
                onChange={(e) => setFormData(prev => ({ ...prev, event_type: e.target.value }))}
                className="w-full px-3 sm:px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-white text-sm sm:text-base"
              >
                <option value="study">Study</option>
                <option value="work">Work</option>
                <option value="learning">Learning</option>
                <option value="health">Health</option>
                <option value="personal">Personal</option>
                <option value="task">Task</option>
                <option value="planning">Planning</option>
              </select>
            </div>
          </div>
     
          {/* Reminders */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Reminders
              </label>
              <button
                type="button"
                onClick={addReminder}
                className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
              >
                + Add Reminder
              </button>
            </div>
            <div className="space-y-2">
              {formData.reminders.map((reminder, index) => (
                <div key={index} className="flex gap-2">
                  <select
                    value={reminder}
                    onChange={(e) => updateReminder(index, e.target.value)}
                    className="flex-1 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-white text-sm"
                  >
                    <option value="5 minutes before">5 minutes before</option>
                    <option value="15 minutes before">15 minutes before</option>
                    <option value="30 minutes before">30 minutes before</option>
                    <option value="1 hour before">1 hour before</option>
                    <option value="1 day before">1 day before</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => removeReminder(index)}
                    className="px-3 py-2 text-rose-500 hover:text-rose-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 sm:gap-3 pt-4 border-t border-gray-200 dark:border-gray-700 sticky bottom-0 bg-white dark:bg-gray-800 pb-2">
            {isEditing && (
              <button
                type="button"
                onClick={() => onDelete(event.id)}
                className="px-3 sm:px-4 py-2 bg-rose-500 text-white rounded-lg sm:rounded-xl hover:bg-rose-600 transition-colors flex items-center gap-2 text-sm sm:text-base"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">Delete</span>
              </button>
            )}
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

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState('month')
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [showEventModal, setShowEventModal] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [events, setEvents] = useState([])
  const [categories, setCategories] = useState([])
  const [goals, setGoals] = useState([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [showFilters, setShowFilters] = useState(false)
  const [activeFilters, setActiveFilters] = useState({
    study: true,
    work: true,
    learning: true,
    health: true,
    personal: true,
    task: true,
    planning: true
  })

  // Check user authentication
  useEffect(() => {
    // Inline auth check to avoid missing dependency warnings from ESLint
    (async () => {
      // If offline, skip Supabase auth checks and use demo mode
      if (!navigator.onLine) {
        setUser(null)
        return
      }

      if (isSupabaseConfigured && supabase?.auth) {
        const { data: { session } } = await supabase.auth.getSession()
        setUser(session?.user || null)
        
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            setUser(session?.user || null)
            if (event === 'SIGNED_IN') {
              if (navigator.onLine) {
                await loadEvents()
                await loadCategories()
                await loadGoals()
              }
            }
          }
        )

        return () => subscription.unsubscribe()
      }
    })()
  }, [])

  // Load data
  const loadEvents = useCallback(async () => {
    setLoading(true)
    try {
      if (isSupabaseConfigured && user && navigator.onLine) {
        const { data, error } = await supabase
          .from('calendar_events')
          .select(`
            *,
            categories:category_id (
              name,
              color
            ),
            learning_goals:goal_id (
              title,
              color
            )
          `)
          .eq('user_id', user.id)
          .order('start_time', { ascending: true })

        if (error) throw error
        setEvents(data || [])
      } else {
        // Fallback to localStorage for demo
        const savedEvents = localStorage.getItem('calendar_events')
        setEvents(savedEvents ? JSON.parse(savedEvents) : [])
      }
    } catch (err) {
      console.error('Error loading events:', err)
      const savedEvents = localStorage.getItem('calendar_events')
      setEvents(savedEvents ? JSON.parse(savedEvents) : [])
    } finally {
      setLoading(false)
    }
  }, [user])

  const loadCategories = useCallback(async () => {
    // If offline, use demo categories immediately and avoid network calls
    if (!navigator.onLine) {
      setCategories(demoCategories)
      return
    }
    try {
      if (isSupabaseConfigured && user && navigator.onLine) {
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .eq('user_id', user.id)

        if (error) throw error
        setCategories(data || [])
      } else {
        setCategories(demoCategories)
      }
    } catch (err) {
      if (!navigator.onLine) {
        // Likely network disconnected mid-request — fall back quietly
        setCategories(demoCategories)
        return
      }
      console.error('Error loading categories:', err)
      setCategories(demoCategories)
    }
  }, [user])

  const loadGoals = useCallback(async () => {
    // Bail out early if offline
    if (!navigator.onLine) {
      setGoals([])
      return
    }
    try {
      if (isSupabaseConfigured && user && navigator.onLine) {
        const { data, error } = await supabase
          .from('learning_goals')
          .select('*')
          .eq('user_id', user.id)

        if (error) throw error
        setGoals(data || [])
      } else {
        setGoals([])
      }
    } catch (err) {
      if (!navigator.onLine) {
        setGoals([])
        return
      }
      console.error('Error loading goals:', err)
      setGoals([])
    }
  }, [user])

  // Load data when user changes
  useEffect(() => {
    if (user !== null) {
      loadEvents()
      loadCategories()
      loadGoals()
    }
    // loadEvents/loadCategories/loadGoals are stable via useCallback
  }, [user, loadEvents, loadCategories, loadGoals])

  // Create calendar_events table if not exists (for demo)
  useEffect(() => {
    const initializeDemoData = () => {
      const existingEvents = localStorage.getItem('calendar_events')
      if (!existingEvents) {
        localStorage.setItem('calendar_events', JSON.stringify(mockCalendarData.events))
      }
    }
    
    if (!user) {
      initializeDemoData()
    }
  }, [user])

  // Event CRUD operations
  const createEvent = async (eventData) => {
    try {
      if (isSupabaseConfigured && user && navigator.onLine) {
        const payload = {
          user_id: user.id,
          title: eventData.title,
          description: eventData.description,
          start_time: eventData.start_time,
          end_time: eventData.end_time,
          all_day: eventData.all_day,
          event_type: eventData.event_type,
          reminders: eventData.reminders,
          recurring: eventData.recurring
        }

        const { data, error } = await supabase
          .from('calendar_events')
          .insert([payload])
          .select(`
            *,
            categories:category_id (
              name,
              color
            ),
            learning_goals:goal_id (
              title,
              color
            )
          `)
          .single()

        if (error) throw error
        setEvents(prev => [...prev, data])
        return data
      } else {
        // Demo mode
        const newEvent = {
          id: Date.now().toString(),
          ...eventData,
          categories: categories.find(c => c.id === eventData.category_id) || null,
          learning_goals: goals.find(g => g.id === eventData.goal_id) || null,
          _localOnly: true
        }

        const updatedEvents = [...events, newEvent]
        setEvents(updatedEvents)
        localStorage.setItem('calendar_events', JSON.stringify(updatedEvents))
        return newEvent
      }
    } catch (err) {
      console.error('Error creating event:', err)
      throw err
    }
  }

  const updateEvent = async (eventId, eventData) => {
    try {
      if (isSupabaseConfigured && user && navigator.onLine) {
        const { data, error } = await supabase
          .from('calendar_events')
          .update({
            title: eventData.title,
            description: eventData.description,
            start_time: eventData.start_time,
            end_time: eventData.end_time,
            all_day: eventData.all_day,
            event_type: eventData.event_type,
            reminders: eventData.reminders,
            recurring: eventData.recurring
          })
          .eq('id', eventId)
          .eq('user_id', user.id)
          .select(`
            *,
            categories:category_id (
              name,
              color
            ),
            learning_goals:goal_id (
              title,
              color
            )
          `)
          .single()

        if (error) throw error
        setEvents(prev => prev.map(e => e.id === eventId ? data : e))
        return data
      } else {
        // Demo mode
        const updatedEvent = {
          ...events.find(e => e.id === eventId),
          ...eventData,
          categories: categories.find(c => c.id === eventData.category_id) || null,
          learning_goals: goals.find(g => g.id === eventData.goal_id) || null
        }

        const updatedEvents = events.map(e => e.id === eventId ? updatedEvent : e)
        setEvents(updatedEvents)
        localStorage.setItem('calendar_events', JSON.stringify(updatedEvents))
        return updatedEvent
      }
    } catch (err) {
      console.error('Error updating event:', err)
      throw err
    }
  }

  const deleteEvent = async (eventId) => {
    if (!confirm('Are you sure you want to delete this event?')) return

    try {
      if (isSupabaseConfigured && user && navigator.onLine) {
        const { error } = await supabase
          .from('calendar_events')
          .delete()
          .eq('id', eventId)
          .eq('user_id', user.id)

        if (error) throw error
      }

      const updatedEvents = events.filter(e => e.id !== eventId)
      setEvents(updatedEvents)
      localStorage.setItem('calendar_events', JSON.stringify(updatedEvents))
    } catch (err) {
      console.error('Error deleting event:', err)
      alert('Failed to delete event. Please try again.')
    }
  }

  // Navigation functions
  const goToPrevious = () => {
    const newDate = new Date(currentDate)
    if (view === 'month') {
      newDate.setMonth(newDate.getMonth() - 1)
    } else if (view === 'week') {
      newDate.setDate(newDate.getDate() - 7)
    } else {
      newDate.setDate(newDate.getDate() - 1)
    }
    setCurrentDate(newDate)
  }

  const goToNext = () => {
    const newDate = new Date(currentDate)
    if (view === 'month') {
      newDate.setMonth(newDate.getMonth() + 1)
    } else if (view === 'week') {
      newDate.setDate(newDate.getDate() + 7)
    } else {
      newDate.setDate(newDate.getDate() + 1)
    }
    setCurrentDate(newDate)
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  // Event handlers
  const handleCreateEvent = (date = null) => {
    let start_time = ''
    let end_time = ''

    if (date) {
      const startDate = new Date(date)
      startDate.setHours(9, 0, 0, 0) // Set default time to 9:00 AM
      const endDate = new Date(startDate)
      endDate.setHours(10, 0, 0, 0) // Set default end time to 10:00 AM
      
      start_time = startDate.toISOString().slice(0, 16)
      end_time = endDate.toISOString().slice(0, 16)
    }

    setSelectedEvent({ start_time, end_time })
    setIsEditing(false)
    setShowEventModal(true)
  }

  const handleEditEvent = (event) => {
    setSelectedEvent(event)
    setIsEditing(true)
    setShowEventModal(true)
  }

  const handleSaveEvent = async (eventData) => {
    if (isEditing) {
      await updateEvent(selectedEvent.id, eventData)
    } else {
      await createEvent(eventData)
    }
  }

  const handleDeleteEvent = async (eventId) => {
    await deleteEvent(eventId)
    setShowEventModal(false)
    setSelectedEvent(null)
  }

  // Filter functions
  const toggleFilter = (filterType) => {
    setActiveFilters(prev => ({
      ...prev,
      [filterType]: !prev[filterType]
    }))
  }

  const getEventsForDate = (date) => {
    return events.filter(event => {
      const eventDate = new Date(event.start_time)
      const isSameDay = eventDate.toDateString() === date.toDateString()
      return isSameDay && activeFilters[event.event_type]
    })
  }

  const getEventColor = (eventType) => {
    const colors = {
      study: 'bg-indigo-500 border-indigo-200 dark:border-indigo-800',
      work: 'bg-blue-500 border-blue-200 dark:border-blue-800',
      learning: 'bg-emerald-500 border-emerald-200 dark:border-emerald-800',
      health: 'bg-rose-500 border-rose-200 dark:border-rose-800',
      personal: 'bg-cyan-500 border-cyan-200 dark:border-cyan-800',
      task: 'bg-amber-500 border-amber-200 dark:border-amber-800',
      planning: 'bg-purple-500 border-purple-200 dark:border-purple-800'
    }
    return colors[eventType] || colors.personal
  }

  const getEventIcon = (eventType) => {
    const icons = {
      study: BookOpen,
      work: Users,
      learning: Target,
      health: Coffee,
      personal: CalendarIcon,
      task: CheckSquare,
      planning: Clock
    }
    return icons[eventType] || CalendarIcon
  }

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    })
  }

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    })
  }

  const isToday = (date) => {
    return date.toDateString() === new Date().toDateString()
  }

  // Calendar generation functions
  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const generateMonthView = () => {
    const daysInMonth = getDaysInMonth(currentDate)
    const firstDay = getFirstDayOfMonth(currentDate)
    const days = []

    // Previous month days
    const prevMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    const daysInPrevMonth = getDaysInMonth(prevMonth)
    for (let i = daysInPrevMonth - firstDay + 1; i <= daysInPrevMonth; i++) {
      const date = new Date(prevMonth.getFullYear(), prevMonth.getMonth(), i)
      days.push({ date, isCurrentMonth: false, events: getEventsForDate(date) })
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), i)
      days.push({ date, isCurrentMonth: true, events: getEventsForDate(date) })
    }

    // Next month days
    const totalCells = 42
    const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    for (let i = 1; days.length < totalCells; i++) {
      const date = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), i)
      days.push({ date, isCurrentMonth: false, events: getEventsForDate(date) })
    }

    return days
  }

  // Event Badge Component
  const EventBadge = ({ event, compact = false }) => {
    const IconComponent = getEventIcon(event.event_type)
    
    if (compact) {
      return (
        <div 
          className={`${getEventColor(event.event_type)} text-white text-xs px-1 py-0.5 rounded truncate cursor-pointer hover:opacity-80 transition-opacity`}
          title={event.title}
          onClick={(e) => {
            e.stopPropagation()
            handleEditEvent(event)
          }}
        >
          {event.title}
        </div>
      )
    }

    return (
      <div 
        className={`${getEventColor(event.event_type)} text-white p-2 rounded-lg border shadow-sm hover:shadow-md transition-all cursor-pointer group`}
        onClick={(e) => {
          e.stopPropagation()
          handleEditEvent(event)
        }}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <IconComponent className={`w-3 h-3 shrink-0 ${IconComponent === CalendarIcon ? 'text-white' : ''}`} />
              <h4 className="font-medium text-sm truncate">{event.title}</h4>
            </div>
            <div className="flex items-center gap-1 text-xs opacity-90">
              <Clock className="w-3 h-3" />
              <span>
                {formatTime(event.start_time)} - {formatTime(event.end_time)}
              </span>
            </div>
          </div>
          <MoreVertical className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
        </div>
      </div>
    )
  }

  // Month View Component
  const MonthView = () => {
    const days = generateMonthView()
    const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'] // Shortened for mobile

    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-600">
          {weekDays.map((day, idx) => (
            <div key={`wd-${idx}-${day}`} className="p-2 sm:p-3 text-center text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {days.map((day, index) => (
            <div
              key={index}
              className={`min-h-20 sm:min-h-[100px] border-r border-b border-gray-100 dark:border-gray-700 p-1 sm:p-2 transition-colors cursor-pointer ${
                !day.isCurrentMonth ? 'bg-gray-50 dark:bg-gray-900 text-gray-400' : ''
              } ${
                isToday(day.date) ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' : ''
              } hover:bg-gray-50 dark:hover:bg-gray-700`}
              onClick={() => handleCreateEvent(day.date)}
            >
              <div className="flex justify-between items-start mb-1">
                <span className={`text-xs sm:text-sm font-medium ${
                  isToday(day.date) 
                    ? 'bg-blue-500 text-white w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-xs'
                    : 'text-gray-900 dark:text-white'
                }`}>
                  {day.date.getDate()}
                </span>
                <button 
                  onClick={(e) => {
                    e.stopPropagation()
                    handleCreateEvent(day.date)
                  }}
                  className="text-gray-400 hover:text-indigo-500 transition-colors text-xs"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>

              <div className="space-y-0.5 sm:space-y-1">
                {day.events.slice(0, 2).map(event => ( // Show fewer events on mobile
                  <EventBadge key={event.id} event={event} compact={true} />
                ))}
                {day.events.length > 2 && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 px-1">
                    +{day.events.length - 2} more
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Filter Panel Component
  const FilterPanel = () => {
    if (!showFilters) return null

    const eventTypes = [
      { key: 'study', label: 'Study', icon: BookOpen, color: 'bg-indigo-500' },
      { key: 'work', label: 'Work', icon: Users, color: 'bg-blue-500' },
      { key: 'learning', label: 'Learning', icon: Target, color: 'bg-emerald-500' },
      { key: 'health', label: 'Health', icon: Coffee, color: 'bg-rose-500' },
      { key: 'personal', label: 'Personal', icon: CalendarIcon, color: 'bg-cyan-500' },
      { key: 'task', label: 'Task', icon: CheckSquare, color: 'bg-amber-500' },
      { key: 'planning', label: 'Planning', icon: Clock, color: 'bg-purple-500' }
    ]

    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100 dark:border-gray-700 mb-4 sm:mb-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4 text-sm sm:text-base">Filter Events</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 sm:gap-3">
          {eventTypes.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.key}
                onClick={() => toggleFilter(item.key)}
                className={`flex flex-col items-center gap-1 sm:gap-2 p-2 sm:p-3 rounded-lg sm:rounded-xl border transition-all ${
                  activeFilters[item.key]
                    ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800'
                    : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
                }`}
              >
                <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center ${item.color} text-white`}>
                  {Icon ? React.createElement(Icon, { className: `w-3 h-3 sm:w-4 sm:h-4 ${Icon === CalendarIcon ? 'text-white' : ''}` }) : null}
                </div>
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  {item.label}
                </span>
              </button>
            )
          })}
        </div>
        <div className="flex justify-between items-center mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200 dark:border-gray-600">
          <button
            onClick={() => {
              setActiveFilters({
                study: true,
                work: true,
                learning: true,
                health: true,
                personal: true,
                task: true,
                planning: true
              })
            }}
            className="text-xs sm:text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
          >
            Select All
          </button>
          <button
            onClick={() => {
              setActiveFilters({
                study: false,
                work: false,
                learning: false,
                health: false,
                personal: false,
                task: false,
                planning: false
              })
            }}
            className="text-xs sm:text-sm text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300"
          >
            Clear All
          </button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4 z-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-indigo-600 mx-auto mb-3 sm:mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">Loading calendar...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-transparent sm:bg-gray-50 dark:bg-gray-900 p-3 sm:p-4 md:p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Calendar Schedule
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
              Manage your tasks and learning timeline
            </p>
            {!user && isSupabaseConfigured && (
              <p className="text-amber-600 dark:text-amber-400 text-xs sm:text-sm mt-1">
                Demo mode - Data saved locally
              </p>
            )}
          </div>
          
          <button 
            onClick={() => handleCreateEvent()}
            className="bg-linear-to-r from-indigo-500 to-purple-600 text-white px-4 py-2.5 rounded-xl font-medium hover:shadow-lg transition-all duration-300 flex items-center gap-2 self-end sm:self-auto text-sm"
          >
            <CalendarIcon className="w-4 h-4 text-white" />
            <span className="hidden sm:inline">New Event</span>
            <span className="sm:hidden">Event</span>
          </button>
        </div>

        {/* Calendar Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <button 
                onClick={goToPrevious} 
                className="p-1.5 sm:p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg sm:rounded-xl hover:shadow-md transition-all text-gray-700 dark:text-gray-300"
              >
                <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <button 
                onClick={goToToday} 
                className="px-3 py-1.5 sm:px-4 sm:py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg sm:rounded-xl hover:shadow-md transition-all font-medium text-gray-700 dark:text-gray-300 text-sm"
              >
                Today
              </button>
              <button 
                onClick={goToNext} 
                className="p-1.5 sm:p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg sm:rounded-xl hover:shadow-md transition-all text-gray-700 dark:text-gray-300"
              >
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white ml-2">
              {formatDate(currentDate)}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg sm:rounded-xl p-0.5">
              <button
                onClick={() => setView('month')}
                className={`px-2 sm:px-3 py-1.5 rounded-md font-medium transition-all duration-300 text-xs sm:text-sm ${
                  view === 'month'
                    ? 'bg-indigo-500 text-white shadow-md'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <span className="hidden sm:inline">Month</span>
                <span className="sm:hidden">M</span>
              </button>
            </div>

            <button 
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg sm:rounded-xl hover:shadow-md transition-all text-gray-700 dark:text-gray-300 text-sm"
            >
              <Filter className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Filters</span>
              {Object.values(activeFilters).filter(Boolean).length < 7 && (
                <span className="bg-indigo-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  {Object.values(activeFilters).filter(Boolean).length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Filter Panel */}
        <FilterPanel />

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-3 sm:p-4 text-center">
            <div className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {events.filter(e => new Date(e.start_time).toDateString() === new Date().toDateString()).length}
            </div>
            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Today</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-3 sm:p-4 text-center">
            <div className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {events.filter(e => e.event_type === 'study' && activeFilters.study).length}
            </div>
            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Study</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-3 sm:p-4 text-center">
            <div className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {events.filter(e => e.event_type === 'work' && activeFilters.work).length}
            </div>
            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Work</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-3 sm:p-4 text-center">
            <div className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {events.filter(e => e.recurring).length}
            </div>
            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Recurring</div>
          </div>
        </div>
      </div>

      {/* Calendar View */}
      <div className="mb-6 sm:mb-8">
        {view === 'month' && <MonthView />}
        {view !== 'month' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-center">
            <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
              {view} view coming soon...
            </p>
          </div>
        )}
      </div>

      {/* Event Modal */}
      {showEventModal && (
        <EventModal
          event={selectedEvent}
          onSave={handleSaveEvent}
          onClose={() => {
            setShowEventModal(false)
            setSelectedEvent(null)
          }}
          onDelete={handleDeleteEvent}
          categories={categories}
          goals={goals}
          isEditing={isEditing}
        />
      )}

      {/* Legend */}
      <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4 text-sm sm:text-base">Event Types</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {[
            { type: 'study', label: 'Study', icon: BookOpen },
            { type: 'work', label: 'Work', icon: Users },
            { type: 'learning', label: 'Learning', icon: Target },
            { type: 'health', label: 'Health', icon: Coffee },
            { type: 'personal', label: 'Personal', icon: CalendarIcon },
            { type: 'task', label: 'Task', icon: CheckSquare },
            { type: 'planning', label: 'Planning', icon: Clock }
          ].map(item => (
            <div key={item.type} className="flex items-center gap-2 sm:gap-3">
              <div className={`w-3 h-3 sm:w-4 sm:h-4 rounded ${getEventColor(item.type)}`}></div>
              <item.icon className={`w-3 h-3 sm:w-4 sm:h-4 ${item.icon === CalendarIcon ? 'text-white' : 'text-gray-400'}`} />
              <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}