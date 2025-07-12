import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { clsx } from 'clsx'
import { useAuth } from '@/hooks/useAuth'
import { usePermissions } from '@/hooks/usePermissions'
import { useTheme, useSidebar, useNotifications } from '@/store/uiStore'
import type { UserRole } from '@/types'

interface HeaderProps {
  className?: string
  showSidebar?: boolean
  onSidebarToggle?: () => void
}

export const Header: React.FC<HeaderProps> = ({
  className,
  showSidebar = true,
  onSidebarToggle
}) => {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const { toggle: toggleSidebar } = useSidebar()
  const { unreadCount } = useNotifications()
  
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const notificationRef = useRef<HTMLDivElement>(null)

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSidebarToggle = () => {
    if (onSidebarToggle) {
      onSidebarToggle()
    } else {
      toggleSidebar()
    }
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const getUserInitials = () => {
    if (!user?.name) return 'U'
    return user.name
      .split(' ')
      .map(word => word.charAt(0))
      .slice(0, 2)
      .join('')
      .toUpperCase()
  }

  const getRoleLabel = (role?: UserRole) => {
    const roleLabels = {
      admin: 'Administrator',
      dosen: 'Lecturer', 
      laboran: 'Lab Technician',
      mahasiswa: 'Student'
    }
    return role ? roleLabels[role] : 'User'
  }

  return (
    <header 
      className={clsx(
        'sticky top-0 z-40 w-full border-b border-gray-200 bg-white/80 backdrop-blur-sm',
        'transition-all duration-200',
        className
      )}
    >
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left side */}
        <div className="flex items-center gap-4">
          {/* Mobile menu button */}
          {showSidebar && (
            <button
              onClick={handleSidebarToggle}
              className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-gray-100 lg:hidden"
              aria-label="Toggle sidebar"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}

          {/* Logo */}
          <div 
            className="flex cursor-pointer items-center gap-3"
            onClick={() => navigate('/')}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
              </svg>
            </div>
            <span className="hidden text-xl font-bold text-gray-900 sm:block">
              AKBID Lab
            </span>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-gray-100"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>

          {/* Notifications */}
          <div className="relative" ref={notificationRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative flex h-10 w-10 items-center justify-center rounded-lg hover:bg-gray-100"
              aria-label="Notifications"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5-5-5h5m-5-9a5 5 0 1110 0v4l2 2H8l2-2v-4z" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notification dropdown */}
            {showNotifications && (
              <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-lg border bg-white shadow-lg">
                <div className="p-4">
                  <h3 className="text-lg font-semibold">Notifications</h3>
                  <div className="mt-2 text-sm text-gray-500">
                    {unreadCount > 0 ? `${unreadCount} unread notifications` : 'No new notifications'}
                  </div>
                </div>
                <div className="border-t p-2">
                  <button 
                    onClick={() => navigate('/notifications')}
                    className="w-full rounded px-3 py-2 text-left text-sm hover:bg-gray-50"
                  >
                    View all notifications
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex h-10 items-center gap-2 rounded-lg px-2 hover:bg-gray-100 sm:gap-3 sm:px-3"
              aria-label="User menu"
            >
              {/* Avatar */}
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-medium text-white">
                {getUserInitials()}
              </div>
              
              {/* User info - hidden on mobile */}
              <div className="hidden text-left sm:block">
                <div className="text-sm font-medium text-gray-900">
                  {user?.name || 'User'}
                </div>
                <div className="text-xs text-gray-500">
                  {getRoleLabel(user?.role)}
                </div>
              </div>

              {/* Chevron */}
              <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* User dropdown */}
            {showUserMenu && (
              <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-lg border bg-white shadow-lg">
                {/* User info */}
                <div className="border-b p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white">
                      {getUserInitials()}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {user?.name || 'Unknown User'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {user?.email}
                      </div>
                      <div className="text-xs text-blue-600">
                        {getRoleLabel(user?.role)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Menu items */}
                <div className="p-2">
                  <button
                    onClick={() => {
                      navigate('/profile')
                      setShowUserMenu(false)
                    }}
                    className="flex w-full items-center gap-3 rounded px-3 py-2 text-left text-sm hover:bg-gray-50"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Profile Settings
                  </button>
                  
                  <button
                    onClick={() => {
                      navigate('/settings')
                      setShowUserMenu(false)
                    }}
                    className="flex w-full items-center gap-3 rounded px-3 py-2 text-left text-sm hover:bg-gray-50"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Settings
                  </button>

                  <button
                    onClick={() => {
                      navigate('/help')
                      setShowUserMenu(false)
                    }}
                    className="flex w-full items-center gap-3 rounded px-3 py-2 text-left text-sm hover:bg-gray-50"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Help & Support
                  </button>
                </div>

                {/* Logout */}
                <div className="border-t p-2">
                  <button
                    onClick={() => {
                      handleLogout()
                      setShowUserMenu(false)
                    }}
                    className="flex w-full items-center gap-3 rounded px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}