import React, { useState, useEffect } from 'react'
import { supabase, Habit } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Loader2, Save, X, ChevronLeft } from 'lucide-react'

interface EditHabitModalProps {
  habit: Habit | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onHabitUpdated: (habit: Habit) => void
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

export function EditHabitModal({ habit, open, onOpenChange, onHabitUpdated }: EditHabitModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [motivation, setMotivation] = useState('')
  const [frequency, setFrequency] = useState<FrequencyType>('daily')
  const [customDays, setCustomDays] = useState<string[]>([])
  const [showCustomPanel, setShowCustomPanel] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (habit && open) {
      setName(habit.name)
      setDescription(habit.description || '')
      setMotivation(habit.motivation || '')
      setFrequency(habit.frequency_type)
      setCustomDays(habit.custom_days || [])
      setShowCustomPanel(false)
      setError('')
    }
  }, [habit, open])

  const handleFrequencyChange = (value: FrequencyType) => {
    setFrequency(value)
    if (value === 'custom') {
      setShowCustomPanel(true)
    } else {
      setShowCustomPanel(false)
      if (value === 'daily' || value === 'alternate') {
        setCustomDays([])
      }
    }
  }

  const handleCustomDayToggle = (day: string, checked: boolean) => {
    if (checked) {
      setCustomDays([...customDays, day])
    } else {
      setCustomDays(customDays.filter(d => d !== day))
    }
  }

  const handleSubmit = async () => {
    if (!habit) return

    setLoading(true)
    setError('')

    try {
      // Validate custom frequency
      if (frequency === 'custom' && customDays.length === 0) {
        throw new Error('Please select at least one day for custom frequency')
      }

      const updates = {
        name: name.trim(),
        description: description.trim() || null,
        motivation: motivation.trim() || null,
        frequency_type: frequency,
        custom_days: frequency === 'custom' ? customDays : null,
        updated_at: new Date().toISOString()
      }

      const { data, error: updateError } = await supabase
        .from('habits')
        .update(updates)
        .eq('id', habit.id)
        .select()
        .single()

      if (updateError) {
        throw updateError
      }

      onHabitUpdated(data)
      onOpenChange(false)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setShowCustomPanel(false)
    onOpenChange(false)
  }

  if (!habit) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl text-green-700">
                {showCustomPanel ? 'Choose Your Days' : 'Edit Habit'}
              </DialogTitle>
              <p className="text-sm text-gray-600 mt-1">
                {showCustomPanel 
                  ? 'Select the days you want to practice this habit'
                  : 'Update your habit details'
                }
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="p-1"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-800">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {showCustomPanel && frequency === 'custom' ? (
            <div className="space-y-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCustomPanel(false)}
                className="p-1 mb-4"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back to habit details
              </Button>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {DAYS_OF_WEEK.map((day) => (
                  <div key={day.value} className="flex items-center space-x-3">
                    <Checkbox
                      id={`edit-${day.value}`}
                      checked={customDays.includes(day.value)}
                      onCheckedChange={(checked) => 
                        handleCustomDayToggle(day.value, checked as boolean)
                      }
                      className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                    />
                    <Label 
                      htmlFor={`edit-${day.value}`} 
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

              <Button
                onClick={() => setShowCustomPanel(false)}
                disabled={customDays.length === 0}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                Continue with selected days
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="editName" className="text-sm font-medium">
                  Habit Name *
                </Label>
                <Input
                  id="editName"
                  placeholder="e.g., Drink 8 glasses of water, Exercise for 30 minutes"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="focus:ring-green-500 focus:border-green-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="editDescription" className="text-sm font-medium">
                  Description (optional)
                </Label>
                <Input
                  id="editDescription"
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
                      id="edit-daily"
                      className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600" 
                    />
                    <Label htmlFor="edit-daily" className="cursor-pointer flex-1">
                      <div className="font-medium">All Days</div>
                      <div className="text-sm text-gray-600">Every day of the week</div>
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-green-50 transition-colors">
                    <RadioGroupItem 
                      value="alternate" 
                      id="edit-alternate"
                      className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600" 
                    />
                    <Label htmlFor="edit-alternate" className="cursor-pointer flex-1">
                      <div className="font-medium">Alternate Days</div>
                      <div className="text-sm text-gray-600">Every other day</div>
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-green-50 transition-colors">
                    <RadioGroupItem 
                      value="custom" 
                      id="edit-custom"
                      className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600" 
                    />
                    <Label htmlFor="edit-custom" className="cursor-pointer flex-1">
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
                <Label htmlFor="editMotivation" className="text-sm font-medium">
                  Why I want to do this
                </Label>
                <Textarea
                  id="editMotivation"
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

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  disabled={loading}
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}