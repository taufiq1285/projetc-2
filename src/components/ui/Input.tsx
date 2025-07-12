import React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { clsx } from 'clsx'

// Input variants using CVA
const inputVariants = cva(
  // Base styles - mobile-first, touch-friendly
  [
    'flex w-full rounded-lg border border-gray-300',
    'bg-white px-3 py-2',
    'text-sm text-gray-900 placeholder:text-gray-500',
    'min-h-[44px]', // Touch-friendly height
    'transition-colors duration-200',
    'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
    'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed',
    'read-only:bg-gray-50 read-only:focus:ring-0'
  ],
  {
    variants: {
      size: {
        sm: 'min-h-[36px] px-2 py-1.5 text-xs',
        md: 'min-h-[44px] px-3 py-2 text-sm',
        lg: 'min-h-[48px] px-4 py-3 text-base'
      },
      variant: {
        default: 'border-gray-300 focus:ring-blue-500',
        error: 'border-red-300 focus:ring-red-500 focus:border-red-500',
        success: 'border-green-300 focus:ring-green-500 focus:border-green-500',
        warning: 'border-yellow-300 focus:ring-yellow-500 focus:border-yellow-500'
      }
    },
    defaultVariants: {
      size: 'md',
      variant: 'default'
    }
  }
)

// Label component
const Label = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement> & {
    required?: boolean
    size?: 'sm' | 'md' | 'lg'
  }
>(({ className, required, size = 'md', children, ...props }, ref) => {
  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  }

  return (
    <label
      ref={ref}
      className={clsx(
        'block font-medium text-gray-700 mb-1',
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {children}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
  )
})
Label.displayName = 'Label'

// Helper text component
const HelperText = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement> & {
    variant?: 'default' | 'error' | 'success' | 'warning'
    size?: 'sm' | 'md' | 'lg'
  }
>(({ className, variant = 'default', size = 'md', children, ...props }, ref) => {
  const variantClasses = {
    default: 'text-gray-600',
    error: 'text-red-600',
    success: 'text-green-600',
    warning: 'text-yellow-600'
  }

  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  }

  return (
    <p
      ref={ref}
      className={clsx(
        'mt-1',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {children}
    </p>
  )
})
HelperText.displayName = 'HelperText'

// Input wrapper for icons and additional elements
const InputWrapper = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    size?: 'sm' | 'md' | 'lg'
  }
>(({ className, size = 'md', children, ...props }, ref) => {
  const sizeClasses = {
    sm: 'min-h-[36px]',
    md: 'min-h-[44px]',
    lg: 'min-h-[48px]'
  }

  return (
    <div
      ref={ref}
      className={clsx(
        'relative flex items-center',
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
})
InputWrapper.displayName = 'InputWrapper'

// Main Input component interface
export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {
  label?: string
  helperText?: string
  error?: string
  success?: string
  warning?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  leftElement?: React.ReactNode
  rightElement?: React.ReactNode
  required?: boolean
  fullWidth?: boolean
}

// Main Input component
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = 'text',
      size,
      variant,
      label,
      helperText,
      error,
      success,
      warning,
      leftIcon,
      rightIcon,
      leftElement,
      rightElement,
      required,
      fullWidth = true,
      id,
      ...props
    },
    ref
  ) => {
    // Generate unique ID if not provided
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`
    
    // Determine variant based on state
    const effectiveVariant = error ? 'error' : success ? 'success' : warning ? 'warning' : variant
    
    // Determine helper text and variant
    const effectiveHelperText = error || success || warning || helperText
    const helperVariant = error ? 'error' : success ? 'success' : warning ? 'warning' : 'default'

    // Handle null size by defaulting to 'md'
    const effectiveSize = size || 'md'

    const hasLeftElement = leftIcon || leftElement
    const hasRightElement = rightIcon || rightElement

    return (
      <div className={clsx('w-full', !fullWidth && 'w-auto')}>
        {/* Label */}
        {label && (
          <Label htmlFor={inputId} required={required} size={effectiveSize}>
            {label}
          </Label>
        )}

        {/* Input container */}
        <InputWrapper size={effectiveSize}>
          {/* Left icon/element */}
          {hasLeftElement && (
            <div className="absolute left-3 flex items-center pointer-events-none">
              {leftIcon && (
                <span className="text-gray-400 text-sm">{leftIcon}</span>
              )}
              {leftElement}
            </div>
          )}

          {/* Main input */}
          <input
            type={type}
            id={inputId}
            ref={ref}
            className={clsx(
              inputVariants({ size, variant: effectiveVariant }),
              hasLeftElement && 'pl-10',
              hasRightElement && 'pr-10',
              className
            )}
            {...props}
          />

          {/* Right icon/element */}
          {hasRightElement && (
            <div className="absolute right-3 flex items-center">
              {rightIcon && (
                <span className="text-gray-400 text-sm">{rightIcon}</span>
              )}
              {rightElement}
            </div>
          )}
        </InputWrapper>

        {/* Helper text */}
        {effectiveHelperText && (
          <HelperText variant={helperVariant} size={effectiveSize}>
            {effectiveHelperText}
          </HelperText>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

// Specialized input components
export const PasswordInput = React.forwardRef<HTMLInputElement, InputProps>(
  ({ rightElement, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false)

    const togglePassword = () => setShowPassword(!showPassword)

    return (
      <Input
        ref={ref}
        type={showPassword ? 'text' : 'password'}
        rightElement={
          rightElement || (
            <button
              type="button"
              onClick={togglePassword}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1"
              tabIndex={-1}
            >
              {showPassword ? (
                <span className="text-sm">🙈</span>
              ) : (
                <span className="text-sm">👁️</span>
              )}
            </button>
          )
        }
        {...props}
      />
    )
  }
)
PasswordInput.displayName = 'PasswordInput'

export const SearchInput = React.forwardRef<HTMLInputElement, InputProps>(
  ({ leftIcon, placeholder = 'Search...', ...props }, ref) => {
    return (
      <Input
        ref={ref}
        type="text"
        leftIcon={leftIcon || <span className="text-sm">🔍</span>}
        placeholder={placeholder}
        {...props}
      />
    )
  }
)
SearchInput.displayName = 'SearchInput'

// Export additional components
export { Label, HelperText, InputWrapper }

// Usage examples
export const InputExamples = () => {
  const [values, setValues] = React.useState({
    basic: '',
    email: '',
    password: '',
    search: '',
    withError: '',
    withSuccess: '',
    disabled: 'Disabled value'
  })

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setValues(prev => ({ ...prev, [field]: e.target.value }))
  }

  return (
    <div className="space-y-6 p-4 max-w-md">
      <h3 className="text-lg font-semibold">Input Examples</h3>
      
      {/* Basic Input */}
      <Input
        label="Basic Input"
        placeholder="Enter text here..."
        value={values.basic}
        onChange={handleChange('basic')}
        helperText="This is a basic input field"
      />

      {/* Required Input */}
      <Input
        label="Email Address"
        type="email"
        required
        placeholder="user@example.com"
        value={values.email}
        onChange={handleChange('email')}
        leftIcon={<span>📧</span>}
      />

      {/* Password Input */}
      <PasswordInput
        label="Password"
        placeholder="Enter your password"
        value={values.password}
        onChange={handleChange('password')}
        required
      />

      {/* Search Input */}
      <SearchInput
        label="Search"
        placeholder="Search items..."
        value={values.search}
        onChange={handleChange('search')}
      />

      {/* Input with Error */}
      <Input
        label="Input with Error"
        placeholder="This field has an error"
        value={values.withError}
        onChange={handleChange('withError')}
        error="This field is required"
      />

      {/* Input with Success */}
      <Input
        label="Input with Success"
        placeholder="This field is valid"
        value={values.withSuccess}
        onChange={handleChange('withSuccess')}
        success="Looks good!"
      />

      {/* Disabled Input */}
      <Input
        label="Disabled Input"
        value={values.disabled}
        disabled
        helperText="This input is disabled"
      />

      {/* Different Sizes */}
      <div className="space-y-2">
        <h4 className="font-medium">Sizes</h4>
        <Input size="sm" placeholder="Small input" />
        <Input size="md" placeholder="Medium input (default)" />
        <Input size="lg" placeholder="Large input" />
      </div>

      {/* With custom elements */}
      <Input
        label="Custom Elements"
        placeholder="0.00"
        leftElement={<span className="text-gray-500 text-sm">$</span>}
        rightElement={<span className="text-gray-500 text-sm">USD</span>}
      />
    </div>
  )
}