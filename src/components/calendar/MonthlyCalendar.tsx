import React from 'react'
import { Habit, HabitCompletion } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import { 
  format, 
  startOfMonth, 
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  isToday,
  isSameMonth,
  parseISO 
} from 'date-fns'

interface MonthlyCalendarProps {
  habits: Habit[]
  completions: HabitCompletion[]
  currentMonth: Date
  onMonthChange: (date: Date) => void
}

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

export function MonthlyCalendar({ 
  habits, 
  completions, 
  currentMonth,
  onMonthChange 
}: MonthlyCalendarProps) {
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 })
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 })
  
  const calendarDays: Date[] = []
  let currentDate = startDate
  
  while (currentDate <= endDate) {
    calendarDays.push(new Date(currentDate))
    currentDate = addDays(currentDate, 1)
  }
  
  const goToPreviousMonth = () => {
    onMonthChange(addMonths(currentMonth, -1))
  }
  
  const goToNextMonth = () => {
    onMonthChange(addMonths(currentMonth, 1))
  }
  
  const goToCurrentMonth = () => {
    onMonthChange(new Date())
  }
  
  // Calculate daily stats for each day
  const getDayStats = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    const activeHabits = habits.filter(h => shouldShowHabitOnDate(h, date))
    const completedCount = completions.filter(
      c => c.completion_date === dateStr && activeHabits.some(h => h.id === c.habit_id)
    ).length
    
    return {
      total: activeHabits.length,
      completed: completedCount,
      percentage: activeHabits.length > 0 ? (completedCount / activeHabits.length) * 100 : 0
    }
  }

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-xl text-green-700">
            <Calendar className="h-5 w-5" />
            Monthly View
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={goToPreviousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={goToCurrentMonth}>
              Today
            </Button>
            <Button variant="outline" size="sm" onClick={goToNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <p className="text-lg font-semibold text-gray-900">
          {format(currentMonth, 'MMMM yyyy')}
        </p>
      </CardHeader>
      
      <CardContent className="p-4">
        <div className="grid grid-cols-7 gap-1">
          {/* Week day headers */}
          {weekDays.map((day) => (
            <div key={day} className="p-2 text-center font-medium text-sm text-gray-700 bg-gray-50 rounded">
              {day}
            </div>
          ))}
          
          {/* Calendar days */}
          {calendarDays.map((date, index) => {
            const stats = getDayStats(date)
            const isCurrentMonth = isSameMonth(date, currentMonth)
            const isDayToday = isToday(date)
            
            return (
              <div 
                key={index} 
                className={`min-h-[80px] p-2 border rounded-lg transition-colors ${
                  isDayToday 
                    ? 'bg-green-100 border-green-300' 
                    : isCurrentMonth 
                      ? 'bg-white border-gray-200 hover:bg-gray-50'
                      : 'bg-gray-50 border-gray-100'
                }`}
              >
                <div className={`text-sm font-medium mb-1 ${
                  isDayToday 
                    ? 'text-green-700' 
                    : isCurrentMonth 
                      ? 'text-gray-900'
                      : 'text-gray-400'
                }`}>
                  {format(date, 'd')}
                </div>
                
                {isCurrentMonth && stats.total > 0 && (
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-600">
                        {stats.completed}/{stats.total}
                      </span>
                      <span className={`font-medium ${
                        stats.percentage === 100 
                          ? 'text-green-600' 
                          : stats.percentage >= 50 
                            ? 'text-yellow-600'
                            : 'text-red-500'
                      }`}>
                        {Math.round(stats.percentage)}%
                      </span>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div 
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                          stats.percentage === 100 
                            ? 'bg-green-500' 
                            : stats.percentage >= 50 
                              ? 'bg-yellow-500'
                              : 'bg-red-400'
                        }`}
                        style={{ width: `${stats.percentage}%` }}
                      />
                    </div>
                    
                    {/* Small dots for individual habits */}
                    <div className="flex gap-1 flex-wrap">
                      {habits
                        .filter(h => shouldShowHabitOnDate(h, date))
                        .slice(0, 3) // Show max 3 dots
                        .map(habit => {
                          const dateStr = format(date, 'yyyy-MM-dd')
                          const isCompleted = completions.some(
                            c => c.habit_id === habit.id && c.completion_date === dateStr
                          )
                          
                          return (
                            <div
                              key={habit.id}
                              className={`w-2 h-2 rounded-full ${
                                isCompleted ? 'bg-green-500' : 'bg-gray-300'
                              }`}
                              title={habit.name}
                            />
                          )
                        })
                      }
                      {habits.filter(h => shouldShowHabitOnDate(h, date)).length > 3 && (
                        <div className="text-xs text-gray-500">+</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
        
        {/* Legend */}
        <div className="mt-4 flex items-center gap-4 text-xs text-gray-600">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Completed</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
            <span>Not completed</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-1.5 bg-green-500 rounded-full"></div>
            <span>100% day</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-1.5 bg-yellow-500 rounded-full"></div>
            <span>50%+ day</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}