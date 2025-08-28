import React, { useState } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { Habit, HabitCompletion } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Download, FileSpreadsheet, Loader2 } from 'lucide-react'
import { format, subDays } from 'date-fns'

interface ExportAnalyticsProps {
  habits: Habit[]
  completions: HabitCompletion[]
  stats: any
}

export function ExportAnalytics({ habits, completions, stats }: ExportAnalyticsProps) {
  const { t } = useLanguage()
  const [exporting, setExporting] = useState(false)

  const exportToCSV = async () => {
    setExporting(true)
    try {
      // Prepare aggregated data
      const csvData = []
      
      // Headers
      csvData.push([
        'Date',
        'Total Habits Planned', 
        'Total Habits Completed',
        'Completion Rate (%)',
        ...habits.map(h => `${h.name} - Planned`),
        ...habits.map(h => `${h.name} - Completed`)
      ])
      
      // Data for last 90 days
      const endDate = new Date()
      for (let i = 89; i >= 0; i--) {
        const date = subDays(endDate, i)
        const dateStr = format(date, 'yyyy-MM-dd')
        const dateLabel = format(date, 'MMM dd, yyyy')
        
        const dayHabits = habits.filter(h => h.is_active && shouldShowHabitOnDate(h, date))
        const dayCompletions = completions.filter(c => 
          c.completion_date === dateStr && dayHabits.some(h => h.id === c.habit_id)
        )
        
        const totalPlanned = dayHabits.length
        const totalCompleted = dayCompletions.length
        const completionRate = totalPlanned > 0 ? Math.round((totalCompleted / totalPlanned) * 100) : 0
        
        const row = [
          dateLabel,
          totalPlanned,
          totalCompleted,
          completionRate
        ]
        
        // Add per-habit data
        habits.forEach(habit => {
          const isPlanned = shouldShowHabitOnDate(habit, date) ? 1 : 0
          const isCompleted = dayCompletions.some(c => c.habit_id === habit.id) ? 1 : 0
          row.push(isPlanned)
        })
        
        habits.forEach(habit => {
          const isCompleted = dayCompletions.some(c => c.habit_id === habit.id) ? 1 : 0
          row.push(isCompleted)
        })
        
        csvData.push(row)
      }
      
      // Convert to CSV string
      const csvContent = csvData.map(row => 
        row.map(field => 
          typeof field === 'string' && field.includes(',') 
            ? `"${field}"` 
            : field
        ).join(',')
      ).join('\n')
      
      // Download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob)
        link.setAttribute('href', url)
        link.setAttribute('download', `habit-tracker-analytics-${format(new Date(), 'yyyy-MM-dd')}.csv`)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
    } catch (error) {
      console.error('Error exporting data:', error)
    } finally {
      setExporting(false)
    }
  }

  return (
    <Card className="card-enhanced">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          {t('analytics.export_csv')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="space-y-1">
            <p className="font-medium text-muted-foreground">Data Range</p>
            <p className="font-semibold">Last 90 days</p>
          </div>
          <div className="space-y-1">
            <p className="font-medium text-muted-foreground">Habits Included</p>
            <p className="font-semibold">{habits.length} habits</p>
          </div>
          <div className="space-y-1">
            <p className="font-medium text-muted-foreground">Format</p>
            <p className="font-semibold">CSV (Excel Compatible)</p>
          </div>
        </div>
        
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Export includes daily completion data, aggregated statistics, and per-habit tracking for analysis in spreadsheet applications.
          </p>
          
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">Daily completion rates</Badge>
            <Badge variant="outline">Per-habit data</Badge>
            <Badge variant="outline">90-day history</Badge>
            <Badge variant="outline">Excel compatible</Badge>
          </div>
        </div>
        
        <Button 
          onClick={exportToCSV} 
          disabled={exporting || habits.length === 0}
          className="btn-primary w-full"
        >
          {exporting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Preparing Export...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              {t('analytics.export_csv')}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}

// Helper function
function shouldShowHabitOnDate(habit: Habit, date: Date): boolean {
  const dayName = format(date, 'EEEE').toLowerCase()
  
  switch (habit.frequency_type) {
    case 'daily':
      return true
    case 'alternate':
      const createdDate = new Date(habit.created_at)
      const daysSinceCreation = Math.floor((date.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24))
      return daysSinceCreation >= 0 && daysSinceCreation % 2 === 0
    case 'custom':
      return habit.custom_days?.includes(dayName) || false
    default:
      return false
  }
}
