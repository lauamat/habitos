import React, { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase, Habit } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2, Plus, ChevronLeft } from 'lucide-react'

interface HabitFormProps {
  onHabitCreated: (habit: Habit) => void
  onCancel: () => void
}

type FrequencyType = 'daily' | 'alternate' | 'custom'

const DAYS_OF_WEEK = [
  { value: 'monday', label: 'Monday' },
  { value: 'tuesday', label: 'Tuesday' },
  { value: 'wednesday', label: 'Wednesday' },
  { value: 'thursday', label: 'Thursday' },
  { value: 'friday', label: 'Friday' },
  { value: 'saturday', label: 'Saturday' },
  { value: 'sunday', label: 'Sunday' }
]

export function HabitForm({ onHabitCreated, onCancel }: HabitFormProps) {
  const { user } = useAuth()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [motivation, setMotivation] = useState('')
  const [frequency, setFrequency] = useState<FrequencyType>('daily')
  const [customDays, setCustomDays] = useState<string[]>([])
  const [showCustomPanel, setShowCustomPanel] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleFrequencyChange = (value: FrequencyType) => {
    setFrequency(value)
    if (value === 'custom') {
      setShowCustomPanel(true)
    } else {
      setShowCustomPanel(false)
      setCustomDays([])
    }
  }

  const handleCustomDayToggle = (day: string, checked: boolean) => {
    if (checked) {
      setCustomDays([...customDays, day])
    } else {
      setCustomDays(customDays.filter(d => d !== day))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)
    setError('')

    try {
      // Validate custom frequency
      if (frequency === 'custom' && customDays.length === 0) {
        throw new Error('Please select at least one day for custom frequency')
      }

      const habitData = {
        user_id: user.id,
        name: name.trim(),
        description: description.trim() || null,
        motivation: motivation.trim() || null,
        frequency_type: frequency,
        custom_days: frequency === 'custom' ? customDays : null,
        is_active: true
      }

      const { data, error: insertError } = await supabase
        .from('habits')
        .insert(habitData)
        .select()
        .single()

      if (insertError) {
        throw insertError
      }

      onHabitCreated(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (showCustomPanel && frequency === 'custom') {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCustomPanel(false)}
              className="p-1"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div>
              <CardTitle className="text-xl text-green-700">
                Choose Your Days
              </CardTitle>
              <CardDescription>
                Select the days you want to practice this habit
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {DAYS_OF_WEEK.map((day) => (
              <div key={day.value} className="flex items-center space-x-3">
                <Checkbox
                  id={day.value}
                  checked={customDays.includes(day.value)}
                  onCheckedChange={(checked) => 
                    handleCustomDayToggle(day.value, checked as boolean)
                  }
                  className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                />
                <Label 
                  htmlFor={day.value} 
                  className="text-sm font-medium cursor-pointer"
                >
                  {day.label}
                </Label>
              </div>
            ))}
          </div>

          {customDays.length > 0 && (
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm text-green-800 font-medium mb-2">
                Selected days:
              </p>
              <div className="flex flex-wrap gap-2">
                {customDays.map((day) => {
                  const dayLabel = DAYS_OF_WEEK.find(d => d.value === day)?.label
                  return (
                    <span 
                      key={day} 
                      className="px-3 py-1 bg-green-600 text-white text-xs rounded-full"
                    >
                      {dayLabel}
                    </span>
                  )
                })}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              onClick={() => setShowCustomPanel(false)}
              disabled={customDays.length === 0}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              Continue
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl text-green-700 flex items-center gap-2">
          <Plus className="h-6 w-6" />
          Create New Habit
        </CardTitle>
        <CardDescription>
          Build a positive habit that will improve your life
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">
              Habit Name *
            </Label>
            <Input
              id="name"
              placeholder="e.g., Drink 8 glasses of water, Exercise for 30 minutes"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="focus:ring-green-500 focus:border-green-500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              Description (optional)
            </Label>
            <Input
              id="description"
              placeholder="Brief description of your habit"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="focus:ring-green-500 focus:border-green-500"
            />
          </div>

          <div className="space-y-4">
            <Label className="text-sm font-medium">How often do you want to do this?</Label>
            <RadioGroup
              value={frequency}
              onValueChange={handleFrequencyChange}
              className="space-y-3"
            >
              <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-green-50 transition-colors">
                <RadioGroupItem 
                  value="daily" 
                  id="daily"
                  className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600" 
                />
                <Label htmlFor="daily" className="cursor-pointer flex-1">
                  <div className="font-medium">All Days</div>
                  <div className="text-sm text-gray-600">Every day of the week</div>
                </Label>
              </div>
              
              <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-green-50 transition-colors">
                <RadioGroupItem 
                  value="alternate" 
                  id="alternate"
                  className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600" 
                />
                <Label htmlFor="alternate" className="cursor-pointer flex-1">
                  <div className="font-medium">Alternate Days</div>
                  <div className="text-sm text-gray-600">Every other day</div>
                </Label>
              </div>
              
              <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-green-50 transition-colors">
                <RadioGroupItem 
                  value="custom" 
                  id="custom"
                  className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600" 
                />
                <Label htmlFor="custom" className="cursor-pointer flex-1">
                  <div className="font-medium">Customize</div>
                  <div className="text-sm text-gray-600">Choose specific days of the week</div>
                </Label>
              </div>
            </RadioGroup>

            {frequency === 'custom' && customDays.length > 0 && (
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm text-green-800 font-medium mb-2">
                  Selected days:
                </p>
                <div className="flex flex-wrap gap-2">
                  {customDays.map((day) => {
                    const dayLabel = DAYS_OF_WEEK.find(d => d.value === day)?.label
                    return (
                      <span 
                        key={day} 
                        className="px-3 py-1 bg-green-600 text-white text-xs rounded-full"
                      >
                        {dayLabel}
                      </span>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="motivation" className="text-sm font-medium">
              Why I want to do this
            </Label>
            <Textarea
              id="motivation"
              placeholder="Describe why this habit is important to you..."
              value={motivation}
              onChange={(e) => setMotivation(e.target.value)}
              rows={4}
              className="focus:ring-green-500 focus:border-green-500 resize-none"
            />
            <p className="text-xs text-gray-600 bg-blue-50 p-2 rounded border border-blue-200">
              Writing this down can help you stay motivated when you don't feel like doing it.
            </p>
          </div>

          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-800">
                {error}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-green-600 hover:bg-green-700"
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Habit
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}