// src/lib/supabase.ts
import { createClient, type Session, type User } from '@supabase/supabase-js'

// Env vars
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing required environment variables. Please check your .env file.')
}

// --- Supabase client con sesión persistente entre pestañas ---
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    // muy importante para evitar perder la sesión al cambiar de pestaña
    storage: localStorage,
  },
})

// =========================
// Helpers de autenticación
// =========================

/** Obtiene la sesión actual; si no hay sesión, devuelve null sin lanzar error. */
export async function getCurrentSession(): Promise<Session | null> {
  const { data, error } = await supabase.auth.getSession()
  if (error && error.message !== 'Auth session missing') {
    console.error('Error getting session:', error)
  }
  return data?.session ?? null
}

/** Obtiene el usuario actual; si no hay sesión devuelve null sin lanzar error. */
export async function getCurrentUser(): Promise<User | null> {
  const session = await getCurrentSession()
  return session?.user ?? null
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) {
    console.error('Error signing out:', error)
    throw error
  }
}

// =========================
// Tipos de base de datos
// =========================

export interface Profile {
  id: string
  email: string | null
  full_name: string | null
  avatar_url: string | null
  timezone: string
  created_at: string
  updated_at: string
}

export interface Habit {
  id: string
  user_id: string
  name: string
  description: string | null
  motivation: string | null
  frequency_type: 'daily' | 'alternate' | 'custom'
  custom_days: string[] | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface HabitCompletion {
  id: string
  habit_id: string
  user_id: string
  completion_date: string
  completed_at: string
  notes: string | null
}

export interface MotivationalQuote {
  id: string
  quote: string
  author: string | null
  category: string | null
  situation: 'struggling' | 'succeeding' | 'starting' | 'maintaining' | 'general'
  is_active: boolean
  created_at: string
}

export interface UserShareSettings {
  id: string
  user_id: string
  share_token: string
  is_public: boolean
  share_name: string | null
  created_at: string
  updated_at: string
}

// =========================
// DB helpers
// =========================

/**
 * Devuelve el perfil si existe; si no, lo crea de forma segura.
 * (Si ya has puesto el trigger de creación automática, esto simplemente leerá).
 */
export async function getOrCreateProfile(userId: string, email: string) {
  // 1) intentar leer
  const { data: existing, error: fetchError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()

  if (fetchError) {
    console.error('Error fetching profile:', fetchError)
    throw fetchError
  }
  if (existing) return existing

  // 2) crear si no existe (idempotente si ya hay trigger)
  const { data, error } = await supabase
    .from('profiles')
    .insert({
      id: userId,
      email,
      full_name: email.split('@')[0],
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating profile:', error)
    throw error
  }
  return data
}
