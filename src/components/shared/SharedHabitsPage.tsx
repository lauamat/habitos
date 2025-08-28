import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { supabase, Habit, HabitCompletion, UserShareSettings, Profile } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { WeeklyCalendar } from '@/components/calendar/WeeklyCalendar'
import { MonthlyCalendar } from '@/components/calendar/MonthlyCalendar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Target, 
  Calendar, 
  BarChart3, 
  CheckCircle2, 
  Flame, 
  Award, 
  Heart,
  Loader2,
  Lock,
  User
} from 'lucide-react'
import { format, parseISO, differenceInDays, subDays } from 'date-fns'

interface SharedPageData {
  shareSettings: UserShareSettings
  profile: Profile
  habits: Habit[]
  completions: HabitCompletion[]
}

export function SharedHabitsPage() {
  const { shareToken } = useParams<{ shareToken: string }>()
  const [data, setData] = useState<SharedPageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [activeTab, setActiveTab] = useState('weekly')

  useEffect(() => {
    if (shareToken) {
      loadSharedData()
    }
  }, [shareToken])

  const loadSharedData = async () => {
    if (!shareToken) return
    
    setLoading(true)
    setError('')
    
    try {
      // Get share settings
      const { data: shareSettings, error: shareError } = await supabase
        .from('user_share_settings')
        .select('*')
        .eq('share_token', shareToken)
        .eq('is_public', true)
        .single()
      
      if (shareError) {
        if (shareError.code === 'PGRST116') {
          throw new Error('This sharing link is not valid or has been disabled.')
        }
        throw shareError
      }
      
      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', shareSettings.user_id)
        .single()
      
      if (profileError) throw profileError
      
      // Get habits
      const { data: habits, error: habitsError } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', shareSettings.user_id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
      
      if (habitsError) throw habitsError
      
      // Get completions (last 90 days)
      const ninetyDaysAgo = format(subDays(new Date(), 90), 'yyyy-MM-dd')
      const { data: completions, error: completionsError } = await supabase
        .from('habit_completions')
        .select('*')
        .eq('user_id', shareSettings.user_id)
        .gte('completion_date', ninetyDaysAgo)
        .order('completion_date', { ascending: false })
      
      if (completionsError) throw completionsError
      
      setData({
        shareSettings,
        profile,
        habits: habits || [],
        completions: completions || []
      })
    } catch (error: any) {
      console.error('Error loading shared data:', error)
      setError(error.message || 'Failed to load shared habits')
    } finally {
      setLoading(false)
    }
  }

  const getStats = () => {
    if (!data) return { totalHabits: 0, totalCompletions: 0, longestStreak: 0, activeHabits: 0 }
    
    const activeHabits = data.habits.filter(h => h.is_active)
    const longestStreak = Math.max(0, ...activeHabits.map(habit => 
      calculateCurrentStreak(habit, data.completions)
    ))
    
    return {
      totalHabits: data.habits.length,
      activeHabits: activeHabits.length,
      totalCompletions: data.completions.length,
      longestStreak
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getDisplayName = () => {
    if (!data) return 'User'
    return data.shareSettings.share_name || data.profile.full_name || 'User'
  }

  if (!shareToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="p-8">
            <Lock className="h-12 w-12 mx-auto mb-4 text-red-400" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Invalid Link</h2>
            <p className="text-gray-600">This sharing link is not valid.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="p-8">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-green-600" />
            <p className="text-gray-600">Loading shared habits...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="p-8">
            <Lock className="h-12 w-12 mx-auto mb-4 text-red-400" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <p className="text-sm text-gray-500">
              The owner may have disabled sharing or this link may be expired.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!data) return null

  const stats = getStats()

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-green-600 rounded-lg flex items-center justify-center">
                <Target className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Habit Tracker</h1>
                <p className="text-xs text-gray-600">Public view</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={data.profile.avatar_url || ''} />
                  <AvatarFallback className="bg-green-100 text-green-700 text-sm font-semibold">
                    {getInitials(getDisplayName())}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-gray-900">{getDisplayName()}</p>
                  <p className="text-xs text-gray-600">Habit Tracker</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700">Active Habits</p>
                  <p className="text-xl font-bold text-green-900">{stats.activeHabits}</p>
                </div>
                <Target className="h-6 w-6 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700">Total Habits</p>
                  <p className="text-xl font-bold text-blue-900">{stats.totalHabits}</p>
                </div>
                <CheckCircle2 className="h-6 w-6 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-700">Longest Streak</p>
                  <p className="text-xl font-bold text-orange-900">{stats.longestStreak} days</p>
                </div>
                <Flame className="h-6 w-6 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-700">Total Completions</p>
                  <p className="text-xl font-bold text-purple-900">{stats.totalCompletions}</p>
                </div>
                <Award className="h-6 w-6 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Habits List */}
        {data.habits.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {getDisplayName()}'s Habits
              </CardTitle>
              <p className="text-sm text-gray-600">
                {data.habits.length} habit{data.habits.length !== 1 ? 's' : ''} • Member since {format(parseISO(data.profile.created_at), 'MMMM yyyy')}
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.habits.map(habit => (
                  <div key={habit.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{habit.name}</h4>
                      {habit.description && (
                        <p className="text-sm text-gray-600">{habit.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {getFrequencyDisplay(habit)}
                        </Badge>
                        {calculateCurrentStreak(habit, data.completions) > 0 && (
                          <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800">
                            {calculateCurrentStreak(habit, data.completions)} day streak
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Calendar Views */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:grid-cols-2">
            <TabsTrigger value="weekly" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Weekly View</span>
            </TabsTrigger>
            <TabsTrigger value="monthly" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Monthly View</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="weekly">
            <WeeklyCalendar
              habits={data.habits}
              completions={data.completions}
              onToggleCompletion={() => {}} // Read-only
              currentWeek={currentWeek}
              onWeekChange={setCurrentWeek}
              readOnly={true}
            />
          </TabsContent>

          <TabsContent value="monthly">
            <MonthlyCalendar
              habits={data.habits}
              completions={data.completions}
              currentMonth={currentMonth}
              onMonthChange={setCurrentMonth}
            />
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-2">
              <span className="text-gray-600">Built with</span>
              <Heart className="h-4 w-4 text-red-500 fill-current" />
              <span className="text-gray-600">by MiniMax Agent</span>
            </div>
            <p className="text-sm text-gray-500">
              Create your own habit tracker at Habit Tracker
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

// Helper functions
function getFrequencyDisplay(habit: Habit): string {
  switch (habit.frequency_type) {
    case 'daily':
      return 'Every day'
    case 'alternate':
      return 'Alternate days'
    case 'custom':
      if (habit.custom_days && habit.custom_days.length > 0) {
        const days = habit.custom_days.map(day => 
          day.charAt(0).toUpperCase() + day.slice(1, 3)
        ).join(', ')
        return `${days}`
      }
      return 'Custom'
    default:
      return 'Unknown'
  }
}

function calculateCurrentStreak(habit: Habit, completions: HabitCompletion[]): number {
  const habitCompletions = completions
    .filter(c => c.habit_id === habit.id)
    .sort((a, b) => new Date(b.completion_date).getTime() - new Date(a.completion_date).getTime())
  
  if (habitCompletions.length === 0) return 0
  
  let streak = 0
  const today = new Date()
  let checkDate = today
  
  // Go backwards from today
  while (true) {
    const dateStr = format(checkDate, 'yyyy-MM-dd')
    const hasCompletion = habitCompletions.some(c => c.completion_date === dateStr)
    const shouldHaveHabit = shouldHaveHabitOnDate(checkDate, habit)
    
    if (shouldHaveHabit) {
      if (hasCompletion) {
        streak++
      } else {
        break // Streak broken
      }
    }
    
    checkDate = subDays(checkDate, 1)
    if (streak > 100) break // Prevent infinite loop
  }
  
  return streak
}

function shouldHaveHabitOnDate(date: Date, habit: Habit): boolean {
  const dayName = format(date, 'EEEE').toLowerCase()
  
  switch (habit.frequency_type) {
    case 'daily':
      return true
    case 'alternate':
      const createdDate = parseISO(habit.created_at)
      const daysSinceCreation = Math.floor((date.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24))
      return daysSinceCreation >= 0 && daysSinceCreation % 2 === 0
    case 'custom':
      return habit.custom_days?.includes(dayName) || false
    default:
      return false
  }
}