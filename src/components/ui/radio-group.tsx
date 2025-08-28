import React from 'react'
import { cn } from '@/lib/utils'

interface RadioGroupContextType {
  value?: string
  onValueChange?: (value: string) => void
}

const RadioGroupContext = React.createContext<RadioGroupContextType>({})

const RadioGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    value?: string
    onValueChange?: (value: string) => void
  }
>(({ className, value, onValueChange, ...props }, ref) => {
  return (
    <RadioGroupContext.Provider value={{ value, onValueChange }}>
      <div
        ref={ref}
        className={cn('grid gap-2', className)}
        role="radiogroup"
        {...props}
      />
    </RadioGroupContext.Provider>
  )
})
RadioGroup.displayName = 'RadioGroup'

const RadioGroupItem = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    value: string
  }
>(({ className, value, onClick, ...props }, ref) => {
  const context = React.useContext(RadioGroupContext)
  const isChecked = context.value === value
  
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    context.onValueChange?.(value)
    onClick?.(e)
  }
  
  return (
    <button
      ref={ref}
      className={cn(
        'aspect-square h-4 w-4 rounded-full border border-primary text-primary shadow focus:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
        isChecked && 'bg-primary text-primary-foreground',
        className
      )}
      role="radio"
      aria-checked={isChecked}
      onClick={handleClick}
      {...props}
    >
      {isChecked && (
        <div className="flex items-center justify-center">
          <div className="h-2 w-2 rounded-full bg-current" />
        </div>
      )}
    </button>
  )
})
RadioGroupItem.displayName = 'RadioGroupItem'

export { RadioGroup, RadioGroupItem }