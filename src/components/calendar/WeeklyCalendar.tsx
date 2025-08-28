import React from 'react'
import { Habit, HabitCompletion } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Circle, Calendar } from 'lucide-react'
import { 
  format, 
  startOfWeek, 
  addDays, 
  isToday, 
  parseISO,
  isSameDay 
} from 'date-fns'

interface WeeklyCalendarProps {
  habits: Habit[]
  completions: HabitCompletion[]
  onToggleCompletion: (habitId: string, date: string, completed: boolean) => void
  currentWeek: Date
  onWeekChange: (date: Date) => void
  readOnly?: boolean
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

export function WeeklyCalendar({ 
  habits, 
  completions, 
  onToggleCompletion, 
  currentWeek,
  onWeekChange,
  readOnly = false 
}: WeeklyCalendarProps) {
  const startDate = startOfWeek(currentWeek, { weekStartsOn: 1 }) // Start on Monday
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(startDate, i))
  
  const goToPreviousWeek = () => {
    onWeekChange(addDays(currentWeek, -7))
  }
  
  const goToNextWeek = () => {
    onWeekChange(addDays(currentWeek, 7))
  }
  
  const goToCurrentWeek = () => {
    onWeekChange(new Date())
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-xl text-green-700">
            <Calendar className="h-5 w-5" />
            Weekly View
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={goToPreviousWeek}>
              ← Previous
            </Button>
            <Button variant="outline" size="sm" onClick={goToCurrentWeek}>
              Today
            </Button>
            <Button variant="outline" size="sm" onClick={goToNextWeek}>
              Next →
            </Button>
          </div>
        </div>
        <p className="text-sm text-gray-600">
          {format(weekDays[0], 'MMM d')} - {format(weekDays[6], 'MMM d, yyyy')}
        </p>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <div className="min-w-full">
            {/* Header with days */}
            <div className="grid grid-cols-8 border-b bg-gray-50">
              <div className="p-3 font-medium text-sm text-gray-700">
                Habit
              </div>
              {weekDays.map((day, index) => (
                <div 
                  key={index} 
                  className={`p-3 text-center font-medium text-sm ${
                    isToday(day) 
                      ? 'bg-green-100 text-green-700' 
                      : 'text-gray-700'
                  }`}
                >
                  <div>{format(day, 'EEE')}</div>
                  <div className="text-xs">{format(day, 'MMM d')}</div>
                </div>
              ))}
            </div>
            
            {/* Habit rows */}
            {habits.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <p>No habits yet. Create your first habit to get started!</p>
              </div>
            ) : (
              habits.map((habit) => (
                <div key={habit.id} className="grid grid-cols-8 border-b hover:bg-gray-50">
                  <div className="p-3">
                    <div className="font-medium text-sm text-gray-900">
                      {habit.name}
                    </div>
                    {habit.description && (
                      <div className="text-xs text-gray-600 mt-1">
                        {habit.description}
                      </div>
                    )}
                  </div>
                  
                  {weekDays.map((day, index) => {
                    const dateStr = format(day, 'yyyy-MM-dd')
                    const completion = completions.find(
                      c => c.habit_id === habit.id && c.completion_date === dateStr
                    )
                    const isCompleted = !!completion
                    const shouldShow = shouldShowHabitOnDate(habit, day)
                    const isPastDay = day < new Date(format(new Date(), 'yyyy-MM-dd'))
                    
                    return (
                      <div 
                        key={index} 
                        className={`p-3 flex items-center justify-center ${
                          isToday(day) ? 'bg-green-50' : ''
                        }`}
                      >
                        {shouldShow ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => !readOnly && onToggleCompletion(habit.id, dateStr, !isCompleted)}
                            disabled={readOnly}
                            className={`p-2 h-10 w-10 rounded-full transition-colors ${
                              isCompleted 
                                ? 'text-green-600 bg-green-100 hover:bg-green-200' 
                                : isPastDay
                                  ? 'text-red-400 hover:text-red-600 hover:bg-red-50'
                                  : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                            } ${readOnly ? 'cursor-default' : 'cursor-pointer'}`}
                          >
                            {isCompleted ? (
                              <CheckCircle2 className="h-5 w-5" />
                            ) : (
                              <Circle className="h-5 w-5" />
                            )}
                          </Button>
                        ) : (
                          <div className="h-10 w-10 flex items-center justify-center">
                            <div className="w-2 h-2 bg-gray-200 rounded-full"></div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}