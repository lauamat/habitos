import React, { useState, useMemo } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { Habit, HabitCompletion } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { BarChart3, TrendingUp, Calendar, Filter } from 'lucide-react'
import { format, subDays, addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, parseISO } from 'date-fns'

interface AnalyticsChartProps {
  habits: Habit[]
  completions: HabitCompletion[]
}

type ViewMode = 'total' | 'per-habit'
type PeriodView = 'day' | 'week' | 'month'

interface ChartDataPoint {
  date: string
  dateLabel: string
  [habitId: string]: number | string
}

export function AnalyticsChart({ habits, completions }: AnalyticsChartProps) {
  const { t } = useLanguage()
  const [viewMode, setViewMode] = useState<ViewMode>('total')
  const [periodView, setPeriodView] = useState<PeriodView>('week')
  const [selectedHabits, setSelectedHabits] = useState<Set<string>>(new Set(habits.map(h => h.id)))
  const [dateRange, setDateRange] = useState(30) // Last 30 days default

  const activeHabits = habits.filter(h => h.is_active)

  const chartData = useMemo(() => {
    const endDate = new Date()
    const startDate = subDays(endDate, dateRange)
    const data: ChartDataPoint[] = []

    if (periodView === 'day') {
      // Day view - each point is a day
      for (let i = 0; i <= dateRange; i++) {
        const date = subDays(endDate, dateRange - i)
        const dateStr = format(date, 'yyyy-MM-dd')
        const dateLabel = format(date, 'MMM dd')
        
        const dataPoint: ChartDataPoint = {
          date: dateStr,
          dateLabel,
        }

        if (viewMode === 'total') {
          // Calculate total completion rate for this day
          const dayHabits = activeHabits.filter(h => shouldShowHabitOnDate(h, date))
          const dayCompletions = completions.filter(c => 
            c.completion_date === dateStr && dayHabits.some(h => h.id === c.habit_id)
          )
          dataPoint['total'] = dayHabits.length > 0 ? (dayCompletions.length / dayHabits.length) * 100 : 0
        } else {
          // Per habit completion (0 = not completed, 100 = completed)
          activeHabits.forEach(habit => {
            if (selectedHabits.has(habit.id) && shouldShowHabitOnDate(habit, date)) {
              const hasCompletion = completions.some(c => 
                c.habit_id === habit.id && c.completion_date === dateStr
              )
              dataPoint[habit.id] = hasCompletion ? 100 : 0
            }
          })
        }

        data.push(dataPoint)
      }
    } else if (periodView === 'week') {
      // Week view - each point is a week
      const weeksToShow = Math.ceil(dateRange / 7)
      for (let i = 0; i < weeksToShow; i++) {
        const weekEnd = subDays(endDate, i * 7)
        const weekStart = startOfWeek(weekEnd, { weekStartsOn: 1 })
        const weekEndActual = endOfWeek(weekEnd, { weekStartsOn: 1 })
        
        const dateLabel = `${format(weekStart, 'MMM dd')} - ${format(weekEndActual, 'MMM dd')}`
        
        const dataPoint: ChartDataPoint = {
          date: format(weekStart, 'yyyy-MM-dd'),
          dateLabel,
        }

        if (viewMode === 'total') {
          const weekStats = getWeekStats(weekStart, weekEndActual, activeHabits, completions)
          dataPoint['total'] = weekStats.planned > 0 ? (weekStats.completed / weekStats.planned) * 100 : 0
        } else {
          activeHabits.forEach(habit => {
            if (selectedHabits.has(habit.id)) {
              const habitStats = getWeekStatsForHabit(weekStart, weekEndActual, habit, completions)
              dataPoint[habit.id] = habitStats.planned > 0 ? (habitStats.completed / habitStats.planned) * 100 : 0
            }
          })
        }

        data.push(dataPoint)
      }
      data.reverse() // Show chronological order
    }

    return data
  }, [habits, completions, viewMode, periodView, selectedHabits, dateRange])

  const toggleHabit = (habitId: string) => {
    const newSelected = new Set(selectedHabits)
    if (newSelected.has(habitId)) {
      newSelected.delete(habitId)
    } else {
      newSelected.add(habitId)
    }
    setSelectedHabits(newSelected)
  }

  const colors = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
    '#06b6d4', '#ec4899', '#84cc16', '#f97316', '#6366f1'
  ]

  return (
    <Card className="card-enhanced">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Completion Trends
          </CardTitle>
          
          <div className="flex items-center gap-2 flex-wrap">
            {/* Period View Toggle */}
            <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
              {(['day', 'week'] as PeriodView[]).map((view) => (
                <Button
                  key={view}
                  variant={periodView === view ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setPeriodView(view)}
                  className="h-7 px-3 text-xs"
                >
                  {t(`analytics.${view}_view`)}
                </Button>
              ))}
            </div>
            
            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
              <Button
                variant={viewMode === 'total' ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode('total')}
                className="h-7 px-3 text-xs"
              >
                {t('analytics.total_mode')}
              </Button>
              <Button
                variant={viewMode === 'per-habit' ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode('per-habit')}
                className="h-7 px-3 text-xs"
              >
                {t('analytics.per_habit_mode')}
              </Button>
            </div>
            
            {/* Date Range Filter */}
            <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
              {[7, 30, 90].map((days) => (
                <Button
                  key={days}
                  variant={dateRange === days ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setDateRange(days)}
                  className="h-7 px-2 text-xs"
                >
                  {days}d
                </Button>
              ))}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Habit Filter (for per-habit view) */}
        {viewMode === 'per-habit' && (
          <div className="mb-4 space-y-2">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <span className="text-sm font-medium">Filter Habits:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {activeHabits.map((habit, index) => (
                <Button
                  key={habit.id}
                  variant={selectedHabits.has(habit.id) ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleHabit(habit.id)}
                  className="h-7 text-xs"
                  style={{
                    backgroundColor: selectedHabits.has(habit.id) ? colors[index % colors.length] : undefined,
                    borderColor: colors[index % colors.length]
                  }}
                >
                  {habit.name}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Chart */}
        <div className="h-64">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="dateLabel" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  domain={[0, 100]}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                  formatter={(value: any, name: string) => {
                    if (name === 'total') {
                      return [`${Math.round(value)}%`, 'Completion Rate']
                    }
                    const habit = activeHabits.find(h => h.id === name)
                    const habitName = habit ? habit.name : name
                    return [value > 0 ? 'Completed' : 'Not Completed', habitName]
                  }}
                />
                {viewMode === 'total' ? (
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke="rgb(var(--color-primary))"
                    strokeWidth={3}
                    dot={{ fill: 'rgb(var(--color-primary))', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: 'rgb(var(--color-primary))', strokeWidth: 2 }}
                  />
                ) : (
                  activeHabits.map((habit, index) => 
                    selectedHabits.has(habit.id) ? (
                      <Line
                        key={habit.id}
                        type="stepAfter"
                        dataKey={habit.id}
                        stroke={colors[index % colors.length]}
                        strokeWidth={2}
                        dot={{ fill: colors[index % colors.length], strokeWidth: 1, r: 3 }}
                        connectNulls={false}
                      />
                    ) : null
                  )
                )}
                {viewMode === 'per-habit' && (
                  <Legend 
                    content={({ payload }) => (
                      <div className="flex flex-wrap justify-center gap-4 mt-4">
                        {payload?.map((entry: any, index: number) => {
                          const habit = activeHabits.find(h => h.id === entry.dataKey)
                          if (!habit || !selectedHabits.has(habit.id)) return null
                          return (
                            <div key={entry.dataKey} className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: entry.color }}
                              />
                              <span className="text-xs text-muted-foreground">{habit.name}</span>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">{t('analytics.no_data')}</p>
              </div>
            </div>
          )}
        </div>
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

function getWeekStats(weekStart: Date, weekEnd: Date, habits: Habit[], completions: HabitCompletion[]) {
  let planned = 0
  let completed = 0
  
  let currentDate = new Date(weekStart)
  while (currentDate <= weekEnd) {
    const dateStr = format(currentDate, 'yyyy-MM-dd')
    
    habits.forEach(habit => {
      if (shouldShowHabitOnDate(habit, currentDate)) {
        planned++
        const hasCompletion = completions.some(c => 
          c.habit_id === habit.id && c.completion_date === dateStr
        )
        if (hasCompletion) {
          completed++
        }
      }
    })
    
    currentDate = addDays(currentDate, 1)
  }
  
  return { completed, planned }
}

function getWeekStatsForHabit(weekStart: Date, weekEnd: Date, habit: Habit, completions: HabitCompletion[]) {
  let planned = 0
  let completed = 0
  
  let currentDate = new Date(weekStart)
  while (currentDate <= weekEnd) {
    const dateStr = format(currentDate, 'yyyy-MM-dd')
    
    if (shouldShowHabitOnDate(habit, currentDate)) {
      planned++
      const hasCompletion = completions.some(c => 
        c.habit_id === habit.id && c.completion_date === dateStr
      )
      if (hasCompletion) {
        completed++
      }
    }
    
    currentDate = addDays(currentDate, 1)
  }
  
  return { completed, planned }
}
