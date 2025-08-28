import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { supabase, Habit, HabitCompletion, MotivationalQuote } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
 import { AnalyticsChart } from './AnalyticsChart'
import { MostAbandonedHabits } from './MostAbandonedHabits'
import { QuoteRotator } from './QuoteRotator'
import { ExportAnalytics } from './ExportAnalytics'
import { 
  TrendingUp, 
  Target, 
  Calendar, 
  Award, 
  RefreshCw,
  Quote,
  BarChart3,
  Flame,
  CheckCircle2,
  TrendingDown,
  Activity,
  Zap
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
  todayCompleted: number
  todayPlanned: number
  weekCompleted: number
  weekPlanned: number
  monthCompleted: number
  monthPlanned: number
}

export function EnhancedAnalyticsDashboard({ habits, completions }: AnalyticsDashboardProps) {
  const { user } = useAuth()
  const { t } = useLanguage()
  const [stats, setStats] = useState<HabitStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    calculateStats()
  }, [habits, completions])

  const calculateStats = () => {
    setLoading(true)
    const today = new Date()
    const todayStr = format(today, 'yyyy-MM-dd')
    const weekAgo = format(subDays(today, 7), 'yyyy-MM-dd')
    const monthAgo = format(subDays(today, 30), 'yyyy-MM-dd')
    
    const activeHabits = habits.filter(h => h.is_active)
    
    // Today's stats - new formula: completion = completed/planned*100
    const todayHabits = activeHabits.filter(h => shouldShowHabitOnDate(h, today))
    const todayCompletions = completions.filter(c => 
      c.completion_date === todayStr && todayHabits.some(h => h.id === c.habit_id)
    )
    
    // Week stats
    const { completed: weekCompleted, planned: weekPlanned } = getCompletionStats(activeHabits, completions, 7)
    
    // Month stats
    const { completed: monthCompleted, planned: monthPlanned } = getCompletionStats(activeHabits, completions, 30)
    
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

    const calculatedStats: HabitStats = {
      totalHabits: habits.length,
      activeHabits: activeHabits.length,
      todayCompletionRate: todayHabits.length > 0 ? (todayCompletions.length / todayHabits.length) * 100 : 0,
      weekCompletionRate: weekPlanned > 0 ? (weekCompleted / weekPlanned) * 100 : 0,
      monthCompletionRate: monthPlanned > 0 ? (monthCompleted / monthPlanned) * 100 : 0,
      longestStreak,
      currentStreaks: currentStreaks.sort((a, b) => b.streak - a.streak).slice(0, 3),
      totalCompletions: completions.length,
      averageDailyCompletions,
      todayCompleted: todayCompletions.length,
      todayPlanned: todayHabits.length,
      weekCompleted,
      weekPlanned,
      monthCompleted,
      monthPlanned
    }

    setStats(calculatedStats)
    setLoading(false)
  }

  if (loading || !stats) {
    return (
      <div className="space-y-6">
        {/* Loading skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-compact animate-fade-in-up">
      {/* Motivational Quote with Rotation */}
      <QuoteRotator />

      {/* Main KPI Cards with new formula - Compact Version */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
        {/* Today's Progress */}
        <Card className="card-enhanced bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200/50 dark:border-green-800/50">
          <CardContent className="kpi-card-compact">
            <div className="flex items-center justify-between kpi-header-compact">
              <div>
                <p className="text-xs font-medium text-green-700 dark:text-green-300">
                  {t('analytics.today_progress')}
                </p>
                <div className="flex items-baseline gap-2">
                  <p className="text-lg font-bold text-green-900 dark:text-green-100">
                    {Math.round(stats.todayCompletionRate)}%
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400">
                    {stats.todayCompleted}/{stats.todayPlanned}
                  </p>
                </div>
              </div>
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <Progress 
              value={stats.todayCompletionRate} 
              className="h-1 bg-green-100 dark:bg-green-900/30" 
            />
          </CardContent>
        </Card>

        {/* Weekly Average */}
        <Card className="card-enhanced bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 border-blue-200/50 dark:border-blue-800/50">
          <CardContent className="kpi-card-compact">
            <div className="flex items-center justify-between kpi-header-compact">
              <div>
                <p className="text-xs font-medium text-blue-700 dark:text-blue-300">
                  {t('analytics.weekly_average')}
                </p>
                <div className="flex items-baseline gap-2">
                  <p className="text-lg font-bold text-blue-900 dark:text-blue-100">
                    {Math.round(stats.weekCompletionRate)}%
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    {stats.weekCompleted}/{stats.weekPlanned}
                  </p>
                </div>
              </div>
              <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <Progress 
              value={stats.weekCompletionRate} 
              className="h-1 bg-blue-100 dark:bg-blue-900/30" 
            />
          </CardContent>
        </Card>

        {/* Monthly Average */}
        <Card className="card-enhanced bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20 border-purple-200/50 dark:border-purple-800/50">
          <CardContent className="kpi-card-compact">
            <div className="flex items-center justify-between kpi-header-compact">
              <div>
                <p className="text-xs font-medium text-purple-700 dark:text-purple-300">
                  {t('analytics.monthly_average')}
                </p>
                <div className="flex items-baseline gap-2">
                  <p className="text-lg font-bold text-purple-900 dark:text-purple-100">
                    {Math.round(stats.monthCompletionRate)}%
                  </p>
                  <p className="text-xs text-purple-600 dark:text-purple-400">
                    {stats.monthCompleted}/{stats.monthPlanned}
                  </p>
                </div>
              </div>
              <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <Progress 
              value={stats.monthCompletionRate} 
              className="h-1 bg-purple-100 dark:bg-purple-900/30" 
            />
          </CardContent>
        </Card>

        {/* Longest Streak */}
        <Card className="card-enhanced bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 border-orange-200/50 dark:border-orange-800/50">
          <CardContent className="kpi-card-compact">
            <div className="flex items-center justify-between kpi-header-compact">
              <div>
                <p className="text-xs font-medium text-orange-700 dark:text-orange-300">
                  {t('analytics.longest_streak')}
                </p>
                <div className="flex items-baseline gap-2">
                  <p className="text-lg font-bold text-orange-900 dark:text-orange-100">
                    {stats.longestStreak}
                  </p>
                  <p className="text-xs text-orange-600 dark:text-orange-400">
                    {t('analytics.days')}
                  </p>
                </div>
              </div>
              <Flame className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Analytics Section - Compact */}
      <div className="grid grid-cols-1 lg:grid-cols-2 analytics-section-compact">
        {/* Most Abandoned Habits */}
        <MostAbandonedHabits habits={habits} completions={completions} />
        
        {/* Active Streaks */}
        <Card className="card-enhanced">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Flame className="h-4 w-4 text-orange-500" />
              {t('analytics.active_streaks')}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {stats.currentStreaks.length > 0 ? (
              <div className="space-y-1">
                {stats.currentStreaks.map((streak, index) => (
                  <div key={streak.habit.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50 animate-slide-in-right" style={{ animationDelay: `${index * 0.1}s` }}>
                    <div className="flex-1">
                      <p className="font-medium text-sm text-foreground">{streak.habit.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {getFrequencyDisplay(streak.habit, t)}
                      </p>
                    </div>
                    <Badge className="badge-primary font-semibold text-xs">
                      {streak.streak} {t('analytics.days')}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                <Flame className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="font-medium text-sm">{t('analytics.no_streaks')}</p>
                <p className="text-xs">{t('analytics.build_streaks')}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Advanced Line Chart System */}
      <AnalyticsChart habits={habits} completions={completions} />

      {/* Export Analytics */}
      <ExportAnalytics habits={habits} completions={completions} stats={stats} />
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

function getCompletionStats(habits: Habit[], completions: HabitCompletion[], days: number): { completed: number, planned: number } {
  const endDate = new Date()
  let planned = 0
  let completed = 0
  
  for (let i = 0; i < days; i++) {
    const date = subDays(endDate, i)
    const dateStr = format(date, 'yyyy-MM-dd')
    
    habits.forEach(habit => {
      if (shouldShowHabitOnDate(habit, date)) {
        planned++
        const hasCompletion = completions.some(c => 
          c.habit_id === habit.id && c.completion_date === dateStr
        )
        if (hasCompletion) {
          completed++
        }
      }
    })
  }
  
  return { completed, planned }
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
    if (streak > 365) break // Prevent infinite loop
  }
  
  return streak
}

function getFrequencyDisplay(habit: Habit, t: (key: string) => string): string {
  switch (habit.frequency_type) {
    case 'daily':
      return t('habits.daily')
    case 'alternate':
      return t('habits.alternate')
    case 'custom':
      if (habit.custom_days && habit.custom_days.length > 0) {
        const days = habit.custom_days.map(day => 
          day.charAt(0).toUpperCase() + day.slice(1, 3)
        ).join(', ')
        return `${days}`
      }
      return t('habits.custom')
    default:
      return 'Unknown'
  }
}
