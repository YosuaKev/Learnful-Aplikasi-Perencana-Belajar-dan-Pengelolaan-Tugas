import { supabase, isSupabaseConfigured } from './supabaseClient'

const STORAGE_KEY = 'learning_goals'

async function getById(id) {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('learning_goals')
      .select('*')
      .eq('id', id)
      .single()
    if (error) throw error
    return data
  }

  const raw = localStorage.getItem(STORAGE_KEY)
  const list = raw ? JSON.parse(raw) : []
  return list.find(g => g.id.toString() === id.toString()) || null
}

async function update(id, payload) {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('learning_goals')
      .update(payload)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  }

  const raw = localStorage.getItem(STORAGE_KEY)
  const list = raw ? JSON.parse(raw) : []
  const updated = list.map(g => g.id.toString() === id.toString() ? { ...g, ...payload } : g)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  return updated.find(g => g.id.toString() === id.toString())
}

async function deleteGoal(id) {
  if (isSupabaseConfigured) {
    // delete related sessions first
    await supabase.from('study_sessions').delete().eq('goal_id', id)
    const { error } = await supabase.from('learning_goals').delete().eq('id', id)
    if (error) throw error
    return true
  }

  const raw = localStorage.getItem(STORAGE_KEY)
  const list = raw ? JSON.parse(raw) : []
  const remaining = list.filter(g => g.id.toString() !== id.toString())
  localStorage.setItem(STORAGE_KEY, JSON.stringify(remaining))
  // also remove sessions
  const sessionsRaw = localStorage.getItem('study_sessions')
  if (sessionsRaw) {
    const sessions = JSON.parse(sessionsRaw).filter(s => s.goal_id.toString() !== id.toString())
    localStorage.setItem('study_sessions', JSON.stringify(sessions))
  }
  return true
}

async function updateProgress(id, minutesToAdd = 0) {
  if (isSupabaseConfigured) {
    // increment current_progress
    const { data: existing, error: fetchErr } = await supabase
      .from('learning_goals')
      .select('current_progress')
      .eq('id', id)
      .single()
    if (fetchErr) throw fetchErr
    const newProgress = (existing.current_progress || 0) + minutesToAdd
    const { data, error } = await supabase
      .from('learning_goals')
      .update({ current_progress: newProgress })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  }

  const raw = localStorage.getItem(STORAGE_KEY)
  const list = raw ? JSON.parse(raw) : []
  const updated = list.map(g => {
    if (g.id.toString() === id.toString()) {
      const next = { ...g, current_progress: (g.current_progress || 0) + minutesToAdd }
      return next
    }
    return g
  })
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  return updated.find(g => g.id.toString() === id.toString())
}

export default {
  getById,
  update,
  delete: deleteGoal,
  updateProgress
}
