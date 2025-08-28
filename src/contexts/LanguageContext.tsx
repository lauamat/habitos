import React, { createContext, useContext, useState, ReactNode } from 'react'

type Language = 'en' | 'es'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}

interface LanguageProviderProps {
  children: ReactNode
}

// Translation dictionary
const translations = {
  en: {
    // App General
    'app.title': 'Habit Tracker',
    'app.subtitle': 'Transform your life, one habit at a time',
    'app.welcome': 'Welcome back',
    'app.loading': 'Loading your habit tracker...',
    'app.built_with_love': 'Built with',
    'app.by': 'by MiniMax Agent',
    
    // Navigation
    'nav.today': 'Today',
    'nav.weekly': 'Weekly',
    'nav.monthly': 'Monthly',
    'nav.analytics': 'Analytics',
    'nav.settings': 'Settings',
    
    // Auth
    'auth.sign_in': 'Sign In',
    'auth.sign_up': 'Sign Up',
    'auth.sign_out': 'Sign Out',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.full_name': 'Full Name',
    'auth.create_account': 'Create Account',
    'auth.have_account': 'Already have an account?',
    'auth.no_account': 'Don\'t have an account?',
    
    // Habits
    'habits.new_habit': 'New Habit',
    'habits.create_first': 'Create Your First Habit',
    'habits.start_journey': 'Start Your Habit Journey',
    'habits.journey_description': 'Create your first habit to begin building the life you want. Small consistent actions lead to big transformations.',
    'habits.edit': 'Edit Habit',
    'habits.delete': 'Delete Habit',
    'habits.delete_confirm': 'Are you sure you want to delete this habit?',
    'habits.name': 'Habit Name',
    'habits.description': 'Description',
    'habits.motivation': 'Motivation',
    'habits.frequency': 'Frequency',
    'habits.daily': 'Daily',
    'habits.alternate': 'Alternate Days',
    'habits.custom': 'Custom Days',
    'habits.save': 'Save Habit',
    'habits.cancel': 'Cancel',
    'habits.completed': 'completed',
    'habits.loading': 'Loading your habits...',
    'habits.no_habits_today': 'No habits scheduled for today',
    
    // Analytics
    'analytics.title': 'Analytics Dashboard',
    'analytics.today_progress': 'Today\'s Progress',
    'analytics.weekly_average': 'Weekly Average',
    'analytics.monthly_average': 'Monthly Average',
    'analytics.active_habits': 'Active Habits',
    'analytics.longest_streak': 'Longest Streak',
    'analytics.total_completions': 'Total Completions',
    'analytics.performance_overview': 'Performance Overview',
    'analytics.active_streaks': 'Active Streaks',
    'analytics.abandoned_habits': 'Most Abandoned Habits',
    'analytics.no_streaks': 'No active streaks yet',
    'analytics.build_streaks': 'Complete habits to start building streaks!',
    'analytics.this_week': 'This Week',
    'analytics.this_month': 'This Month',
    'analytics.daily_average': 'Daily Average',
    'analytics.completions': 'completions',
    'analytics.days': 'days',
    'analytics.day_view': 'Day',
    'analytics.week_view': 'Week',
    'analytics.month_view': 'Month',
    'analytics.total_mode': 'Total',
    'analytics.per_habit_mode': 'Per Habit',
    'analytics.last_7_days': 'Last 7 days',
    'analytics.last_30_days': 'Last 30 days',
    'analytics.last_90_days': 'Last 90 days',
    'analytics.custom_range': 'Custom Range',
    'analytics.export_csv': 'Export CSV',
    'analytics.no_data': 'No data available for the selected period',
    
    // Time periods
    'time.today': 'Today',
    'time.yesterday': 'Yesterday',
    'time.this_week': 'This week',
    'time.last_week': 'Last week',
    'time.this_month': 'This month',
    'time.last_month': 'Last month',
    
    // Days of week
    'days.monday': 'Monday',
    'days.tuesday': 'Tuesday',
    'days.wednesday': 'Wednesday',
    'days.thursday': 'Thursday',
    'days.friday': 'Friday',
    'days.saturday': 'Saturday',
    'days.sunday': 'Sunday',
    
    // Settings
    'settings.title': 'Settings',
    'settings.theme': 'Theme',
    'settings.language': 'Language',
    'settings.color_scheme': 'Color Scheme',
    'settings.custom_colors': 'Custom Colors',
    'settings.light_mode': 'Light Mode',
    'settings.dark_mode': 'Dark Mode',
    'settings.apple_theme': 'Apple Style',
    'settings.yellow_theme': 'Warm Yellow',
    'settings.blue_theme': 'Professional Blue',
    'settings.green_theme': 'Nature Green',
    'settings.custom_theme': 'Custom Colors',
    'settings.primary_color': 'Primary Color',
    'settings.accent_color': 'Accent Color',
    'settings.apply': 'Apply',
    
    // Messages
    'messages.habit_created': 'Habit created successfully',
    'messages.habit_updated': 'Habit updated successfully',
    'messages.habit_deleted': 'Habit deleted successfully',
    'messages.error_loading': 'Failed to load data. Please try again.',
    'messages.error_saving': 'Failed to save. Please try again.',
    'messages.error_deleting': 'Failed to delete habit. Please try again.',
    'messages.error_updating': 'Failed to update habit. Please try again.',
  },
  es: {
    // App General
    'app.title': 'Seguidor de Hábitos',
    'app.subtitle': 'Transforma tu vida, un hábito a la vez',
    'app.welcome': 'Bienvenido de vuelta',
    'app.loading': 'Cargando tu seguidor de hábitos...',
    'app.built_with_love': 'Hecho con',
    'app.by': 'por MiniMax Agent',
    
    // Navigation
    'nav.today': 'Hoy',
    'nav.weekly': 'Semanal',
    'nav.monthly': 'Mensual',
    'nav.analytics': 'Analíticas',
    'nav.settings': 'Configuración',
    
    // Auth
    'auth.sign_in': 'Iniciar Sesión',
    'auth.sign_up': 'Registrarse',
    'auth.sign_out': 'Cerrar Sesión',
    'auth.email': 'Correo Electrónico',
    'auth.password': 'Contraseña',
    'auth.full_name': 'Nombre Completo',
    'auth.create_account': 'Crear Cuenta',
    'auth.have_account': '¿Ya tienes una cuenta?',
    'auth.no_account': '¿No tienes una cuenta?',
    
    // Habits
    'habits.new_habit': 'Nuevo Hábito',
    'habits.create_first': 'Crea Tu Primer Hábito',
    'habits.start_journey': 'Inicia Tu Viaje de Hábitos',
    'habits.journey_description': 'Crea tu primer hábito para comenzar a construir la vida que quieres. Las pequeñas acciones consistentes llevan a grandes transformaciones.',
    'habits.edit': 'Editar Hábito',
    'habits.delete': 'Eliminar Hábito',
    'habits.delete_confirm': '¿Estás seguro de que quieres eliminar este hábito?',
    'habits.name': 'Nombre del Hábito',
    'habits.description': 'Descripción',
    'habits.motivation': 'Motivación',
    'habits.frequency': 'Frecuencia',
    'habits.daily': 'Diario',
    'habits.alternate': 'Días Alternos',
    'habits.custom': 'Días Personalizados',
    'habits.save': 'Guardar Hábito',
    'habits.cancel': 'Cancelar',
    'habits.completed': 'completado',
    'habits.loading': 'Cargando tus hábitos...',
    'habits.no_habits_today': 'No hay hábitos programados para hoy',
    
    // Analytics
    'analytics.title': 'Panel de Analíticas',
    'analytics.today_progress': 'Progreso de Hoy',
    'analytics.weekly_average': 'Promedio Semanal',
    'analytics.monthly_average': 'Promedio Mensual',
    'analytics.active_habits': 'Hábitos Activos',
    'analytics.longest_streak': 'Racha Más Larga',
    'analytics.total_completions': 'Completaciones Totales',
    'analytics.performance_overview': 'Resumen de Rendimiento',
    'analytics.active_streaks': 'Rachas Activas',
    'analytics.abandoned_habits': 'Hábitos Más Abandonados',
    'analytics.no_streaks': 'Aún no hay rachas activas',
    'analytics.build_streaks': '¡Completa hábitos para comenzar a construir rachas!',
    'analytics.this_week': 'Esta Semana',
    'analytics.this_month': 'Este Mes',
    'analytics.daily_average': 'Promedio Diario',
    'analytics.completions': 'completaciones',
    'analytics.days': 'días',
    'analytics.day_view': 'Día',
    'analytics.week_view': 'Semana',
    'analytics.month_view': 'Mes',
    'analytics.total_mode': 'Total',
    'analytics.per_habit_mode': 'Por Hábito',
    'analytics.last_7_days': 'Últimos 7 días',
    'analytics.last_30_days': 'Últimos 30 días',
    'analytics.last_90_days': 'Últimos 90 días',
    'analytics.custom_range': 'Rango Personalizado',
    'analytics.export_csv': 'Exportar CSV',
    'analytics.no_data': 'No hay datos disponibles para el período seleccionado',
    
    // Time periods
    'time.today': 'Hoy',
    'time.yesterday': 'Ayer',
    'time.this_week': 'Esta semana',
    'time.last_week': 'Semana pasada',
    'time.this_month': 'Este mes',
    'time.last_month': 'Mes pasado',
    
    // Days of week
    'days.monday': 'Lunes',
    'days.tuesday': 'Martes',
    'days.wednesday': 'Miércoles',
    'days.thursday': 'Jueves',
    'days.friday': 'Viernes',
    'days.saturday': 'Sábado',
    'days.sunday': 'Domingo',
    
    // Settings
    'settings.title': 'Configuración',
    'settings.theme': 'Tema',
    'settings.language': 'Idioma',
    'settings.color_scheme': 'Esquema de Colores',
    'settings.custom_colors': 'Colores Personalizados',
    'settings.light_mode': 'Modo Claro',
    'settings.dark_mode': 'Modo Oscuro',
    'settings.apple_theme': 'Estilo Apple',
    'settings.yellow_theme': 'Amarillo Cálido',
    'settings.blue_theme': 'Azul Profesional',
    'settings.green_theme': 'Verde Natural',
    'settings.custom_theme': 'Colores Personalizados',
    'settings.primary_color': 'Color Primario',
    'settings.accent_color': 'Color de Acento',
    'settings.apply': 'Aplicar',
    
    // Messages
    'messages.habit_created': 'Hábito creado exitosamente',
    'messages.habit_updated': 'Hábito actualizado exitosamente',
    'messages.habit_deleted': 'Hábito eliminado exitosamente',
    'messages.error_loading': 'Error al cargar datos. Por favor, inténtalo de nuevo.',
    'messages.error_saving': 'Error al guardar. Por favor, inténtalo de nuevo.',
    'messages.error_deleting': 'Error al eliminar el hábito. Por favor, inténtalo de nuevo.',
    'messages.error_updating': 'Error al actualizar el hábito. Por favor, inténtalo de nuevo.',
  }
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('habit-tracker-language')
    return (saved as Language) || 'en'
  })

  const t = (key: string): string => {
    return translations[language][key] || key
  }

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang)
    localStorage.setItem('habit-tracker-language', lang)
    
    // Update document language
    document.documentElement.lang = lang
  }

  const value: LanguageContextType = {
    language,
    setLanguage: handleSetLanguage,
    t
  }

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}
