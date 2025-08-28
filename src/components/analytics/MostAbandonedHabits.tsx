import React, { useState, useEffect } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { Habit, HabitCompletion } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { TrendingDown, Calendar as CalendarIcon, AlertTriangle } from 'lucide-react'
import { format, subDays, parseISO, differenceInDays, addDays } from 'date-fns'

interface MostAbandonedHabitsProps {
  habits: Habit[]
  completions: HabitCompletion[]
}

interface AbandonedHabit {
  habit: Habit
  missedDays: number
  plannedDays: number
  failureRate: number
}

type Period = '7' | '30' | '90' | 'custom'

export function MostAbandonedHabits({ habits, completions }: MostAbandonedHabitsProps) {
  const { t } = useLanguage()
  const [period, setPeriod] = useState<Period>('30')
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>()
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>()
  const [abandonedHabits, setAbandonedHabits] = useState<AbandonedHabit[]>([])

  useEffect(() => {
    calculateAbandonedHabits()
  }, [habits, completions, period, customStartDate, customEndDate])

  const calculateAbandonedHabits = () => {
    let endDate = new Date()
    let startDate: Date

    switch (period) {
      case '7':
        startDate = subDays(endDate, 7)
        break
      case '30':
        startDate = subDays(endDate, 30)
        break
      case '90':
        startDate = subDays(endDate, 90)
        break
      case 'custom':
        if (!customStartDate || !customEndDate) return
        startDate = customStartDate
        endDate = customEndDate
        break
      default:
        startDate = subDays(endDate, 30)
    }

    const activeHabits = habits.filter(h => h.is_active)
    const habitStats: AbandonedHabit[] = []

    activeHabits.forEach(habit => {
      let plannedDays = 0
      let completedDays = 0

      // Count planned and completed days in the period
      let currentDate = new Date(startDate)
      while (currentDate <= endDate) {
        if (shouldShowHabitOnDate(habit, currentDate)) {
          plannedDays++
          const dateStr = format(currentDate, 'yyyy-MM-dd')
          const hasCompletion = completions.some(c => 
            c.habit_id === habit.id && c.completion_date === dateStr
          )
          if (hasCompletion) {
            completedDays++
          }
        }
        currentDate = addDays(currentDate, 1)
      }

      if (plannedDays > 0) {
        const missedDays = plannedDays - completedDays
        const failureRate = (missedDays / plannedDays) * 100

        habitStats.push({
          habit,
          missedDays,
          plannedDays,
          failureRate
        })
      }
    })

    // Sort by failure rate (highest first), then by absolute missed days
    const sorted = habitStats
      .filter(h => h.failureRate > 0) // Only show habits with failures
      .sort((a, b) => {
        if (a.failureRate !== b.failureRate) {
          return b.failureRate - a.failureRate // Higher failure rate first
        }
        return b.missedDays - a.missedDays // More missed days first
      })

    setAbandonedHabits(sorted)
  }

  const getPeriodLabel = (period: Period) => {
    switch (period) {
      case '7': return t('analytics.last_7_days')
      case '30': return t('analytics.last_30_days')
      case '90': return t('analytics.last_90_days')
      case 'custom': return t('analytics.custom_range')
    }
  }

  return (
    <Card className="card-enhanced">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingDown className="h-4 w-4 text-red-500" />
            {t('analytics.abandoned_habits')}
          </CardTitle>
          <div className="flex items-center gap-2">
            {/* Period Selector */}
            <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
              {(['7', '30', '90'] as Period[]).map((p) => (
                <Button
                  key={p}
                  variant={period === p ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setPeriod(p)}
                  className="h-6 px-2 text-xs"
                >
                  {p}d
                </Button>
              ))}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={period === 'custom' ? "default" : "ghost"}
                    size="sm"
                    className="h-6 px-2 text-xs"
                  >
                    <CalendarIcon className="h-3 w-3" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80" align="end">
                  <div className="space-y-3">
                    <h4 className="font-medium">{t('analytics.custom_range')}</h4>
                    <div className="grid gap-2">
                      <div>
                        <label className="text-sm text-muted-foreground">From</label>
                        <Calendar
                          mode="single"
                          selected={customStartDate}
                          onSelect={(date) => {
                            setCustomStartDate(date)
                            if (date && customEndDate) {
                              setPeriod('custom')
                            }
                          }}
                          className="rounded-md border"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-muted-foreground">To</label>
                        <Calendar
                          mode="single"
                          selected={customEndDate}
                          onSelect={(date) => {
                            setCustomEndDate(date)
                            if (customStartDate && date) {
                              setPeriod('custom')
                            }
                          }}
                          className="rounded-md border"
                        />
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Ranked by failure rate over {getPeriodLabel(period).toLowerCase()}
        </p>
      </CardHeader>
      <CardContent className="pt-0">
        {abandonedHabits.length > 0 ? (
          <div className="space-y-2">
            {abandonedHabits.slice(0, 5).map((item, index) => (
              <div 
                key={item.habit.id} 
                className="p-3 rounded-lg border bg-gradient-to-r from-red-50/50 to-orange-50/50 dark:from-red-950/10 dark:to-orange-950/10 border-red-200/30 dark:border-red-800/30 animate-slide-in-right"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-bold text-xs">
                      #{index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-sm text-foreground">{item.habit.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {getFrequencyDisplay(item.habit)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="destructive" className="font-semibold text-xs">
                      {Math.round(item.failureRate)}%
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      {item.missedDays} missed
                    </p>
                  </div>
                </div>
                
                {/* Failure Rate Progress Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Failure Rate</span>
                    <span>{item.missedDays}/{item.plannedDays} days</span>
                  </div>
                  <div className="w-full bg-red-100 dark:bg-red-900/30 rounded-full h-1.5">
                    <div 
                      className="bg-gradient-to-r from-red-500 to-orange-500 h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, item.failureRate)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
            
            {abandonedHabits.length > 5 && (
              <div className="text-center pt-1">
                <p className="text-xs text-muted-foreground">
                  ...and {abandonedHabits.length - 5} more habits with failures
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-4 text-muted-foreground">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p className="font-medium text-sm">No abandoned habits found</p>
            <p className="text-xs">
              Great job! No habits were missed in {getPeriodLabel(period).toLowerCase()}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
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
