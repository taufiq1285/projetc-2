import React from 'react'
import { useNavigate } from 'react-router-dom'

interface UnauthorizedPageProps {
  message?: string
  requiredPermissions?: string[]
  showBackButton?: boolean
}

export const UnauthorizedPage: React.FC<UnauthorizedPageProps> = ({
  message = 'You do not have permission to access this resource',
  requiredPermissions = [],
  showBackButton = true
}) => {
  const navigate = useNavigate()

  const handleGoBack = () => {
    navigate(-1)
  }

  const handleGoHome = () => {
    navigate('/')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          {/* Icon */}
          <div className="mx-auto h-24 w-24 text-red-500 mb-4">
            <svg
              className="w-full h-full"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 01-4-4V8a5 5 0 0110 0v1a4 4 0 01-4 4z"
              />
            </svg>
          </div>

          {/* Title */}
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Access Denied
          </h2>

          {/* Message */}
          <p className="text-lg text-gray-600 mb-6">
            {message}
          </p>

          {/* Required Permissions */}
          {requiredPermissions.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <h3 className="text-sm font-medium text-yellow-800 mb-2">
                Required Permissions:
              </h3>
              <ul className="text-sm text-yellow-700">
                {requiredPermissions.map((permission, index) => (
                  <li key={index} className="mb-1">
                    • {permission}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {showBackButton && (
              <button
                onClick={handleGoBack}
                className="px-6 py-3 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              >
                Go Back
              </button>
            )}
            <button
              onClick={handleGoHome}
              className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              Go to Homepage
            </button>
          </div>

          {/* Help Text */}
          <p className="mt-6 text-sm text-gray-500">
            If you believe this is an error, please contact your administrator.
          </p>
        </div>
      </div>
    </div>
  )
}

export default UnauthorizedPage