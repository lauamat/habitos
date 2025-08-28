import { createClient } from '@supabase/supabase-js'

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing required environment variables. Please check your .env file.')
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
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

// Auth helper functions
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) {
    console.error('Error getting user:', error)
    return null
  }
  return user
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) {
    console.error('Error signing out:', error)
    throw error
  }
}

// Database helper functions
export async function getOrCreateProfile(userId: string, email: string) {
  // First try to get existing profile
  const { data: existingProfile, error: fetchError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()

  if (fetchError) {
    console.error('Error fetching profile:', fetchError)
    throw fetchError
  }

  if (existingProfile) {
    return existingProfile
  }

  // Create new profile if it doesn't exist
  const { data, error } = await supabase
    .from('profiles')
    .insert({
      id: userId,
      email: email,
      full_name: email.split('@')[0], // Default name from email
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating profile:', error)
    throw error
  }

  return data
}