import { ButtonHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
}

const buttonVariantStyles = {
  variant: {
    default: 'bg-primary text-white hover:bg-primary-hover',
    outline: 'border border-border bg-background hover:bg-surface hover:text-foreground',
    ghost: 'hover:bg-surface hover:text-foreground',
  },
  size: {
    sm: 'h-9 px-3 text-sm',
    md: 'h-10 px-4 py-2',
    lg: 'h-11 px-8 text-lg',
  }
}

const buttonVariants = (props?: { variant?: 'default' | 'outline' | 'ghost', size?: 'sm' | 'md' | 'lg' }) => {
  const variant = props?.variant || 'default'
  const size = props?.size || 'md'
  return cn(
    'inline-flex items-center justify-center rounded-md font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
    buttonVariantStyles.variant[variant],
    buttonVariantStyles.size[size]
  )
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', ...props }, ref) => {
    return (
      <button
        className={cn(
          buttonVariants({ variant, size }),
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)

Button.displayName = 'Button'

export { Button, buttonVariants }
