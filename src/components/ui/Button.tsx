import React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { clsx } from 'clsx'

// Button variants using CVA for consistent styling
const buttonVariants = cva(
  // Base styles - mobile-first, touch-friendly
  [
    'inline-flex items-center justify-center',
    'min-h-[44px] px-4 py-2', // 44px minimum touch target
    'text-sm font-medium',
    'border border-transparent rounded-lg',
    'transition-colors duration-200',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    'disabled:pointer-events-none disabled:opacity-50',
    'select-none'
  ],
  {
    variants: {
      variant: {
        primary: [
          'bg-blue-600 text-white',
          'hover:bg-blue-700',
          'focus-visible:ring-blue-500',
          'disabled:bg-blue-300'
        ],
        secondary: [
          'bg-gray-100 text-gray-900 border-gray-200',
          'hover:bg-gray-200',
          'focus-visible:ring-gray-500',
          'disabled:bg-gray-50'
        ],
        danger: [
          'bg-red-600 text-white',
          'hover:bg-red-700',
          'focus-visible:ring-red-500',
          'disabled:bg-red-300'
        ],
        success: [
          'bg-green-600 text-white',
          'hover:bg-green-700',
          'focus-visible:ring-green-500',
          'disabled:bg-green-300'
        ],
        warning: [
          'bg-yellow-500 text-white',
          'hover:bg-yellow-600',
          'focus-visible:ring-yellow-500',
          'disabled:bg-yellow-300'
        ],
        outline: [
          'border-gray-300 bg-white text-gray-700',
          'hover:bg-gray-50',
          'focus-visible:ring-gray-500',
          'disabled:border-gray-100 disabled:text-gray-400'
        ],
        ghost: [
          'text-gray-700',
          'hover:bg-gray-100',
          'focus-visible:ring-gray-500',
          'disabled:text-gray-400'
        ],
        link: [
          'text-blue-600 underline-offset-4',
          'hover:underline',
          'focus-visible:ring-blue-500',
          'disabled:text-blue-300'
        ]
      },
      size: {
        xs: 'min-h-[32px] px-2 py-1 text-xs',
        sm: 'min-h-[36px] px-3 py-1.5 text-xs',
        md: 'min-h-[44px] px-4 py-2 text-sm',
        lg: 'min-h-[48px] px-6 py-3 text-base',
        xl: 'min-h-[52px] px-8 py-4 text-lg'
      },
      fullWidth: {
        true: 'w-full',
        false: 'w-auto'
      }
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      fullWidth: false
    }
  }
)

// Loading spinner component
const LoadingSpinner = ({ size = 'sm' }: { size?: 'xs' | 'sm' | 'md' | 'lg' }) => {
  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  }

  return (
    <svg
      className={clsx('animate-spin', sizeClasses[size])}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  )
}

// Button component interface
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean
  loadingText?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  children: React.ReactNode
}

// Main Button component
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      fullWidth,
      loading = false,
      loadingText,
      leftIcon,
      rightIcon,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading
    const spinnerSize = size === 'xs' ? 'xs' : size === 'sm' ? 'sm' : size === 'lg' ? 'md' : size === 'xl' ? 'lg' : 'sm'

    return (
      <button
        className={clsx(buttonVariants({ variant, size, fullWidth }), className)}
        ref={ref}
        disabled={isDisabled}
        {...props}
      >
        {/* Left icon or loading spinner */}
        {loading && (
          <LoadingSpinner size={spinnerSize} />
        )}
        {!loading && leftIcon && (
          <span className="mr-2">{leftIcon}</span>
        )}
        
        {/* Button text */}
        <span className={clsx(loading && 'ml-2')}>
          {loading && loadingText ? loadingText : children}
        </span>
        
        {/* Right icon */}
        {!loading && rightIcon && (
          <span className="ml-2">{rightIcon}</span>
        )}
      </button>
    )
  }
)

Button.displayName = 'Button'

// Export types for external use
export type { VariantProps }

// Usage examples (for documentation)
export const ButtonExamples = () => {
  return (
    <div className="space-y-4 p-4">
      <h3 className="text-lg font-semibold">Button Examples</h3>
      
      {/* Variants */}
      <div className="space-y-2">
        <h4 className="font-medium">Variants</h4>
        <div className="flex flex-wrap gap-2">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="danger">Danger</Button>
          <Button variant="success">Success</Button>
          <Button variant="warning">Warning</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
        </div>
      </div>

      {/* Sizes */}
      <div className="space-y-2">
        <h4 className="font-medium">Sizes</h4>
        <div className="flex flex-wrap items-end gap-2">
          <Button size="xs">Extra Small</Button>
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">Large</Button>
          <Button size="xl">Extra Large</Button>
        </div>
      </div>

      {/* States */}
      <div className="space-y-2">
        <h4 className="font-medium">States</h4>
        <div className="flex flex-wrap gap-2">
          <Button>Normal</Button>
          <Button loading>Loading</Button>
          <Button loading loadingText="Saving...">Save</Button>
          <Button disabled>Disabled</Button>
        </div>
      </div>

      {/* With Icons */}
      <div className="space-y-2">
        <h4 className="font-medium">With Icons</h4>
        <div className="flex flex-wrap gap-2">
          <Button leftIcon={<span>👤</span>}>Add User</Button>
          <Button rightIcon={<span>→</span>}>Continue</Button>
          <Button 
            leftIcon={<span>💾</span>} 
            rightIcon={<span>✓</span>}
          >
            Save & Continue
          </Button>
        </div>
      </div>

      {/* Full Width */}
      <div className="space-y-2">
        <h4 className="font-medium">Full Width</h4>
        <Button fullWidth>Full Width Button</Button>
      </div>
    </div>
  )
}