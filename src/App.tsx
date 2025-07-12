import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { testSupabaseConnection } from '@/lib/supabase/tests'
import { ROLE_HIERARCHY, getRolePermissions } from '@/types/roles'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 3,
    },
  },
})

interface RBACTestResult {
  role: string
  test: string
  expected: boolean
  actual: boolean
  passed: boolean
  reason?: string
}

function App() {
  const [dbConnected, setDbConnected] = useState<boolean | null>(null)
  const [rbacTests, setRbacTests] = useState<RBACTestResult[]>([])
  const [testingRBAC, setTestingRBAC] = useState(false)

  useEffect(() => {
    // Test database connection first
    const testConnection = async () => {
      const connected = await testSupabaseConnection()
      setDbConnected(connected)
    }
    testConnection()
  }, [])

  const runRBACTests = async () => {
    console.log('🧪 Starting RBAC Functionality Tests...')
    setTestingRBAC(true)
    setRbacTests([])

    const testResults: RBACTestResult[] = []

    // Test data - mock user IDs for each role

    // Define test cases
    const testCases = [
      // Admin tests
      { role: 'admin', resource: 'users', action: 'create', expected: true },
      { role: 'admin', resource: 'inventory', action: 'delete', expected: true },
      { role: 'admin', resource: 'reports', action: 'export', expected: true },

      // Dosen tests
      { role: 'dosen', resource: 'courses', action: 'read', expected: true },
      { role: 'dosen', resource: 'grades', action: 'create', expected: true },
      { role: 'dosen', resource: 'users', action: 'create', expected: false },
      { role: 'dosen', resource: 'inventory', action: 'delete', expected: false },

      // Laboran tests
      { role: 'laboran', resource: 'inventory', action: 'create', expected: true },
      { role: 'laboran', resource: 'loans', action: 'approve', expected: true },
      { role: 'laboran', resource: 'grades', action: 'create', expected: false },
      { role: 'laboran', resource: 'users', action: 'create', expected: false },

      // Mahasiswa tests
      { role: 'mahasiswa', resource: 'courses', action: 'read', expected: true },
      { role: 'mahasiswa', resource: 'reports', action: 'create', expected: true },
      { role: 'mahasiswa', resource: 'inventory', action: 'create', expected: false },
      { role: 'mahasiswa', resource: 'loans', action: 'approve', expected: false },
      { role: 'mahasiswa', resource: 'users', action: 'create', expected: false }
    ]

    // Run tests
    for (const testCase of testCases) {
      try {
        console.log(`Testing ${testCase.role}: ${testCase.resource}:${testCase.action}`)
        
        // Mock the permission check by testing role permissions directly
        const rolePermissions = getRolePermissions(testCase.role as any)
        const requiredPermission = `${testCase.resource}:${testCase.action}`
        
        // Admin has all permissions
        const actual = testCase.role === 'admin' || 
                      rolePermissions.includes('*') || 
                      rolePermissions.includes(requiredPermission)

        const result: RBACTestResult = {
          role: testCase.role,
          test: `${testCase.resource}:${testCase.action}`,
          expected: testCase.expected,
          actual,
          passed: actual === testCase.expected,
          reason: actual ? 'Permission granted' : 'Permission denied'
        }

        testResults.push(result)
        console.log(`${result.passed ? '✅' : '❌'} ${testCase.role} ${testCase.resource}:${testCase.action} - Expected: ${testCase.expected}, Got: ${actual}`)

      } catch (error) {
        console.error(`Test failed for ${testCase.role} ${testCase.resource}:${testCase.action}:`, error)
        testResults.push({
          role: testCase.role,
          test: `${testCase.resource}:${testCase.action}`,
          expected: testCase.expected,
          actual: false,
          passed: false,
          reason: `Test error: ${error}`
        })
      }
    }

    setRbacTests(testResults)
    setTestingRBAC(false)

    // Summary
    const passed = testResults.filter(r => r.passed).length
    const total = testResults.length
    const percentage = Math.round((passed / total) * 100)

    console.log(`\n🎯 RBAC Test Results:`)
    console.log(`Passed: ${passed}/${total} (${percentage}%)`)
    
    if (passed === total) {
      console.log('🎉 All RBAC tests passed!')
    } else {
      console.log('⚠️ Some RBAC tests failed. Check individual results.')
    }
  }

  const testRoleHierarchy = () => {
    console.log('\n🏗️ Testing Role Hierarchy:')
    
    Object.entries(ROLE_HIERARCHY).forEach(([role, definition]) => {
      console.log(`${role.toUpperCase()} (Level ${definition.level}):`)
      console.log(`  Description: ${definition.description}`)
      console.log(`  Permissions: ${definition.default_permissions.slice(0, 3).join(', ')}${definition.default_permissions.length > 3 ? '...' : ''}`)
    })
  }

  const getStatusColor = (status: boolean | null) => {
    if (status === null) return 'bg-gray-100 text-gray-800'
    return status ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
  }

  const getStatusIcon = (status: boolean | null) => {
    if (status === null) return '⏳'
    return status ? '✅' : '❌'
  }

  const passedTests = rbacTests.filter(t => t.passed).length
  const totalTests = rbacTests.length
  const successRate = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-indigo-900 mb-2">
                AKBID Lab System
              </h1>
              <p className="text-lg text-indigo-600">
                DAY 4 - RBAC System Testing
              </p>
            </div>

            {/* System Status */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {/* Database Status */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  🗄️ Database Status
                </h2>
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${getStatusColor(dbConnected)}`}>
                  <span className="mr-2">{getStatusIcon(dbConnected)}</span>
                  {dbConnected === null && 'Testing connection...'}
                  {dbConnected === true && 'Database connected'}
                  {dbConnected === false && 'Connection failed'}
                </div>
              </div>

              {/* RBAC Status */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  🛡️ RBAC System
                </h2>
                <div className="space-y-2">
                  <div className="text-sm text-gray-600">
                    Tests: {totalTests > 0 ? `${passedTests}/${totalTests}` : 'Not run'}
                  </div>
                  {totalTests > 0 && (
                    <div className="text-sm text-gray-600">
                      Success Rate: {successRate}%
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* RBAC Testing Section */}
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold text-gray-800">
                  🧪 RBAC Functionality Testing
                </h2>
                <div className="space-x-2">
                  <button
                    onClick={testRoleHierarchy}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Test Hierarchy
                  </button>
                  <button
                    onClick={runRBACTests}
                    disabled={testingRBAC || !dbConnected}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {testingRBAC ? 'Testing...' : 'Run RBAC Tests'}
                  </button>
                </div>
              </div>

              {/* Test Results */}
              {rbacTests.length > 0 && (
                <div className="space-y-4">
                  {/* Summary */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold mb-2">Test Summary</h3>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-blue-600">{totalTests}</div>
                        <div className="text-sm text-gray-600">Total Tests</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-green-600">{passedTests}</div>
                        <div className="text-sm text-gray-600">Passed</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-red-600">{totalTests - passedTests}</div>
                        <div className="text-sm text-gray-600">Failed</div>
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full transition-all"
                          style={{ width: `${successRate}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* Detailed Results by Role */}
                  {['admin', 'dosen', 'laboran', 'mahasiswa'].map(role => {
                    const roleTests = rbacTests.filter(t => t.role === role)
                    if (roleTests.length === 0) return null

                    const rolePassed = roleTests.filter(t => t.passed).length
                    const roleTotal = roleTests.length

                    return (
                      <div key={role} className="border rounded-lg p-4">
                        <h3 className="font-semibold mb-3 flex items-center justify-between">
                          <span className="capitalize">{role} Role Tests</span>
                          <span className="text-sm text-gray-600">
                            {rolePassed}/{roleTotal} passed
                          </span>
                        </h3>
                        <div className="space-y-2">
                          {roleTests.map((test, index) => (
                            <div
                              key={index}
                              className={`flex items-center justify-between p-2 rounded ${
                                test.passed ? 'bg-green-50' : 'bg-red-50'
                              }`}
                            >
                              <div className="flex items-center">
                                <span className="mr-2">
                                  {test.passed ? '✅' : '❌'}
                                </span>
                                <span className="font-medium">{test.test}</span>
                              </div>
                              <div className="text-sm text-gray-600">
                                Expected: {test.expected ? 'Allow' : 'Deny'} | 
                                Got: {test.actual ? 'Allow' : 'Deny'}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {testingRBAC && (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Running RBAC functionality tests...</p>
                </div>
              )}
            </div>

            {/* Role Hierarchy Display */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                🏗️ Role Hierarchy
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.entries(ROLE_HIERARCHY).map(([role, definition]) => (
                  <div key={role} className="border rounded-lg p-4">
                    <h3 className="font-semibold capitalize mb-2">
                      {role} <span className="text-sm text-gray-500">(Level {definition.level})</span>
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">
                      {definition.description}
                    </p>
                    <div className="text-xs text-gray-500">
                      <strong>Permissions:</strong>
                      <div className="mt-1">
                        {definition.default_permissions.includes('*') ? (
                          <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                            ALL PERMISSIONS
                          </span>
                        ) : (
                          <div className="space-y-1">
                            {definition.default_permissions.slice(0, 3).map(perm => (
                              <div key={perm} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                                {perm}
                              </div>
                            ))}
                            {definition.default_permissions.length > 3 && (
                              <div className="text-gray-400">
                                +{definition.default_permissions.length - 3} more
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="text-center mt-8 text-gray-500">
              <p>DAY 4 RBAC Testing Complete</p>
              <p className="text-sm">Next: Create documentation and final commit</p>
            </div>
          </div>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App