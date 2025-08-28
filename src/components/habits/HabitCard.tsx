import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase, Habit, HabitCompletion } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Calendar, CheckCircle2, Circle, Clock, Edit, Trash2, Target, MessageSquare } from 'lucide-react'
import { format, isToday, parseISO } from 'date-fns'

interface HabitCardProps {
  habit: Habit
  completions: HabitCompletion[]
  onToggleCompletion: (habitId: string, date: string, completed: boolean, notes?: string) => void
  onEditHabit: (habit: Habit) => void
  onDeleteHabit: (habitId: string) => void
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

function shouldShowForToday(habit: Habit): boolean {
  const today = new Date()
  const dayName = format(today, 'EEEE').toLowerCase()
  
  switch (habit.frequency_type) {
    case 'daily':
      return true
    case 'alternate':
      // For alternate days, we'll need to calculate based on habit creation date
      // For simplicity, we'll show it every other day from creation
      const createdDate = parseISO(habit.created_at)
      const daysSinceCreation = Math.floor((today.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24))
      return daysSinceCreation % 2 === 0
    case 'custom':
      return habit.custom_days?.includes(dayName) || false
    default:
      return false
  }
}

export function HabitCard({ 
  habit, 
  completions, 
  onToggleCompletion, 
  onEditHabit, 
  onDeleteHabit 
}: HabitCardProps) {
  const [notes, setNotes] = useState('')
  const [showNotesDialog, setShowNotesDialog] = useState(false)
  
  const today = format(new Date(), 'yyyy-MM-dd')
  const todayCompletion = completions.find(c => c.completion_date === today)
  const isCompleted = !!todayCompletion
  const shouldShow = shouldShowForToday(habit)
  
  // Calculate streak
  const streak = calculateStreak(completions, habit)
  
  const handleToggleCompletion = () => {
    if (isCompleted) {
      onToggleCompletion(habit.id, today, false)
    } else {
      if (notes.trim()) {
        onToggleCompletion(habit.id, today, true, notes)
        setNotes('')
        setShowNotesDialog(false)
      } else {
        onToggleCompletion(habit.id, today, true)
      }
    }
  }
  
  const handleAddNotes = () => {
    if (notes.trim()) {
      onToggleCompletion(habit.id, today, true, notes)
      setNotes('')
      setShowNotesDialog(false)
    }
  }

  return (
    <Card className={`transition-all duration-200 hover:shadow-md ${
      isCompleted ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'
    }`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold text-gray-900 mb-1">
              {habit.name}
            </CardTitle>
            {habit.description && (
              <p className="text-sm text-gray-600 mb-2">{habit.description}</p>
            )}
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Calendar className="h-3 w-3" />
              <span>{getFrequencyDisplay(habit)}</span>
              {streak > 0 && (
                <>
                  <span>•</span>
                  <Target className="h-3 w-3 text-orange-500" />
                  <span className="text-orange-600 font-medium">{streak} day streak</span>
                </>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2 ml-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEditHabit(habit)}
              className="p-1 h-8 w-8"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDeleteHabit(habit.id)}
              className="p-1 h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {shouldShow ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleToggleCompletion}
                className={`p-2 h-10 w-10 rounded-full transition-colors ${
                  isCompleted 
                    ? 'text-green-600 bg-green-100 hover:bg-green-200' 
                    : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="h-6 w-6" />
                ) : (
                  <Circle className="h-6 w-6" />
                )}
              </Button>
              
              <div>
                <p className="text-sm font-medium">
                  {isCompleted ? 'Completed today!' : 'Mark as done today'}
                </p>
                {todayCompletion?.notes && (
                  <p className="text-xs text-gray-600 mt-1">
                    Note: {todayCompletion.notes}
                  </p>
                )}
              </div>
            </div>
            
            {!isCompleted && (
              <Dialog open={showNotesDialog} onOpenChange={setShowNotesDialog}>
                <DialogTrigger>
                  <Button variant="outline" size="sm" className="text-xs">
                    <MessageSquare className="h-3 w-3 mr-1" />
                    Add note
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add a note for today</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Textarea
                      placeholder="How did it go? Any thoughts or observations..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => setShowNotesDialog(false)}
                        variant="outline"
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleAddNotes}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        Complete with note
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Clock className="h-4 w-4" />
            <span>Not scheduled for today</span>
          </div>
        )}
        
        {habit.motivation && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <span className="font-medium">Why:</span> {habit.motivation}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function calculateStreak(completions: HabitCompletion[], habit: Habit): number {
  if (completions.length === 0) return 0
  
  const today = new Date()
  let streak = 0
  let currentDate = new Date(today)
  
  // Go backwards from today to count consecutive days
  while (true) {
    const dateStr = format(currentDate, 'yyyy-MM-dd')
    const hasCompletion = completions.some(c => c.completion_date === dateStr)
    
    if (hasCompletion) {
      streak++
    } else {
      // Check if this date was supposed to be a habit day
      const shouldHaveHabit = shouldHaveHabitOnDate(currentDate, habit)
      if (shouldHaveHabit) {
        break // Streak broken
      }
      // If not supposed to have habit on this day, continue looking back
    }
    
    currentDate.setDate(currentDate.getDate() - 1)
    
    // Don't go back more than 100 days to avoid infinite loop
    if (streak > 100) break
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
      return daysSinceCreation % 2 === 0
    case 'custom':
      return habit.custom_days?.includes(dayName) || false
    default:
      return false
  }
}