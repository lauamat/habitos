import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase, Habit, HabitCompletion, MotivationalQuote } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  TrendingUp, 
  Target, 
  Calendar, 
  Award, 
  RefreshCw,
  Quote,
  BarChart3,
  Flame,
  CheckCircle2
} from 'lucide-react'
import { format, subDays, parseISO, differenceInDays } from 'date-fns'

interface AnalyticsDashboardProps {
  habits: Habit[]
  completions: HabitCompletion[]
}

interface HabitStats {
  totalHabits: number
  activeHabits: number
  todayCompletionRate: number
  weekCompletionRate: number
  monthCompletionRate: number
  longestStreak: number
  currentStreaks: { habit: Habit; streak: number }[]
  totalCompletions: number
  averageDailyCompletions: number
}

export function AnalyticsDashboard({ habits, completions }: AnalyticsDashboardProps) {
  const { user } = useAuth()
  const [quote, setQuote] = useState<MotivationalQuote | null>(null)
  const [loadingQuote, setLoadingQuote] = useState(false)
  const [stats, setStats] = useState<HabitStats | null>(null)

  useEffect(() => {
    calculateStats()
    loadMotivationalQuote()
  }, [habits, completions])

  const calculateStats = () => {
    const today = new Date()
    const todayStr = format(today, 'yyyy-MM-dd')
    const weekAgo = format(subDays(today, 7), 'yyyy-MM-dd')
    const monthAgo = format(subDays(today, 30), 'yyyy-MM-dd')
    
    const activeHabits = habits.filter(h => h.is_active)
    const todayHabits = activeHabits.filter(h => shouldShowHabitOnDate(h, today))
    const todayCompletions = completions.filter(c => 
      c.completion_date === todayStr && todayHabits.some(h => h.id === c.habit_id)
    )
    
    // Week completions
    const weekCompletions = completions.filter(c => c.completion_date >= weekAgo)
    const weekExpectedCompletions = calculateExpectedCompletions(activeHabits, 7)
    
    // Month completions
    const monthCompletions = completions.filter(c => c.completion_date >= monthAgo)
    const monthExpectedCompletions = calculateExpectedCompletions(activeHabits, 30)
    
    // Calculate streaks
    const currentStreaks = activeHabits.map(habit => ({
      habit,
      streak: calculateCurrentStreak(habit, completions)
    })).filter(s => s.streak > 0)
    
    const longestStreak = Math.max(0, ...currentStreaks.map(s => s.streak))
    
    // Calculate average daily completions
    const daysSinceFirstHabit = habits.length > 0 
      ? Math.max(1, differenceInDays(today, parseISO(habits[0].created_at)))
      : 1
    const averageDailyCompletions = completions.length / daysSinceFirstHabit
    
    setStats({
      totalHabits: habits.length,
      activeHabits: activeHabits.length,
      todayCompletionRate: todayHabits.length > 0 ? (todayCompletions.length / todayHabits.length) * 100 : 0,
      weekCompletionRate: weekExpectedCompletions > 0 ? (weekCompletions.length / weekExpectedCompletions) * 100 : 0,
      monthCompletionRate: monthExpectedCompletions > 0 ? (monthCompletions.length / monthExpectedCompletions) * 100 : 0,
      longestStreak,
      currentStreaks: currentStreaks.sort((a, b) => b.streak - a.streak).slice(0, 3),
      totalCompletions: completions.length,
      averageDailyCompletions
    })
  }

  const loadMotivationalQuote = async () => {
    if (!user) return
    
    setLoadingQuote(true)
    try {
      // Determine situation based on recent performance
      let situation = 'general'
      if (stats) {
        if (stats.todayCompletionRate === 0 && stats.weekCompletionRate < 50) {
          situation = 'struggling'
        } else if (stats.todayCompletionRate === 100 && stats.weekCompletionRate >= 80) {
          situation = 'succeeding'
        } else if (stats.totalHabits === 0 || stats.totalCompletions === 0) {
          situation = 'starting'
        } else if (stats.longestStreak >= 7) {
          situation = 'maintaining'
        }
      }
      
      const { data, error } = await supabase
        .from('motivational_quotes')
        .select('*')
        .eq('is_active', true)
        .in('situation', [situation, 'general'])
        .order('id')
        
      if (error) {
        console.error('Error loading quote:', error)
        return
      }
      
      if (data && data.length > 0) {
        const randomQuote = data[Math.floor(Math.random() * data.length)]
        setQuote(randomQuote)
      }
    } catch (error) {
      console.error('Error loading motivational quote:', error)
    } finally {
      setLoadingQuote(false)
    }
  }

  if (!stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Motivational Quote */}
      {quote && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <Quote className="h-6 w-6 text-blue-600 mb-3" />
                <blockquote className="text-lg font-medium text-gray-900 mb-2">
                  "{quote.quote}"
                </blockquote>
                {quote.author && (
                  <cite className="text-sm text-gray-600 not-italic">
                    — {quote.author}
                  </cite>
                )}
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={loadMotivationalQuote}
                disabled={loadingQuote}
                className="ml-4 text-blue-600 hover:text-blue-700"
              >
                <RefreshCw className={`h-4 w-4 ${loadingQuote ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Today's Progress</p>
                <p className="text-2xl font-bold text-green-900">
                  {Math.round(stats.todayCompletionRate)}%
                </p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Active Habits</p>
                <p className="text-2xl font-bold text-blue-900">
                  {stats.activeHabits}
                </p>
              </div>
              <Target className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-700">Longest Streak</p>
                <p className="text-2xl font-bold text-orange-900">
                  {stats.longestStreak} days
                </p>
              </div>
              <Flame className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700">Total Completions</p>
                <p className="text-2xl font-bold text-purple-900">
                  {stats.totalCompletions}
                </p>
              </div>
              <Award className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Performance Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-gray-700">This Week</span>
                  <span className="text-sm font-bold text-gray-900">
                    {Math.round(stats.weekCompletionRate)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, stats.weekCompletionRate)}%` }}
                  />
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-gray-700">This Month</span>
                  <span className="text-sm font-bold text-gray-900">
                    {Math.round(stats.monthCompletionRate)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, stats.monthCompletionRate)}%` }}
                  />
                </div>
              </div>
              
              <div className="pt-2 border-t">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Daily Average:</span> {stats.averageDailyCompletions.toFixed(1)} completions
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Current Streaks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flame className="h-5 w-5" />
              Active Streaks
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.currentStreaks.length > 0 ? (
              <div className="space-y-3">
                {stats.currentStreaks.map((streak) => (
                  <div key={streak.habit.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{streak.habit.name}</p>
                      <p className="text-sm text-gray-600">
                        {getFrequencyDisplay(streak.habit)}
                      </p>
                    </div>
                    <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                      {streak.streak} days
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                <Flame className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p>No active streaks yet.</p>
                <p className="text-sm">Complete habits to start building streaks!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Helper functions
function shouldShowHabitOnDate(habit: Habit, date: Date): boolean {
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

function calculateExpectedCompletions(habits: Habit[], days: number): number {
  let expected = 0
  const endDate = new Date()
  
  for (let i = 0; i < days; i++) {
    const date = subDays(endDate, i)
    habits.forEach(habit => {
      if (shouldShowHabitOnDate(habit, date)) {
        expected++
      }
    })
  }
  
  return expected
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
    const shouldHaveHabit = shouldShowHabitOnDate(habit, checkDate)
    
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