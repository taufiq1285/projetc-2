import React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { clsx } from 'clsx'
import { createPortal } from 'react-dom'

// Modal variants using CVA
const modalVariants = cva(
  // Base modal styles
  [
    'relative bg-white rounded-lg shadow-xl',
    'w-full max-h-[90vh] overflow-hidden',
    'transform transition-all duration-300'
  ],
  {
    variants: {
      size: {
        xs: 'max-w-xs',
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
        '2xl': 'max-w-2xl',
        '3xl': 'max-w-3xl',
        '4xl': 'max-w-4xl',
        full: 'max-w-full mx-4'
      }
    },
    defaultVariants: {
      size: 'md'
    }
  }
)

// Overlay component
const ModalOverlay = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    show: boolean
    onClose?: () => void
    closeOnOverlayClick?: boolean
  }
>(({ className, show, onClose, closeOnOverlayClick = true, children, ...props }, ref) => {
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (closeOnOverlayClick && e.target === e.currentTarget && onClose) {
      onClose()
    }
  }

  return (
    <div
      ref={ref}
      className={clsx(
        'fixed inset-0 z-50 flex items-center justify-center p-4',
        'bg-black/50 backdrop-blur-sm',
        'transition-opacity duration-300',
        show ? 'opacity-100' : 'opacity-0 pointer-events-none',
        className
      )}
      onClick={handleOverlayClick}
      {...props}
    >
      {children}
    </div>
  )
})
ModalOverlay.displayName = 'ModalOverlay'

// Modal Header component
export interface ModalHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  onClose?: () => void
  showCloseButton?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export const ModalHeader = React.forwardRef<HTMLDivElement, ModalHeaderProps>(
  ({ className, onClose, showCloseButton = true, size = 'md', children, ...props }, ref) => {
    const sizeClasses = {
      sm: 'p-4 pb-2',
      md: 'p-6 pb-3',
      lg: 'p-8 pb-4'
    }

    return (
      <div
        ref={ref}
        className={clsx(
          'flex items-center justify-between border-b border-gray-200',
          sizeClasses[size],
          className
        )}
        {...props}
      >
        <div className="flex-1 pr-4">{children}</div>
        {showCloseButton && onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded"
            aria-label="Close modal"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    )
  }
)
ModalHeader.displayName = 'ModalHeader'

// Modal Title component
export interface ModalTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
  size?: 'sm' | 'md' | 'lg'
}

export const ModalTitle = React.forwardRef<HTMLHeadingElement, ModalTitleProps>(
  ({ className, as: Component = 'h2', size = 'md', children, ...props }, ref) => {
    const sizeClasses = {
      sm: 'text-lg font-semibold',
      md: 'text-xl font-semibold',
      lg: 'text-2xl font-bold'
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
ModalTitle.displayName = 'ModalTitle'

// Modal Body component
export interface ModalBodyProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg'
  scrollable?: boolean
  noPadding?: boolean
}

export const ModalBody = React.forwardRef<HTMLDivElement, ModalBodyProps>(
  ({ className, size = 'md', scrollable = true, noPadding = false, children, ...props }, ref) => {
    const sizeClasses = {
      sm: noPadding ? '' : 'p-4',
      md: noPadding ? '' : 'p-6',
      lg: noPadding ? '' : 'p-8'
    }

    return (
      <div
        ref={ref}
        className={clsx(
          'flex-1',
          scrollable && 'overflow-y-auto',
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
ModalBody.displayName = 'ModalBody'

// Modal Footer component
export interface ModalFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg'
  align?: 'left' | 'center' | 'right' | 'between'
}

export const ModalFooter = React.forwardRef<HTMLDivElement, ModalFooterProps>(
  ({ className, size = 'md', align = 'right', children, ...props }, ref) => {
    const sizeClasses = {
      sm: 'p-4 pt-2',
      md: 'p-6 pt-3',
      lg: 'p-8 pt-4'
    }

    const alignClasses = {
      left: 'justify-start',
      center: 'justify-center',
      right: 'justify-end',
      between: 'justify-between'
    }

    return (
      <div
        ref={ref}
        className={clsx(
          'flex items-center space-x-2 border-t border-gray-200',
          sizeClasses[size],
          alignClasses[align],
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
ModalFooter.displayName = 'ModalFooter'

// Main Modal component interface
export interface ModalProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onClose'>,
    VariantProps<typeof modalVariants> {
  open: boolean
  onClose?: () => void
  closeOnOverlayClick?: boolean
  closeOnEscape?: boolean
  preventClose?: boolean
  initialFocus?: React.RefObject<HTMLElement>
  restoreFocus?: boolean
  portalContainer?: Element
}

// Main Modal component
export const Modal = React.forwardRef<HTMLDivElement, ModalProps>(
  (
    {
      className,
      size,
      open,
      onClose,
      closeOnOverlayClick = true,
      closeOnEscape = true,
      preventClose = false,
      initialFocus,
      restoreFocus = true,
      portalContainer,
      children,
      ...props
    },
    ref
  ) => {
    const [mounted, setMounted] = React.useState(false)
    const previousActiveElement = React.useRef<HTMLElement | null>(null)
    const modalRef = React.useRef<HTMLDivElement>(null)

    // Handle escape key
    React.useEffect(() => {
      const handleEscape = (event: KeyboardEvent) => {
        if (closeOnEscape && event.key === 'Escape' && onClose && !preventClose) {
          onClose()
        }
      }

      if (open) {
        document.addEventListener('keydown', handleEscape)
        return () => document.removeEventListener('keydown', handleEscape)
      }
    }, [open, closeOnEscape, onClose, preventClose])

    // Handle body scroll lock
    React.useEffect(() => {
      if (open) {
        const originalStyle = window.getComputedStyle(document.body).overflow
        document.body.style.overflow = 'hidden'
        return () => {
          document.body.style.overflow = originalStyle
        }
      }
    }, [open])

    // Handle focus management
    React.useEffect(() => {
      if (open) {
        // Store current focus
        previousActiveElement.current = document.activeElement as HTMLElement
        
        // Focus initial element or modal
        setTimeout(() => {
          if (initialFocus?.current) {
            initialFocus.current.focus()
          } else if (modalRef.current) {
            modalRef.current.focus()
          }
        }, 100)
      } else if (restoreFocus && previousActiveElement.current) {
        // Restore focus when modal closes
        previousActiveElement.current.focus()
      }
    }, [open, initialFocus, restoreFocus])

    // Handle mounting for portal
    React.useEffect(() => {
      setMounted(true)
    }, [])

    if (!mounted) return null

    const modalContent = (
      <ModalOverlay
        show={open}
        onClose={!preventClose ? onClose : undefined}
        closeOnOverlayClick={closeOnOverlayClick}
      >
        <div
          ref={ref || modalRef}
          className={clsx(
            modalVariants({ size }),
            'outline-none',
            open ? 'scale-100 opacity-100' : 'scale-95 opacity-0',
            className
          )}
          role="dialog"
          aria-modal="true"
          tabIndex={-1}
          {...props}
        >
          {children}
        </div>
      </ModalOverlay>
    )

    // Use portal if container specified, otherwise render directly
    if (portalContainer) {
      return createPortal(modalContent, portalContainer)
    }

    return createPortal(modalContent, document.body)
  }
)
Modal.displayName = 'Modal'

// Specialized Modal components
export const ConfirmModal = React.forwardRef<
  HTMLDivElement,
  Omit<ModalProps, 'children'> & {
    title: string
    description?: string
    confirmText?: string
    cancelText?: string
    confirmVariant?: 'primary' | 'danger' | 'success'
    onConfirm?: () => void | Promise<void>
    loading?: boolean
  }
>(
  (
    {
      title,
      description,
      confirmText = 'Confirm',
      cancelText = 'Cancel',
      confirmVariant = 'primary',
      onConfirm,
      onClose,
      loading = false,
      ...props
    },
    ref
  ) => {
    const [isLoading, setIsLoading] = React.useState(false)

    const handleConfirm = async () => {
      if (onConfirm) {
        setIsLoading(true)
        try {
          await onConfirm()
          onClose?.()
        } catch (error) {
          console.error('Confirm action failed:', error)
        } finally {
          setIsLoading(false)
        }
      }
    }

    const buttonVariants = {
      primary: 'bg-blue-600 hover:bg-blue-700 text-white',
      danger: 'bg-red-600 hover:bg-red-700 text-white',
      success: 'bg-green-600 hover:bg-green-700 text-white'
    }

    return (
      <Modal ref={ref} onClose={onClose} size="sm" {...props}>
        <ModalHeader onClose={onClose}>
          <ModalTitle size="sm">{title}</ModalTitle>
        </ModalHeader>
        {description && (
          <ModalBody>
            <p className="text-gray-600">{description}</p>
          </ModalBody>
        )}
        <ModalFooter>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading || loading}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isLoading || loading}
            className={clsx(
              'px-4 py-2 rounded-lg font-medium disabled:opacity-50 min-w-[80px]',
              buttonVariants[confirmVariant]
            )}
          >
            {isLoading || loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </span>
            ) : (
              confirmText
            )}
          </button>
        </ModalFooter>
      </Modal>
    )
  }
)
ConfirmModal.displayName = 'ConfirmModal'

export const AlertModal = React.forwardRef<
  HTMLDivElement,
  Omit<ModalProps, 'children'> & {
    title: string
    description?: string
    type?: 'info' | 'success' | 'warning' | 'error'
    okText?: string
  }
>(({ title, description, type = 'info', okText = 'OK', onClose, ...props }, ref) => {
  const icons = {
    info: '💬',
    success: '✅',
    warning: '⚠️',
    error: '❌'
  }

  const colors = {
    info: 'text-blue-600',
    success: 'text-green-600',
    warning: 'text-yellow-600',
    error: 'text-red-600'
  }

  return (
    <Modal ref={ref} onClose={onClose} size="sm" {...props}>
      <ModalHeader onClose={onClose}>
        <div className="flex items-center">
          <span className="text-2xl mr-3">{icons[type]}</span>
          <ModalTitle size="sm" className={colors[type]}>
            {title}
          </ModalTitle>
        </div>
      </ModalHeader>
      {description && (
        <ModalBody>
          <p className="text-gray-600">{description}</p>
        </ModalBody>
      )}
      <ModalFooter>
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          {okText}
        </button>
      </ModalFooter>
    </Modal>
  )
})
AlertModal.displayName = 'AlertModal'

// Custom hook for modal management
export const useModal = (initialOpen = false) => {
  const [open, setOpen] = React.useState(initialOpen)

  const openModal = React.useCallback(() => setOpen(true), [])
  const closeModal = React.useCallback(() => setOpen(false), [])
  const toggleModal = React.useCallback(() => setOpen(prev => !prev), [])

  return {
    open,
    openModal,
    closeModal,
    toggleModal,
    setOpen
  }
}

// Usage examples
export const ModalExamples = () => {
  const basicModal = useModal()
  const confirmModal = useModal()
  const alertModal = useModal()
  const formModal = useModal()

  const handleConfirmAction = async () => {
    // Simulate async action
    await new Promise(resolve => setTimeout(resolve, 2000))
    alert('Action confirmed!')
  }

  return (
    <div className="space-y-4 p-4">
      <h3 className="text-lg font-semibold">Modal Examples</h3>
      
      {/* Trigger Buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={basicModal.openModal}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Basic Modal
        </button>
        <button
          onClick={confirmModal.openModal}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Confirm Modal
        </button>
        <button
          onClick={alertModal.openModal}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          Alert Modal
        </button>
        <button
          onClick={formModal.openModal}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
        >
          Form Modal
        </button>
      </div>

      {/* Basic Modal */}
      <Modal open={basicModal.open} onClose={basicModal.closeModal}>
        <ModalHeader onClose={basicModal.closeModal}>
          <ModalTitle>Basic Modal</ModalTitle>
        </ModalHeader>
        <ModalBody>
          <p>This is a basic modal with header, body, and footer components.</p>
          <p className="mt-2">You can close it by clicking the X, pressing Escape, or clicking outside.</p>
        </ModalBody>
        <ModalFooter>
          <button
            onClick={basicModal.closeModal}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={basicModal.closeModal}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Save
          </button>
        </ModalFooter>
      </Modal>

      {/* Confirm Modal */}
      <ConfirmModal
        open={confirmModal.open}
        onClose={confirmModal.closeModal}
        title="Delete Item"
        description="Are you sure you want to delete this item? This action cannot be undone."
        confirmText="Delete"
        confirmVariant="danger"
        onConfirm={handleConfirmAction}
      />

      {/* Alert Modal */}
      <AlertModal
        open={alertModal.open}
        onClose={alertModal.closeModal}
        title="Success"
        description="Your changes have been saved successfully!"
        type="success"
      />

      {/* Form Modal */}
      <Modal open={formModal.open} onClose={formModal.closeModal} size="lg">
        <ModalHeader onClose={formModal.closeModal}>
          <ModalTitle>Add New User</ModalTitle>
        </ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name *
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter full name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="user@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option>Select a role</option>
                <option>Admin</option>
                <option>Dosen</option>
                <option>Laboran</option>
                <option>Mahasiswa</option>
              </select>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <button
            onClick={formModal.closeModal}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={formModal.closeModal}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Add User
          </button>
        </ModalFooter>
      </Modal>
    </div>
  )
}