import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { testSupabaseConnection, testApiPatterns, healthCheck } from '@/lib/supabase/tests'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: 3,
    },
    mutations: {
      retry: 1,
      gcTime: 5 * 60 * 1000,
    },
  },
})

interface TestStatus {
  status: 'testing' | 'success' | 'failed'
  details: {
    connection: boolean
    apiPatterns: boolean
    health: 'healthy' | 'unhealthy'
  }
  message: string
}

function App() {
  const [testStatus, setTestStatus] = useState<TestStatus>({
    status: 'testing',
    details: { connection: false, apiPatterns: false, health: 'unhealthy' },
    message: 'Initializing tests...'
  })

  useEffect(() => {
    const runFirstApiTests = async () => {
      console.log('🚀 Starting DAY 3 - First API Call Tests...')
      
      try {
        setTestStatus(prev => ({ 
          ...prev, 
          message: 'Testing database connection...' 
        }))

        // Test 1: Database Connection
        const connectionTest = await testSupabaseConnection()
        console.log(`Database Connection: ${connectionTest ? '✅' : '❌'}`)
        
        setTestStatus(prev => ({ 
          ...prev, 
          details: { ...prev.details, connection: connectionTest },
          message: 'Testing API patterns...' 
        }))

        // Test 2: API Patterns
        const apiTest = await testApiPatterns()
        console.log(`API Patterns: ${apiTest ? '✅' : '❌'}`)
        
        setTestStatus(prev => ({ 
          ...prev, 
          details: { ...prev.details, apiPatterns: apiTest },
          message: 'Running health check...' 
        }))

        // Test 3: Overall Health Check
        const { status: healthStatus } = await healthCheck()
        console.log(`System Health: ${healthStatus}`)
        
        const overallSuccess = connectionTest && apiTest && healthStatus === 'healthy'
        
        setTestStatus({
          status: overallSuccess ? 'success' : 'failed',
          details: { 
            connection: connectionTest, 
            apiPatterns: apiTest, 
            health: healthStatus 
          },
          message: overallSuccess 
            ? '🎉 All tests passed! First API call successful!'
            : '⚠️ Some tests failed. Check console for details.'
        })

        // Log final results
        console.log('\n🎯 DAY 3 TEST RESULTS:')
        console.log(`Database Connection: ${connectionTest ? '✅ PASSED' : '❌ FAILED'}`)
        console.log(`API Patterns: ${apiTest ? '✅ PASSED' : '❌ FAILED'}`)
        console.log(`System Health: ${healthStatus === 'healthy' ? '✅ HEALTHY' : '❌ UNHEALTHY'}`)
        console.log(`Overall: ${overallSuccess ? '🎉 SUCCESS' : '⚠️ FAILED'}`)

      } catch (error) {
        console.error('❌ Test execution failed:', error)
        setTestStatus({
          status: 'failed',
          details: { connection: false, apiPatterns: false, health: 'unhealthy' },
          message: 'Test execution failed. Check console for errors.'
        })
      }
    }

    runFirstApiTests()
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800 border-green-200'
      case 'failed': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    }
  }

  const getDetailIcon = (success: boolean) => success ? '✅' : '❌'

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-indigo-900 mb-2">
                AKBID Lab System
              </h1>
              <p className="text-lg text-indigo-600">
                Laboratory Management System - DAY 3 Testing
              </p>
            </div>

            {/* Main Test Status Card */}
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                🧪 First API Call Test Results
              </h2>
              
              <div className={`border rounded-lg p-4 mb-4 ${getStatusColor(testStatus.status)}`}>
                <div className="flex items-center justify-between">
                  <span className="font-medium">
                    {testStatus.status === 'testing' && '🔄 Running Tests...'}
                    {testStatus.status === 'success' && '🎉 All Tests Passed!'}
                    {testStatus.status === 'failed' && '⚠️ Tests Failed'}
                  </span>
                  <span className="text-sm">
                    {testStatus.status === 'testing' ? 'In Progress' : 'Complete'}
                  </span>
                </div>
                <p className="mt-2 text-sm">{testStatus.message}</p>
              </div>

              {/* Detailed Test Results */}
              <div className="grid md:grid-cols-3 gap-4">
                <div className="border rounded-lg p-4">
                  <h3 className="font-medium text-gray-700 mb-2">
                    {getDetailIcon(testStatus.details.connection)} Database Connection
                  </h3>
                  <p className="text-sm text-gray-600">
                    {testStatus.details.connection 
                      ? 'Connected to Supabase successfully'
                      : 'Failed to connect to database'
                    }
                  </p>
                </div>

                <div className="border rounded-lg p-4">
                  <h3 className="font-medium text-gray-700 mb-2">
                    {getDetailIcon(testStatus.details.apiPatterns)} API Patterns
                  </h3>
                  <p className="text-sm text-gray-600">
                    {testStatus.details.apiPatterns 
                      ? 'CRUD operations working correctly'
                      : 'API pattern tests failed'
                    }
                  </p>
                </div>

                <div className="border rounded-lg p-4">
                  <h3 className="font-medium text-gray-700 mb-2">
                    {getDetailIcon(testStatus.details.health === 'healthy')} System Health
                  </h3>
                  <p className="text-sm text-gray-600">
                    {testStatus.details.health === 'healthy' 
                      ? 'All systems operational'
                      : 'System health check failed'
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Database Schema Overview */}
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                🗄️ Database Schema (14 Tables)
              </h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium text-indigo-700 mb-2">Core Tables (7)</h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• users (Authentication & roles)</li>
                    <li>• permissions (RBAC permissions)</li>
                    <li>• role_permissions (Role mappings)</li>
                    <li>• user_permissions (User overrides)</li>
                    <li>• lab_rooms (9 labs + 1 depot)</li>
                    <li>• mata_kuliah (Courses)</li>
                    <li>• jadwal_praktikum (Schedules)</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-medium text-indigo-700 mb-2">Business Tables (7)</h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• inventaris_alat (Equipment inventory)</li>
                    <li>• peminjaman_alat (Equipment loans)</li>
                    <li>• presensi (Student attendance)</li>
                    <li>• materi_praktikum (Course materials)</li>
                    <li>• laporan_mahasiswa (Student reports)</li>
                    <li>• penilaian (Student grading)</li>
                    <li>• audit_logs (System activity)</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Technical Stack Info */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                ⚡ Technical Stack Status
              </h2>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center p-3 border rounded-lg">
                  <div className="text-2xl mb-1">⚛️</div>
                  <div className="font-medium text-gray-700">React 18</div>
                  <div className="text-sm text-green-600">✓ Active</div>
                </div>
                
                <div className="text-center p-3 border rounded-lg">
                  <div className="text-2xl mb-1">🔷</div>
                  <div className="font-medium text-gray-700">TypeScript</div>
                  <div className="text-sm text-green-600">✓ Strict Mode</div>
                </div>
                
                <div className="text-center p-3 border rounded-lg">
                  <div className="text-2xl mb-1">🎨</div>
                  <div className="font-medium text-gray-700">Tailwind CSS</div>
                  <div className="text-sm text-green-600">✓ v3.3.5</div>
                </div>
                
                <div className="text-center p-3 border rounded-lg">
                  <div className="text-2xl mb-1">🗄️</div>
                  <div className="font-medium text-gray-700">Supabase</div>
                  <div className={`text-sm ${testStatus.details.connection ? 'text-green-600' : 'text-red-600'}`}>
                    {testStatus.details.connection ? '✓ Connected' : '✗ Failed'}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center mt-8 text-gray-500">
              <p>DAY 3 Complete: Supabase Setup + API Patterns</p>
              <p className="text-sm">Next: DAY 4 - Create First UI Components</p>
            </div>
          </div>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App