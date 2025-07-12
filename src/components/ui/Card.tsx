import React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { clsx } from 'clsx'

// Card variants using CVA
const cardVariants = cva(
  // Base styles - mobile-first design
  [
    'rounded-lg border bg-white',
    'transition-shadow duration-200'
  ],
  {
    variants: {
      variant: {
        default: 'border-gray-200 shadow-sm',
        elevated: 'border-gray-200 shadow-md hover:shadow-lg',
        outlined: 'border-gray-300 shadow-none',
        filled: 'border-transparent bg-gray-50 shadow-none',
        success: 'border-green-200 bg-green-50',
        warning: 'border-yellow-200 bg-yellow-50',
        error: 'border-red-200 bg-red-50',
        info: 'border-blue-200 bg-blue-50'
      },
      size: {
        sm: 'p-3',
        md: 'p-4',
        lg: 'p-6',
        xl: 'p-8'
      },
      interactive: {
        true: 'cursor-pointer hover:shadow-md transition-all duration-200',
        false: ''
      },
      fullWidth: {
        true: 'w-full',
        false: 'w-auto'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
      interactive: false,
      fullWidth: true
    }
  }
)

// Card Header component
export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  noPadding?: boolean
}

export const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, size = 'md', noPadding = false, children, ...props }, ref) => {
    const sizeClasses = {
      sm: noPadding ? '' : 'p-3 pb-2',
      md: noPadding ? '' : 'p-4 pb-3',
      lg: noPadding ? '' : 'p-6 pb-4',
      xl: noPadding ? '' : 'p-8 pb-5'
    }

    return (
      <div
        ref={ref}
        className={clsx(
          'border-b border-gray-200',
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
CardHeader.displayName = 'CardHeader'

// Card Title component
export interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export const CardTitle = React.forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, as: Component = 'h3', size = 'md', children, ...props }, ref) => {
    const sizeClasses = {
      sm: 'text-sm font-medium',
      md: 'text-base font-semibold',
      lg: 'text-lg font-semibold',
      xl: 'text-xl font-bold'
    }

    return (
      <Component
        ref={ref}
        className={clsx(
          'text-gray-900 leading-tight',
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
CardTitle.displayName = 'CardTitle'

// Card Description component
export interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export const CardDescription = React.forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  ({ className, size = 'md', children, ...props }, ref) => {
    const sizeClasses = {
      sm: 'text-xs',
      md: 'text-sm',
      lg: 'text-base',
      xl: 'text-lg'
    }

    return (
      <p
        ref={ref}
        className={clsx(
          'text-gray-600 mt-1',
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
CardDescription.displayName = 'CardDescription'

// Card Content component
export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  noPadding?: boolean
}

export const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, size = 'md', noPadding = false, children, ...props }, ref) => {
    const sizeClasses = {
      sm: noPadding ? '' : 'p-3',
      md: noPadding ? '' : 'p-4',
      lg: noPadding ? '' : 'p-6',
      xl: noPadding ? '' : 'p-8'
    }

    return (
      <div
        ref={ref}
        className={clsx(sizeClasses[size], className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)
CardContent.displayName = 'CardContent'

// Card Footer component
export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  noPadding?: boolean
}

export const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, size = 'md', noPadding = false, children, ...props }, ref) => {
    const sizeClasses = {
      sm: noPadding ? '' : 'p-3 pt-2',
      md: noPadding ? '' : 'p-4 pt-3',
      lg: noPadding ? '' : 'p-6 pt-4',
      xl: noPadding ? '' : 'p-8 pt-5'
    }

    return (
      <div
        ref={ref}
        className={clsx(
          'border-t border-gray-200',
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
CardFooter.displayName = 'CardFooter'

// Main Card component interface
export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  asChild?: boolean
}

// Main Card component
export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      variant,
      size,
      interactive,
      fullWidth,
      asChild = false,
      children,
      ...props
    },
    ref
  ) => {
    const Component = asChild ? React.Fragment : 'div'
    
    if (asChild) {
      return <>{children}</>
    }

    return (
      <Component
        ref={ref}
        className={clsx(cardVariants({ variant, size, interactive, fullWidth }), className)}
        {...props}
      >
        {children}
      </Component>
    )
  }
)
Card.displayName = 'Card'

// Specialized Card components
export const StatsCard = React.forwardRef<
  HTMLDivElement,
  CardProps & {
    title: string
    value: string | number
    icon?: React.ReactNode
    trend?: {
      value: string | number
      direction: 'up' | 'down' | 'neutral'
    }
    description?: string
  }
>(({ title, value, icon, trend, description, className, ...props }, ref) => {
  const trendColors = {
    up: 'text-green-600',
    down: 'text-red-600',
    neutral: 'text-gray-600'
  }

  const trendIcons = {
    up: '↗️',
    down: '↘️',
    neutral: '→'
  }

  return (
    <Card ref={ref} className={clsx('hover:shadow-md transition-shadow', className)} {...props}>
      <CardContent className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {trend && (
            <div className={clsx('flex items-center mt-2 text-sm', trendColors[trend.direction])}>
              <span className="mr-1">{trendIcons[trend.direction]}</span>
              <span>{trend.value}</span>
            </div>
          )}
          {description && (
            <p className="text-xs text-gray-500 mt-1">{description}</p>
          )}
        </div>
        {icon && (
          <div className="text-2xl text-gray-400 ml-4">
            {icon}
          </div>
        )}
      </CardContent>
    </Card>
  )
})
StatsCard.displayName = 'StatsCard'

// Action Card with buttons
export const ActionCard = React.forwardRef<
  HTMLDivElement,
  CardProps & {
    title: string
    description?: string
    actions: React.ReactNode
    icon?: React.ReactNode
  }
>(({ title, description, actions, icon, className, ...props }, ref) => {
  return (
    <Card ref={ref} className={className} {...props}>
      <CardHeader className="flex items-start justify-between">
        <div className="flex items-center">
          {icon && <div className="mr-3 text-xl">{icon}</div>}
          <div>
            <CardTitle>{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
        </div>
      </CardHeader>
      <CardFooter className="flex justify-end space-x-2">
        {actions}
      </CardFooter>
    </Card>
  )
})
ActionCard.displayName = 'ActionCard'

// List Card for displaying items
export const ListCard = React.forwardRef<
  HTMLDivElement,
  CardProps & {
    title?: string
    items: Array<{
      id: string
      title: string
      description?: string
      icon?: React.ReactNode
      action?: React.ReactNode
    }>
    emptyMessage?: string
  }
>(({ title, items, emptyMessage = 'No items to display', className, ...props }, ref) => {
  return (
    <Card ref={ref} className={className} {...props}>
      {title && (
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent noPadding>
        {items.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            {emptyMessage}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {items.map((item, _index) => (
              <div key={item.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center">
                  {item.icon && <div className="mr-3">{item.icon}</div>}
                  <div>
                    <p className="font-medium text-gray-900">{item.title}</p>
                    {item.description && (
                      <p className="text-sm text-gray-600">{item.description}</p>
                    )}
                  </div>
                </div>
                {item.action && <div>{item.action}</div>}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
})
ListCard.displayName = 'ListCard'

// Usage examples
export const CardExamples = () => {
  const sampleItems = [
    {
      id: '1',
      title: 'Lab Kimia Organik',
      description: 'Available for booking',
      icon: '🧪',
      action: <button className="text-blue-600 hover:text-blue-800">Book</button>
    },
    {
      id: '2',
      title: 'Lab Biologi Molekuler', 
      description: 'Currently in use',
      icon: '🔬',
      action: <button className="text-gray-400" disabled>In Use</button>
    }
  ]

  return (
    <div className="space-y-6 p-4">
      <h3 className="text-lg font-semibold">Card Examples</h3>
      
      {/* Basic Cards */}
      <div className="space-y-4">
        <h4 className="font-medium">Basic Cards</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Default Card</CardTitle>
              <CardDescription>This is a basic card with header and content</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Card content goes here. This is where you would put the main information.</p>
            </CardContent>
          </Card>

          <Card variant="elevated">
            <CardHeader>
              <CardTitle>Elevated Card</CardTitle>
              <CardDescription>This card has elevated shadow</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Elevated cards are great for highlighting important content.</p>
            </CardContent>
            <CardFooter>
              <div className="flex space-x-2">
                <button className="px-3 py-1 bg-blue-600 text-white rounded text-sm">Action</button>
                <button className="px-3 py-1 border border-gray-300 rounded text-sm">Cancel</button>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>

      {/* Variant Cards */}
      <div className="space-y-4">
        <h4 className="font-medium">Variant Cards</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card variant="success" size="sm">
            <CardContent>
              <CardTitle size="sm">Success</CardTitle>
              <CardDescription size="sm">Operation completed</CardDescription>
            </CardContent>
          </Card>
          
          <Card variant="warning" size="sm">
            <CardContent>
              <CardTitle size="sm">Warning</CardTitle>
              <CardDescription size="sm">Please review</CardDescription>
            </CardContent>
          </Card>
          
          <Card variant="error" size="sm">
            <CardContent>
              <CardTitle size="sm">Error</CardTitle>
              <CardDescription size="sm">Action required</CardDescription>
            </CardContent>
          </Card>
          
          <Card variant="info" size="sm">
            <CardContent>
              <CardTitle size="sm">Information</CardTitle>
              <CardDescription size="sm">FYI message</CardDescription>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="space-y-4">
        <h4 className="font-medium">Stats Cards</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatsCard
            title="Total Students"
            value="1,234"
            icon="👥"
            trend={{ value: "+12%", direction: "up" }}
            description="From last semester"
          />
          
          <StatsCard
            title="Lab Equipment"
            value="156"
            icon="🔬"
            trend={{ value: "-3", direction: "down" }}
            description="Items in maintenance"
          />
          
          <StatsCard
            title="Active Courses"
            value="24"
            icon="📚"
            trend={{ value: "0", direction: "neutral" }}
            description="This semester"
          />
        </div>
      </div>

      {/* Action Card */}
      <div className="space-y-4">
        <h4 className="font-medium">Action Card</h4>
        <ActionCard
          title="Lab Booking Request"
          description="You have 3 pending lab booking requests to review"
          icon="📅"
          actions={
            <>
              <button className="px-3 py-1 border border-gray-300 rounded text-sm">View All</button>
              <button className="px-3 py-1 bg-blue-600 text-white rounded text-sm">Review</button>
            </>
          }
        />
      </div>

      {/* List Card */}
      <div className="space-y-4">
        <h4 className="font-medium">List Card</h4>
        <ListCard
          title="Available Labs"
          items={sampleItems}
        />
      </div>

      {/* Interactive Card */}
      <div className="space-y-4">
        <h4 className="font-medium">Interactive Card</h4>
        <Card interactive onClick={() => alert('Card clicked!')}>
          <CardContent>
            <CardTitle>Clickable Card</CardTitle>
            <CardDescription>This entire card is clickable</CardDescription>
          </CardContent>
        </Card>
      </div>

      {/* Different Sizes */}
      <div className="space-y-4">
        <h4 className="font-medium">Card Sizes</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card size="sm">
            <CardContent>
              <CardTitle size="sm">Small</CardTitle>
              <CardDescription size="sm">Compact card</CardDescription>
            </CardContent>
          </Card>
          
          <Card size="md">
            <CardContent>
              <CardTitle size="md">Medium</CardTitle>
              <CardDescription size="md">Default size</CardDescription>
            </CardContent>
          </Card>
          
          <Card size="lg">
            <CardContent>
              <CardTitle size="lg">Large</CardTitle>
              <CardDescription size="lg">More spacing</CardDescription>
            </CardContent>
          </Card>
          
          <Card size="xl">
            <CardContent>
              <CardTitle size="xl">Extra Large</CardTitle>
              <CardDescription size="xl">Maximum spacing</CardDescription>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}