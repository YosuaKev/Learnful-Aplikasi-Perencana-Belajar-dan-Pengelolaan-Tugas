import { supabase, isSupabaseConfigured } from './supabaseClient'

const STORAGE_KEY = 'study_sessions'

async function getByGoalId(goalId) {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('study_sessions')
      .select('*')
      .eq('goal_id', goalId)
      .order('session_date', { ascending: false })
    if (error) throw error
    return data || []
  }

  const raw = localStorage.getItem(STORAGE_KEY)
  const list = raw ? JSON.parse(raw) : []
  return list.filter(s => s.goal_id.toString() === goalId.toString())
}

async function create(sessionData) {
  // sessionData expected: { goalId, duration, notes, efficiency, date }
  if (isSupabaseConfigured) {
    // include current user's id if available to satisfy NOT NULL constraint
    let userId = null
    try {
      const { data: { user } } = await supabase.auth.getUser()
      userId = user?.id || null
    } catch (e) {
      // ignore - we'll try to insert without user id and let Supabase error if required
      console.warn('Could not get supabase user for session insert', e)
    }

    const payload = {
      goal_id: sessionData.goalId,
      duration: sessionData.duration,
      notes: sessionData.notes,
      efficiency: sessionData.efficiency,
      session_date: sessionData.date || new Date().toISOString(),
      user_id: sessionData.userId || sessionData.user_id || userId
    }
    const { data, error } = await supabase
      .from('study_sessions')
      .insert([payload])
      .select()
      .single()
    if (error) throw error
    return data
  }

  const raw = localStorage.getItem(STORAGE_KEY)
  const list = raw ? JSON.parse(raw) : []
  const newSession = {
    id: Date.now().toString(),
    goal_id: sessionData.goalId,
    duration: sessionData.duration,
    notes: sessionData.notes,
    efficiency: sessionData.efficiency || 0,
    session_date: sessionData.date || new Date().toISOString(),
    _localOnly: true
  }
  const updated = [newSession, ...list]
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  return newSession
}

export default {
  getByGoalId,
  create
}
