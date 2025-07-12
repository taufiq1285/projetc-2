import React, { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { clsx } from 'clsx'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { Breadcrumb } from './Breadcrumb'
import { Footer } from './Footer'
import { useSidebar, useResponsive, useNavigation } from '@/store/uiStore'
import { useAuth } from '@/hooks/useAuth'

interface AppLayoutProps {
  className?: string
  showSidebar?: boolean
  showHeader?: boolean
  showFooter?: boolean
  showBreadcrumb?: boolean
  children?: React.ReactNode
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  className,
  showSidebar = true,
  showHeader = true,
  showFooter = true,
  showBreadcrumb = true,
  children
}) => {
  const { collapsed, pinned } = useSidebar()
  const { isMobile, setIsMobile, setScreenSize } = useResponsive()
  const { setCurrentPage } = useNavigation()
  const { isAuthenticated } = useAuth()
  const location = useLocation()
  
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Handle responsive breakpoints
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth
      const mobile = width < 1024 // lg breakpoint
      setIsMobile(mobile)

      // Set screen size based on Tailwind breakpoints
      if (width < 640) setScreenSize('xs')
      else if (width < 768) setScreenSize('sm')
      else if (width < 1024) setScreenSize('md')
      else if (width < 1280) setScreenSize('lg')
      else if (width < 1536) setScreenSize('xl')
      else setScreenSize('2xl')
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [setIsMobile, setScreenSize])

  // Update current page
  useEffect(() => {
    setCurrentPage(location.pathname)
  }, [location.pathname, setCurrentPage])

  // Close mobile sidebar when route changes
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false)
    }
  }, [location.pathname, isMobile])

  // Handle sidebar toggle
  const handleSidebarToggle = () => {
    if (isMobile) {
      setSidebarOpen(!sidebarOpen)
    }
  }

  // Calculate content margins based on sidebar state
  const getContentMargin = () => {
    if (!showSidebar) return 'ml-0'
    if (isMobile) return 'ml-0'
    if (collapsed) return 'ml-16'
    return 'ml-64'
  }

  // Don't show layout for unauthenticated users
  if (!isAuthenticated) {
    return <>{children || <Outlet />}</>
  }

  return (
    <div className={clsx('min-h-screen bg-gray-50', className)}>
      {/* Sidebar */}
      {showSidebar && (
        <Sidebar 
          onNavigate={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content area */}
      <div className={clsx(
        'transition-all duration-300 ease-in-out',
        getContentMargin()
      )}>
        {/* Header */}
        {showHeader && (
          <Header 
            showSidebar={showSidebar}
            onSidebarToggle={handleSidebarToggle}
          />
        )}

        {/* Breadcrumb */}
        {showBreadcrumb && (
          <Breadcrumb className="border-b border-gray-200 bg-white px-4 py-3 sm:px-6 lg:px-8" />
        )}

        {/* Page content */}
        <main className="flex-1">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            {children || <Outlet />}
          </div>
        </main>

        {/* Footer */}
        {showFooter && <Footer />}
      </div>

      {/* PWA-specific safe area handling */}
      <style jsx>{`
        @supports (padding-top: env(safe-area-inset-top)) {
          .pwa-safe-area {
            padding-top: env(safe-area-inset-top);
            padding-bottom: env(safe-area-inset-bottom);
            padding-left: env(safe-area-inset-left);
            padding-right: env(safe-area-inset-right);
          }
        }
      `}</style>
    </div>
  )
}

// Specialized layout components
export const DashboardLayout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  return (
    <AppLayout>
      <div className="space-y-6">
        {children}
      </div>
    </AppLayout>
  )
}

export const AuthLayout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  return (
    <AppLayout 
      showSidebar={false} 
      showHeader={false} 
      showFooter={false}
      showBreadcrumb={false}
      className="bg-gradient-to-br from-blue-50 to-indigo-100"
    >
      <div className="flex min-h-screen items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          {children}
        </div>
      </div>
    </AppLayout>
  )
}

export const FullscreenLayout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-900">
      {children}
    </div>
  )
}

// Layout hook for components
export const useLayout = () => {
  const { isMobile, screenSize } = useResponsive()
  const { collapsed } = useSidebar()
  
  return {
    isMobile,
    screenSize,
    sidebarCollapsed: collapsed,
    isDesktop: screenSize === 'lg' || screenSize === 'xl' || screenSize === '2xl',
    isTablet: screenSize === 'md',
    isMobileDevice: screenSize === 'xs' || screenSize === 'sm'
  }
}

export default AppLayout