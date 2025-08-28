import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { supabase, MotivationalQuote } from '@/lib/supabase'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Quote, RefreshCw } from 'lucide-react'

interface QuoteRotatorProps {
  autoRotate?: boolean
  rotateInterval?: number
}

export function QuoteRotator({ autoRotate = true, rotateInterval = 30000 }: QuoteRotatorProps) {
  const { user } = useAuth()
  const { t } = useLanguage()
  const [quote, setQuote] = useState<MotivationalQuote | null>(null)
  const [loading, setLoading] = useState(false)
  const [quotes, setQuotes] = useState<MotivationalQuote[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    loadQuotes()
  }, [user])

  useEffect(() => {
    if (autoRotate && quotes.length > 1) {
      const interval = setInterval(() => {
        rotateQuote()
      }, rotateInterval)
      return () => clearInterval(interval)
    }
  }, [quotes, currentIndex, autoRotate, rotateInterval])

  const loadQuotes = async () => {
    if (!user) return
    
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('motivational_quotes')
        .select('*')
        .eq('is_active', true)
        .order('id')
        
      if (error) {
        console.error('Error loading quotes:', error)
        return
      }
      
      if (data && data.length > 0) {
        setQuotes(data)
        const randomIndex = Math.floor(Math.random() * data.length)
        setCurrentIndex(randomIndex)
        setQuote(data[randomIndex])
      }
    } catch (error) {
      console.error('Error loading motivational quotes:', error)
    } finally {
      setLoading(false)
    }
  }

  const rotateQuote = () => {
    if (quotes.length > 1) {
      const nextIndex = (currentIndex + 1) % quotes.length
      setCurrentIndex(nextIndex)
      setQuote(quotes[nextIndex])
    }
  }

  const handleManualRotate = () => {
    if (quotes.length > 1) {
      rotateQuote()
    } else {
      loadQuotes()
    }
  }

  if (!quote) {
    return null
  }

  return (
    <Card className="card-enhanced bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200/50 dark:border-blue-800/50 animate-fade-in-up">
      <CardContent className="p-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <Quote className="h-4 w-4 text-blue-600 dark:text-blue-400 mb-1" />
            <blockquote className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1 leading-snug animate-fade-in-up">
              "{quote.quote}"
            </blockquote>
            {quote.author && (
              <cite className="text-xs text-gray-600 dark:text-gray-400 not-italic font-medium animate-slide-in-right">
                — {quote.author}
              </cite>
            )}
            {quotes.length > 1 && (
              <div className="mt-2 flex items-center gap-2">
                <div className="flex gap-1">
                  {quotes.map((_, index) => (
                    <div
                      key={index}
                      className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                        index === currentIndex 
                          ? 'bg-blue-600 dark:bg-blue-400 scale-110' 
                          : 'bg-blue-200 dark:bg-blue-800'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {currentIndex + 1} of {quotes.length}
                </span>
              </div>
            )}
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleManualRotate}
            disabled={loading}
            className="ml-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/20 h-7 w-7 p-0"
          >
            <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
