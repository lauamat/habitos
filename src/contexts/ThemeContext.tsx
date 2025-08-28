import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'

type Theme = 'light' | 'dark'
type ColorScheme = 'apple' | 'yellow' | 'blue' | 'green' | 'custom'

interface CustomColors {
  primary: string
  accent: string
}

interface ThemeContextType {
  theme: Theme
  colorScheme: ColorScheme
  customColors: CustomColors
  setTheme: (theme: Theme) => void
  setColorScheme: (scheme: ColorScheme) => void
  setCustomColors: (colors: CustomColors) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

interface ThemeProviderProps {
  children: ReactNode
}

const colorSchemes = {
  apple: {
    primary: '147 51 234', // purple-600
    accent: '99 102 241',  // indigo-500
  },
  yellow: {
    primary: '251 191 36', // yellow-400
    accent: '245 158 11', // yellow-500
  },
  blue: {
    primary: '59 130 246', // blue-500
    accent: '37 99 235',  // blue-600
  },
  green: {
    primary: '34 197 94', // green-500
    accent: '22 163 74', // green-600
  },
  custom: {
    primary: '34 197 94',
    accent: '22 163 74',
  }
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('habit-tracker-theme')
    return (saved as Theme) || 'light'
  })
  
  const [colorScheme, setColorScheme] = useState<ColorScheme>(() => {
    const saved = localStorage.getItem('habit-tracker-color-scheme')
    return (saved as ColorScheme) || 'apple'
  })
  
  const [customColors, setCustomColors] = useState<CustomColors>(() => {
    const saved = localStorage.getItem('habit-tracker-custom-colors')
    return saved ? JSON.parse(saved) : colorSchemes.custom
  })

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement
    
    // Apply theme class
    root.classList.remove('light', 'dark')
    root.classList.add(theme)
    
    // Apply color scheme variables
    const colors = colorScheme === 'custom' ? customColors : colorSchemes[colorScheme]
    
    root.style.setProperty('--color-primary', colors.primary)
    root.style.setProperty('--color-accent', colors.accent)
    
    // Store preferences
    localStorage.setItem('habit-tracker-theme', theme)
    localStorage.setItem('habit-tracker-color-scheme', colorScheme)
    if (colorScheme === 'custom') {
      localStorage.setItem('habit-tracker-custom-colors', JSON.stringify(customColors))
    }
  }, [theme, colorScheme, customColors])

  const handleSetCustomColors = (colors: CustomColors) => {
    setCustomColors(colors)
    if (colorScheme === 'custom') {
      // Immediately apply if custom scheme is active
      const root = document.documentElement
      root.style.setProperty('--color-primary', colors.primary)
      root.style.setProperty('--color-accent', colors.accent)
    }
  }

  const value: ThemeContextType = {
    theme,
    colorScheme,
    customColors,
    setTheme,
    setColorScheme,
    setCustomColors: handleSetCustomColors
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
