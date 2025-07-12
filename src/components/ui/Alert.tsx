import React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { clsx } from 'clsx'

// Alert variants using CVA
const alertVariants = cva(
  // Base styles
  [
    'relative flex items-start gap-3 rounded-lg border p-4',
    'transition-colors duration-200'
  ],
  {
    variants: {
      variant: {
        default: [
          'border-gray-200 bg-gray-50 text-gray-800',
          '[&>svg]:text-gray-600'
        ],
        info: [
          'border-blue-200 bg-blue-50 text-blue-800',
          '[&>svg]:text-blue-600'
        ],
        success: [
          'border-green-200 bg-green-50 text-green-800',
          '[&>svg]:text-green-600'
        ],
        warning: [
          'border-yellow-200 bg-yellow-50 text-yellow-800',
          '[&>svg]:text-yellow-600'
        ],
        error: [
          'border-red-200 bg-red-50 text-red-800',
          '[&>svg]:text-red-600'
        ]
      },
      size: {
        sm: 'p-3 text-sm',
        md: 'p-4 text-sm',
        lg: 'p-5 text-base'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'md'
    }
  }
)

// Alert Title component
export interface AlertTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
  size?: 'sm' | 'md' | 'lg'
}

export const AlertTitle = React.forwardRef<HTMLHeadingElement, AlertTitleProps>(
  ({ className, as: Component = 'h4', size = 'md', children, ...props }, ref) => {
    const sizeClasses = {
      sm: 'text-sm font-medium',
      md: 'text-base font-medium',
      lg: 'text-lg font-semibold'
    }

    return (
      <Component
        ref={ref}
        className={clsx(
          'leading-tight mb-1',
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {children}
      </Component>
    )
  }
)
AlertTitle.displayName = 'AlertTitle'

// Alert Description component
export interface AlertDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  size?: 'sm' | 'md' | 'lg'
}

export const AlertDescription = React.forwardRef<HTMLParagraphElement, AlertDescriptionProps>(
  ({ className, size = 'md', children, ...props }, ref) => {
    const sizeClasses = {
      sm: 'text-xs',
      md: 'text-sm',
      lg: 'text-base'
    }

    return (
      <p
        ref={ref}
        className={clsx(
          'leading-relaxed opacity-90',
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {children}
      </p>
    )
  }
)
AlertDescription.displayName = 'AlertDescription'

// Default icons for each variant
const DefaultIcons = {
  default: (
    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  info: (
    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  success: (
    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  warning: (
    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.317 16.5c-.77.833.192 2.5 1.732 2.5z" />
    </svg>
  ),
  error: (
    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

// Main Alert component interface
export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  icon?: React.ReactNode | boolean
  title?: string
  description?: string
  dismissible?: boolean
  onDismiss?: () => void
  actions?: React.ReactNode
}

// Main Alert component
export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  (
    {
      className,
      variant = 'default',
      size,
      icon = true,
      title,
      description,
      dismissible = false,
      onDismiss,
      actions,
      children,
      ...props
    },
    ref
  ) => {
    // Determine icon to show
    const iconElement = React.useMemo(() => {
      if (icon === false) return null
      if (icon === true) return DefaultIcons[variant || 'default']
      return icon
    }, [icon, variant])

    return (
      <div
        ref={ref}
        className={clsx(alertVariants({ variant, size }), className)}
        role="alert"
        {...props}
      >
        {/* Icon */}
        {iconElement && (
          <div className="flex-shrink-0 mt-0.5">
            {iconElement}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          {title && (
            <AlertTitle size={size || 'md'}>
              {title}
            </AlertTitle>
          )}
          
          {description && (
            <AlertDescription size={size || 'md'}>
              {description}
            </AlertDescription>
          )}
          
          {children && (
            <div className={title || description ? 'mt-2' : ''}>
              {children}
            </div>
          )}
          
          {actions && (
            <div className="flex gap-2 mt-3">
              {actions}
            </div>
          )}
        </div>

        {/* Dismiss button */}
        {dismissible && onDismiss && (
          <div className="flex-shrink-0">
            <button
              type="button"
              onClick={onDismiss}
              className="inline-flex rounded-md p-1.5 text-current hover:bg-black/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-current transition-colors"
              aria-label="Dismiss alert"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
      </div>
    )
  }
)
Alert.displayName = 'Alert'

// Specialized Alert components
export const SuccessAlert = React.forwardRef<
  HTMLDivElement,
  Omit<AlertProps, 'variant'>
>(({ ...props }, ref) => {
  return <Alert ref={ref} variant="success" {...props} />
})
SuccessAlert.displayName = 'SuccessAlert'

export const ErrorAlert = React.forwardRef<
  HTMLDivElement,
  Omit<AlertProps, 'variant'>
>(({ ...props }, ref) => {
  return <Alert ref={ref} variant="error" {...props} />
})
ErrorAlert.displayName = 'ErrorAlert'

export const WarningAlert = React.forwardRef<
  HTMLDivElement,
  Omit<AlertProps, 'variant'>
>(({ ...props }, ref) => {
  return <Alert ref={ref} variant="warning" {...props} />
})
WarningAlert.displayName = 'WarningAlert'

export const InfoAlert = React.forwardRef<
  HTMLDivElement,
  Omit<AlertProps, 'variant'>
>(({ ...props }, ref) => {
  return <Alert ref={ref} variant="info" {...props} />
})
InfoAlert.displayName = 'InfoAlert'

// Toast-style Alert component
export interface ToastAlertProps extends AlertProps {
  show: boolean
  duration?: number
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center'
  animation?: 'slide' | 'fade' | 'scale'
}

export const ToastAlert = React.forwardRef<HTMLDivElement, ToastAlertProps>(
  (
    {
      show,
      duration = 5000,
      position = 'top-right',
      animation = 'slide',
      onDismiss,
      className,
      ...props
    },
    ref
  ) => {
    const [visible, setVisible] = React.useState(show)
    const timeoutRef = React.useRef<NodeJS.Timeout | null>(null)

    // Handle auto-dismiss
    React.useEffect(() => {
      if (show && duration > 0) {
        timeoutRef.current = setTimeout(() => {
          handleDismiss()
        }, duration)
      }

      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }
      }
    }, [show, duration])

    // Update visibility when show changes
    React.useEffect(() => {
      setVisible(show)
    }, [show])

    const handleDismiss = () => {
      setVisible(false)
      setTimeout(() => {
        onDismiss?.()
      }, 300) // Wait for exit animation
    }

    const positionClasses = {
      'top-right': 'top-4 right-4',
      'top-left': 'top-4 left-4',
      'bottom-right': 'bottom-4 right-4',
      'bottom-left': 'bottom-4 left-4',
      'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
      'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2'
    }

    const animationClasses = {
      slide: visible 
        ? 'translate-x-0 opacity-100' 
        : position.includes('right') 
          ? 'translate-x-full opacity-0' 
          : '-translate-x-full opacity-0',
      fade: visible ? 'opacity-100' : 'opacity-0',
      scale: visible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
    }

    if (!show && !visible) return null

    return (
      <div
        className={clsx(
          'fixed z-50 max-w-sm w-full',
          'transition-all duration-300 ease-in-out',
          positionClasses[position],
          animationClasses[animation]
        )}
      >
        <Alert
          ref={ref}
          dismissible
          onDismiss={handleDismiss}
          className={clsx('shadow-lg', className)}
          {...props}
        />
      </div>
    )
  }
)
ToastAlert.displayName = 'ToastAlert'

// Custom hook for managing toast alerts
export const useToast = () => {
  const [toasts, setToasts] = React.useState<Array<{
    id: string
    props: ToastAlertProps
  }>>([]) // Empty array as initial value

  const addToast = React.useCallback((props: Omit<ToastAlertProps, 'show' | 'onDismiss'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    
    setToasts(prev => [...prev, {
      id,
      props: {
        ...props,
        show: true,
        onDismiss: () => {
          setToasts(current => current.filter(toast => toast.id !== id))
        }
      }
    }])

    return id
  }, [])

  const removeToast = React.useCallback((id: string) => {
    setToasts(prev => 
      prev.map(toast => 
        toast.id === id 
          ? { ...toast, props: { ...toast.props, show: false } }
          : toast
      )
    )
  }, [])

  const clearAllToasts = React.useCallback(() => {
    setToasts([])
  }, [])

  // Convenience methods
  const toast = React.useMemo(() => ({
    success: (props: Omit<ToastAlertProps, 'variant' | 'show' | 'onDismiss'>) => 
      addToast({ ...props, variant: 'success' }),
    
    error: (props: Omit<ToastAlertProps, 'variant' | 'show' | 'onDismiss'>) => 
      addToast({ ...props, variant: 'error' }),
    
    warning: (props: Omit<ToastAlertProps, 'variant' | 'show' | 'onDismiss'>) => 
      addToast({ ...props, variant: 'warning' }),
    
    info: (props: Omit<ToastAlertProps, 'variant' | 'show' | 'onDismiss'>) => 
      addToast({ ...props, variant: 'info' }),
    
    default: (props: Omit<ToastAlertProps, 'variant' | 'show' | 'onDismiss'>) => 
      addToast({ ...props, variant: 'default' })
  }), [addToast])

  return {
    toasts,
    addToast,
    removeToast,
    clearAllToasts,
    toast
  }
}

// Toast container component
export const ToastContainer = () => {
  const { toasts } = useToast()

  return (
    <>
      {toasts.map(({ id, props }) => (
        <ToastAlert key={id} {...props} />
      ))}
    </>
  )
}

// Usage examples
export const AlertExamples = () => {
  const { toast } = useToast()
  const [showAlert, setShowAlert] = React.useState({
    success: false,
    error: false,
    warning: false,
    info: false
  })

  const handleShowToast = (variant: 'success' | 'error' | 'warning' | 'info') => {
    const messages = {
      success: {
        title: 'Success!',
        description: 'Your changes have been saved successfully.'
      },
      error: {
        title: 'Error occurred',
        description: 'There was a problem processing your request. Please try again.'
      },
      warning: {
        title: 'Warning',
        description: 'Please review your input before continuing.'
      },
      info: {
        title: 'Information',
        description: 'This is an informational message for your reference.'
      }
    }

    toast[variant]({
      ...messages[variant],
      duration: 5000,
      position: 'top-right'
    })
  }

  const toggleAlert = (variant: keyof typeof showAlert) => {
    setShowAlert(prev => ({ ...prev, [variant]: !prev[variant] }))
  }

  return (
    <div className="space-y-8 p-4">
      <h3 className="text-lg font-semibold">Alert Examples</h3>
      
      {/* Basic Alerts */}
      <div className="space-y-4">
        <h4 className="font-medium">Basic Alerts</h4>
        
        <Alert
          variant="success"
          title="Success"
          description="Your operation completed successfully!"
        />
        
        <Alert
          variant="error"
          title="Error"
          description="Something went wrong. Please try again."
          dismissible
          onDismiss={() => console.log('Error alert dismissed')}
        />
        
        <Alert
          variant="warning"
          title="Warning"
          description="Please review the following information before proceeding."
        />
        
        <Alert
          variant="info"
          title="Information"
          description="Here's some helpful information about this feature."
        />
      </div>

      {/* Alerts with Actions */}
      <div className="space-y-4">
        <h4 className="font-medium">Alerts with Actions</h4>
        
        <Alert
          variant="warning"
          title="Confirm Action"
          description="Are you sure you want to delete this item? This action cannot be undone."
          actions={
            <>
              <button className="px-3 py-1.5 text-sm bg-red-600 text-white rounded hover:bg-red-700">
                Delete
              </button>
              <button className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50">
                Cancel
              </button>
            </>
          }
        />
        
        <Alert
          variant="info"
          title="Update Available"
          description="A new version of the application is available."
          actions={
            <>
              <button className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
                Update Now
              </button>
              <button className="px-3 py-1.5 text-sm text-blue-600 hover:text-blue-800">
                Later
              </button>
            </>
          }
        />
      </div>

      {/* Alerts without Icons */}
      <div className="space-y-4">
        <h4 className="font-medium">Alerts without Icons</h4>
        
        <Alert
          variant="success"
          icon={false}
          title="Clean Success"
          description="This alert doesn't have an icon for a cleaner look."
        />
      </div>

      {/* Custom Icon Alert */}
      <div className="space-y-4">
        <h4 className="font-medium">Custom Icon Alert</h4>
        
        <Alert
          variant="info"
          icon={<span className="text-2xl">🎉</span>}
          title="Congratulations!"
          description="You've completed all the required tasks."
        />
      </div>

      {/* Different Sizes */}
      <div className="space-y-4">
        <h4 className="font-medium">Different Sizes</h4>
        
        <Alert size="sm" variant="info" title="Small Alert" description="This is a small alert." />
        <Alert size="md" variant="info" title="Medium Alert" description="This is a medium alert (default)." />
        <Alert size="lg" variant="info" title="Large Alert" description="This is a large alert with more spacing." />
      </div>

      {/* Specialized Alert Components */}
      <div className="space-y-4">
        <h4 className="font-medium">Specialized Components</h4>
        
        <SuccessAlert
          title="Form Submitted"
          description="Your form has been submitted successfully."
          dismissible
          onDismiss={() => console.log('Success alert dismissed')}
        />
        
        <ErrorAlert
          title="Validation Error"
          description="Please fix the errors below and try again."
        />
        
        <WarningAlert
          title="Data Loss Warning"
          description="You have unsaved changes that will be lost."
        />
        
        <InfoAlert
          title="Pro Tip"
          description="You can use keyboard shortcuts to navigate faster."
        />
      </div>

      {/* Toast Alerts */}
      <div className="space-y-4">
        <h4 className="font-medium">Toast Alerts</h4>
        
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleShowToast('success')}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Show Success Toast
          </button>
          <button
            onClick={() => handleShowToast('error')}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Show Error Toast
          </button>
          <button
            onClick={() => handleShowToast('warning')}
            className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
          >
            Show Warning Toast
          </button>
          <button
            onClick={() => handleShowToast('info')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Show Info Toast
          </button>
        </div>
      </div>

      {/* Persistent Alerts */}
      <div className="space-y-4">
        <h4 className="font-medium">Persistent Alerts (Toggle)</h4>
        
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => toggleAlert('success')}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Toggle Success Alert
          </button>
          <button
            onClick={() => toggleAlert('error')}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Toggle Error Alert
          </button>
        </div>

        {showAlert.success && (
          <Alert
            variant="success"
            title="Persistent Success"
            description="This alert will stay until you dismiss it."
            dismissible
            onDismiss={() => toggleAlert('success')}
          />
        )}

        {showAlert.error && (
          <Alert
            variant="error"
            title="Persistent Error"
            description="This error alert needs your attention."
            dismissible
            onDismiss={() => toggleAlert('error')}
          />
        )}
      </div>

      {/* Complex Alert with Custom Content */}
      <div className="space-y-4">
        <h4 className="font-medium">Complex Alert with Custom Content</h4>
        
        <Alert variant="warning" title="System Maintenance">
          <div className="space-y-2">
            <p className="text-sm">
              Scheduled maintenance will occur on <strong>Sunday, March 15th</strong> from 2:00 AM to 6:00 AM EST.
            </p>
            <ul className="text-sm list-disc list-inside space-y-1 opacity-90">
              <li>Login functionality will be unavailable</li>
              <li>Data synchronization will be paused</li>
              <li>Mobile app may show offline status</li>
            </ul>
            <div className="flex gap-2 mt-3">
              <button className="px-3 py-1.5 text-sm bg-yellow-600 text-white rounded hover:bg-yellow-700">
                Set Reminder
              </button>
              <button className="px-3 py-1.5 text-sm text-yellow-700 hover:text-yellow-900">
                Learn More
              </button>
            </div>
          </div>
        </Alert>
      </div>

      {/* Toast Container for managing toasts */}
      <ToastContainer />
    </div>
  )
}