// services/taskService.js
import { supabase, isSupabaseConfigured } from './supabaseClient.js'

export const taskService = {
  // Get all tasks dengan relasi
  async getTasks(userId) {
    if (!isSupabaseConfigured || !userId) {
      throw new Error('Not authenticated or Supabase not configured')
    }

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
          is_completed,
          created_at
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  },

  // Get single task by ID
  async getById(taskId, userId) {
    if (!isSupabaseConfigured || !userId) {
      throw new Error('Not authenticated or Supabase not configured')
    }

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
          is_completed,
          created_at
        )
      `)
      .eq('id', taskId)
      .eq('user_id', userId)
      .single()

    if (error) throw error
    return data
  },

  // Create task
  async create(taskData, userId) {
    if (!isSupabaseConfigured || !userId) {
      throw new Error('Not authenticated or Supabase not configured')
    }

    const payload = {
      user_id: userId,
      title: taskData.title.trim(),
      description: taskData.description?.trim() || null,
      category_id: taskData.category || null,
      priority: taskData.priority,
      status: taskData.status,
      due_date: taskData.due_date || null,
      estimated_duration: taskData.estimated_duration || 120
    }

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
      .single()

    if (error) throw error
    return data
  },

  // Update task
  async update(taskId, taskData, userId) {
    if (!isSupabaseConfigured || !userId) {
      throw new Error('Not authenticated or Supabase not configured')
    }

    const updateData = {
      title: taskData.title,
      description: taskData.description,
      category_id: taskData.category || null,
      priority: taskData.priority,
      status: taskData.status,
      due_date: taskData.due_date || null,
      estimated_duration: taskData.estimated_duration,
      completed_at: taskData.status === 'done' ? new Date().toISOString() : null
    }

    const { data, error } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', taskId)
      .eq('user_id', userId)
      .select(`
        *,
        categories (
          id,
          name,
          color
        )
      `)
      .single()

    if (error) throw error
    return data
  },

  // Delete task
  async delete(taskId, userId) {
    if (!isSupabaseConfigured || !userId) {
      throw new Error('Not authenticated or Supabase not configured')
    }

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId)
      .eq('user_id', userId)

    if (error) throw error
  },

  // Update subtask
  async updateSubtask(subtaskId, updateData) {
    const { data, error } = await supabase
      .from('subtasks')
      .update(updateData)
      .eq('id', subtaskId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Create subtask
  async createSubtask(taskId, subtaskData) {
    const { data, error } = await supabase
      .from('subtasks')
      .insert([{
        task_id: taskId,
        title: subtaskData.title.trim(),
        is_completed: false
      }])
      .select()
      .single()

    if (error) throw error
    return data
  }
}

export default taskService