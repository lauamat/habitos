import React, { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { LanguageProvider, useLanguage } from '@/contexts/LanguageContext'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { AuthForm } from '@/components/auth/AuthForm'
import { HabitForm } from '@/components/habits/HabitForm'
import { HabitCard } from '@/components/habits/HabitCard'
import { EditHabitModal } from '@/components/habits/EditHabitModal'
import { WeeklyCalendar } from '@/components/calendar/WeeklyCalendar'
import { MonthlyCalendar } from '@/components/calendar/MonthlyCalendar'
import { EnhancedAnalyticsDashboard } from '@/components/analytics/EnhancedAnalyticsDashboard'
import { Settings } from '@/components/settings/Settings'
import { SharingSettings } from '@/components/sharing/SharingSettings'
import { ProfileSettings } from '@/components/profile/ProfileSettings'
import { SharedHabitsPage } from '@/components/shared/SharedHabitsPage'
import { supabase, Habit, HabitCompletion, UserShareSettings } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Plus, 
  LogOut, 
  Home, 
  Calendar, 
  BarChart3, 
  Share2, 
  Settings as SettingsIcon,
  User,
  Loader2,
  CheckCircle2,
  Target,
  Heart,
  Palette,
  Globe
} from 'lucide-react'
import { format } from 'date-fns'

function HabitTrackerApp() {
  const { user, profile, signOut, loading: authLoading } = useAuth()
  const { t } = useLanguage()
  const [habits, setHabits] = useState<Habit[]>([])
  const [completions, setCompletions] = useState<HabitCompletion[]>([])
  const [shareSettings, setShareSettings] = useState<UserShareSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [showHabitForm, setShowHabitForm] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [activeTab, setActiveTab] = useState('today')
  const [error, setError] = useState('')
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)

  useEffect(() => {
    if (user) {
      loadHabitsAndCompletions()
      loadShareSettings()
    } else {
      setHabits([])
      setCompletions([])
      setShareSettings(null)
      setLoading(false)
    }
  }, [user])

  const loadHabitsAndCompletions = async () => {
    if (!user) return
    
    setLoading(true)
    setError('')
    
    try {
      // Load habits
      const { data: habitsData, error: habitsError } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
      
      if (habitsError) throw habitsError
      
      // Load completions (last 90 days)
      const ninetyDaysAgo = format(new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd')
      const { data: completionsData, error: completionsError } = await supabase
        .from('habit_completions')
        .select('*')
        .eq('user_id', user.id)
        .gte('completion_date', ninetyDaysAgo)
        .order('completion_date', { ascending: false })
      
      if (completionsError) throw completionsError
      
      setHabits(habitsData || [])
      setCompletions(completionsData || [])
    } catch (error: any) {
      console.error('Error loading data:', error)
      setError(t('messages.error_loading'))
    } finally {
      setLoading(false)
    }
  }

  const loadShareSettings = async () => {
    if (!user) return
    
    try {
      const { data, error } = await supabase
        .from('user_share_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()
      
      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        throw error
      }
      
      setShareSettings(data)
    } catch (error: any) {
      console.error('Error loading share settings:', error)
    }
  }

  const handleHabitCreated = (newHabit: Habit) => {
    setHabits(prev => [newHabit, ...prev])
    setShowHabitForm(false)
  }

  const handleHabitUpdated = (updatedHabit: Habit) => {
    setHabits(prev => prev.map(h => h.id === updatedHabit.id ? updatedHabit : h))
    setEditingHabit(null)
  }

  const handleToggleCompletion = async (habitId: string, date: string, completed: boolean, notes?: string) => {
    if (!user) return
    
    try {
      if (completed) {
        // Add completion
        const { data, error } = await supabase
          .from('habit_completions')
          .insert({
            habit_id: habitId,
            user_id: user.id,
            completion_date: date,
            notes: notes || null
          })
          .select()
          .single()
        
        if (error) throw error
        
        setCompletions(prev => [data, ...prev])
      } else {
        // Remove completion
        const { error } = await supabase
          .from('habit_completions')
          .delete()
          .eq('habit_id', habitId)
          .eq('completion_date', date)
          .eq('user_id', user.id)
        
        if (error) throw error
        
        setCompletions(prev => 
          prev.filter(c => !(c.habit_id === habitId && c.completion_date === date))
        )
      }
    } catch (error: any) {
      console.error('Error toggling completion:', error)
      setError(t('messages.error_updating'))
    }
  }

  const handleEditHabit = (habit: Habit) => {
    // TODO: Implement edit habit functionality
    console.log('Edit habit:', habit)
  }

  const handleDeleteHabit = async (habitId: string) => {
    if (!user || !confirm(t('habits.delete_confirm'))) return
    
    try {
      const { error } = await supabase
        .from('habits')
        .update({ is_active: false })
        .eq('id', habitId)
        .eq('user_id', user.id)
      
      if (error) throw error
      
      setHabits(prev => prev.filter(h => h.id !== habitId))
    } catch (error: any) {
      console.error('Error deleting habit:', error)
      setError(t('messages.error_deleting'))
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  const getTodayStats = () => {
    const today = format(new Date(), 'yyyy-MM-dd')
    const todayHabits = habits.filter(h => shouldShowHabitOnDate(h, new Date()))
    const todayCompletions = completions.filter(c => c.completion_date === today)
    
    return {
      total: todayHabits.length,
      completed: todayCompletions.length,
      percentage: todayHabits.length > 0 ? Math.round((todayCompletions.length / todayHabits.length) * 100) : 0
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-primary animate-fade-in-up">
        <div className="text-center text-white">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>{t('app.loading')}</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-primary flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8 text-white">
            <div className="flex items-center justify-center mb-4">
              <div className="h-12 w-12 bg-white/20 backdrop-blur-lg rounded-xl flex items-center justify-center">
                <Target className="h-6 w-6" />
              </div>
            </div>
            <h1 className="text-3xl font-bold mb-2">{t('app.title')}</h1>
            <p className="text-white/80">{t('app.subtitle')}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
            <AuthForm />
          </div>
        </div>
      </div>
    )
  }

  if (showSettings) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto p-4 pt-8">
          <Settings onClose={() => setShowSettings(false)} />
        </div>
      </div>
    )
  }

  if (showHabitForm) {
    return (
      <div className="min-h-screen bg-gradient-primary p-4">
        <div className="max-w-4xl mx-auto pt-8">
          <HabitForm 
            onHabitCreated={handleHabitCreated}
            onCancel={() => setShowHabitForm(false)}
          />
        </div>
      </div>
    )
  }

  const todayStats = getTodayStats()

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-[rgb(var(--color-primary))] rounded-lg flex items-center justify-center">
                <Target className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">{t('app.title')}</h1>
                <p className="text-xs text-muted-foreground">
                  {profile?.full_name 
                    ? `${t('app.welcome')}, ${profile.full_name}`
                    : profile?.email
                    ? `${t('app.welcome')}, ${profile.email.split('@')[0]}`
                    : t('app.welcome')
                  }
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2">
                <Badge className="badge-primary">
                  {t('time.today')}: {todayStats.completed}/{todayStats.total} ({todayStats.percentage}%)
                </Badge>
              </div>
              
              <Button
                onClick={() => setShowSettings(true)}
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground"
              >
                <SettingsIcon className="h-4 w-4" />
              </Button>
              
              <Button
                onClick={() => setShowHabitForm(true)}
                size="sm"
                className="btn-primary"
              >
                <Plus className="h-4 w-4 mr-2" />
                {t('habits.new_habit')}
              </Button>
              
              <Button
                onClick={handleSignOut}
                variant="outline"
                size="sm"
                className="text-muted-foreground hover:text-foreground"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {error && (
          <Alert className="mb-4 border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive animate-fade-in-up">
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="text-center py-8">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-[rgb(var(--color-primary))]" />
            <p className="text-muted-foreground">{t('habits.loading')}</p>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:grid-cols-4">
              <TabsTrigger value="today" className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                <span className="hidden sm:inline">{t('nav.today')}</span>
              </TabsTrigger>
              <TabsTrigger value="weekly" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span className="hidden sm:inline">{t('nav.weekly')}</span>
              </TabsTrigger>
              <TabsTrigger value="monthly" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span className="hidden sm:inline">{t('nav.monthly')}</span>
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">{t('nav.analytics')}</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="today" className="space-y-4 animate-fade-in-up">
              {habits.length === 0 ? (
                <Card className="card-enhanced text-center py-12 animate-scale-in">
                  <CardContent>
                    <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      {t('habits.start_journey')}
                    </h3>
                    <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                      {t('habits.journey_description')}
                    </p>
                    <Button 
                      onClick={() => setShowHabitForm(true)}
                      className="btn-primary"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      {t('habits.create_first')}
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-3">
                  {habits.map((habit, index) => (
                    <div key={habit.id} className="animate-slide-in-right" style={{ animationDelay: `${index * 0.1}s` }}>
                      <HabitCard
                        habit={habit}
                        completions={completions.filter(c => c.habit_id === habit.id)}
                        onToggleCompletion={handleToggleCompletion}
                        onEditHabit={handleEditHabit}
                        onDeleteHabit={handleDeleteHabit}
                      />
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="weekly" className="animate-fade-in-up">
              <WeeklyCalendar
                habits={habits}
                completions={completions}
                onToggleCompletion={handleToggleCompletion}
                currentWeek={currentWeek}
                onWeekChange={setCurrentWeek}
              />
            </TabsContent>

            <TabsContent value="monthly" className="animate-fade-in-up">
              <MonthlyCalendar
                habits={habits}
                completions={completions}
                currentMonth={currentMonth}
                onMonthChange={setCurrentMonth}
              />
            </TabsContent>

            <TabsContent value="analytics" className="animate-fade-in-up">
              <EnhancedAnalyticsDashboard
                habits={habits}
                completions={completions}
              />
            </TabsContent>
          </Tabs>
        )}
        
        {/* Edit Habit Modal */}
        <EditHabitModal
          habit={editingHabit}
          open={showEditModal}
          onOpenChange={setShowEditModal}
          onHabitUpdated={handleHabitUpdated}
        />
      </main>

      {/* Footer - Compact */}
      <footer className="bg-card border-t border-border mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1 text-muted-foreground">
              <span className="text-xs">{t('app.built_with_love')}</span>
              <Heart className="h-3 w-3 text-red-500 fill-current" />
              <span className="text-xs">{t('app.by')}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {t('app.subtitle')}
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <HabitTrackerApp />
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  )
}

export default App

// Helper function
function shouldShowHabitOnDate(habit: Habit, date: Date): boolean {
  const dayName = format(date, 'EEEE').toLowerCase()
  
  switch (habit.frequency_type) {
    case 'daily':
      return true
    case 'alternate':
      const createdDate = new Date(habit.created_at)
      const daysSinceCreation = Math.floor((date.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24))
      return daysSinceCreation >= 0 && daysSinceCreation % 2 === 0
    case 'custom':
      return habit.custom_days?.includes(dayName) || false
    default:
      return false
  }
}