import React, { useState } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { 
  Palette,
  Sun,
  Moon,
  Globe,
  Check,
  Settings as SettingsIcon
} from 'lucide-react'

interface SettingsProps {
  onClose?: () => void
}

export function Settings({ onClose }: SettingsProps) {
  const { theme, setTheme, colorScheme, setColorScheme, customColors, setCustomColors } = useTheme()
  const { language, setLanguage, t } = useLanguage()
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [tempColors, setTempColors] = useState(customColors)

  const themes = [
    { id: 'light', name: t('settings.light_mode'), icon: Sun },
    { id: 'dark', name: t('settings.dark_mode'), icon: Moon },
  ]

  const colorSchemes = [
    { id: 'apple', name: t('settings.apple_theme'), colors: ['#9333ea', '#6366f1'] },
    { id: 'yellow', name: t('settings.yellow_theme'), colors: ['#fbbf24', '#f59e0b'] },
    { id: 'blue', name: t('settings.blue_theme'), colors: ['#3b82f6', '#2563eb'] },
    { id: 'green', name: t('settings.green_theme'), colors: ['#22c55e', '#16a34a'] },
    { id: 'custom', name: t('settings.custom_theme'), colors: ['custom', 'custom'] },
  ]

  const languages = [
    { id: 'en', name: 'English', flag: '🇺🇸' },
    { id: 'es', name: 'Español', flag: '🇪🇸' },
  ]

  const handleApplyCustomColors = () => {
    setCustomColors(tempColors)
    setShowColorPicker(false)
  }

  const rgbToHex = (rgb: string) => {
    const [r, g, b] = rgb.split(' ').map(Number)
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`
  }

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    if (!result) return '0 0 0'
    const r = parseInt(result[1], 16)
    const g = parseInt(result[2], 16)
    const b = parseInt(result[3], 16)
    return `${r} ${g} ${b}`
  }

  return (
    <div className="space-y-4 animate-fade-in-up">
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 bg-[rgb(var(--color-primary))] rounded-lg flex items-center justify-center">
          <SettingsIcon className="h-4 w-4 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold">{t('settings.title')}</h2>
          <p className="text-sm text-muted-foreground">
            Customize your experience
          </p>
        </div>
      </div>

      {/* Theme Selection */}
      <Card className="card-enhanced">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Palette className="h-4 w-4" />
            {t('settings.theme')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {themes.map((themeOption) => {
              const Icon = themeOption.icon
              const isActive = theme === themeOption.id
              return (
                <button
                  key={themeOption.id}
                  onClick={() => setTheme(themeOption.id as any)}
                  className={`p-3 rounded-lg border-2 transition-all hover:scale-105 ${
                    isActive 
                      ? 'border-[rgb(var(--color-primary))] bg-[rgb(var(--color-primary))]/5' 
                      : 'border-border hover:border-[rgb(var(--color-primary))]/50'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <Icon className="h-4 w-4" />
                    <span className="text-sm font-medium">{themeOption.name}</span>
                    {isActive && <Check className="h-3 w-3 text-[rgb(var(--color-primary))]" />}
                  </div>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Language Selection */}
      <Card className="card-enhanced">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Globe className="h-4 w-4" />
            {t('settings.language')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {languages.map((lang) => {
              const isActive = language === lang.id
              return (
                <button
                  key={lang.id}
                  onClick={() => setLanguage(lang.id as any)}
                  className={`p-3 rounded-lg border-2 transition-all hover:scale-105 ${
                    isActive 
                      ? 'border-[rgb(var(--color-primary))] bg-[rgb(var(--color-primary))]/5' 
                      : 'border-border hover:border-[rgb(var(--color-primary))]/50'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-base">{lang.flag}</span>
                    <span className="text-sm font-medium">{lang.name}</span>
                    {isActive && <Check className="h-3 w-3 text-[rgb(var(--color-primary))]" />}
                  </div>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Color Scheme Selection */}
      <Card className="card-enhanced">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t('settings.color_scheme')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {colorSchemes.map((scheme) => {
              const isActive = colorScheme === scheme.id
              return (
                <button
                  key={scheme.id}
                  onClick={() => {
                    setColorScheme(scheme.id as any)
                    if (scheme.id === 'custom') {
                      setShowColorPicker(true)
                    }
                  }}
                  className={`p-3 rounded-lg border-2 transition-all hover:scale-[1.02] ${
                    isActive 
                      ? 'border-[rgb(var(--color-primary))] bg-[rgb(var(--color-primary))]/5' 
                      : 'border-border hover:border-[rgb(var(--color-primary))]/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        {scheme.colors.map((color, idx) => (
                          <div
                            key={idx}
                            className="w-3 h-3 rounded-full border border-white/20"
                            style={{
                              backgroundColor: color === 'custom' 
                                ? (idx === 0 ? `rgb(${customColors.primary})` : `rgb(${customColors.accent})`) 
                                : color
                            }}
                          />
                        ))}
                      </div>
                      <span className="text-sm font-medium">{scheme.name}</span>
                    </div>
                    {isActive && <Check className="h-3 w-3 text-[rgb(var(--color-primary))]" />}
                  </div>
                </button>
              )
            })}
          </div>
          
          {/* Custom Color Picker */}
          {showColorPicker && (
            <div className="space-y-3 p-3 bg-muted/50 rounded-lg animate-scale-in">
              <h4 className="text-sm font-medium">{t('settings.custom_colors')}</h4>
              <div className="space-y-2">
                <div className="space-y-1">
                  <Label htmlFor="primary-color" className="text-xs">{t('settings.primary_color')}</Label>
                  <div className="flex items-center gap-2">
                    <input
                      id="primary-color"
                      type="color"
                      value={rgbToHex(tempColors.primary)}
                      onChange={(e) => setTempColors(prev => ({ 
                        ...prev, 
                        primary: hexToRgb(e.target.value) 
                      }))}
                      className="w-10 h-8 rounded border border-input bg-transparent cursor-pointer"
                    />
                    <div className="text-xs text-muted-foreground font-mono">
                      {rgbToHex(tempColors.primary)}
                    </div>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="accent-color" className="text-xs">{t('settings.accent_color')}</Label>
                  <div className="flex items-center gap-2">
                    <input
                      id="accent-color"
                      type="color"
                      value={rgbToHex(tempColors.accent)}
                      onChange={(e) => setTempColors(prev => ({ 
                        ...prev, 
                        accent: hexToRgb(e.target.value) 
                      }))}
                      className="w-10 h-8 rounded border border-input bg-transparent cursor-pointer"
                    />
                    <div className="text-xs text-muted-foreground font-mono">
                      {rgbToHex(tempColors.accent)}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  <Button onClick={handleApplyCustomColors} className="btn-primary text-xs h-7 px-3">
                    {t('settings.apply')}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setShowColorPicker(false)
                      setTempColors(customColors)
                    }}
                    className="text-xs h-7 px-3"
                  >
                    {t('habits.cancel')}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {onClose && (
        <div className="flex justify-end">
          <Button onClick={onClose} variant="outline">
            Done
          </Button>
        </div>
      )}
    </div>
  )
}
