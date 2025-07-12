import { supabase } from './client'
import { authService } from './auth'
import { dbService, akbidDb } from './database'

// Test interface
interface TestResult {
  name: string
  status: 'success' | 'failed' | 'skipped'
  message: string
  data?: any
}

// Main test function
export const testSupabaseConnection = async (): Promise<boolean> => {
  console.log('🧪 Testing Supabase Connection...')
  
  const results: TestResult[] = []
  
  try {
    // Test 1: Basic connection
    console.log('📡 Testing basic connection...')
    const { error } = await supabase
      .from('lab_rooms')
      .select('count')
      .limit(1)
    
    if (error) {
      results.push({
        name: 'Basic Connection',
        status: 'failed',
        message: `Connection failed: ${error.message}`
      })
      console.error('❌ Database connection failed:', error)
      return false
    }
    
    results.push({
      name: 'Basic Connection',
      status: 'success',
      message: 'Database connection successful'
    })
    console.log('✅ Database connection successful')
    
    // Test 2: Read lab rooms (should have 10 rooms)
    console.log('🏢 Testing lab rooms query...')
    const { data: labs, error: labError } = await akbidDb.labs.getActive()
    
    if (labError) {
      results.push({
        name: 'Lab Rooms Query',
        status: 'failed',
        message: `Lab rooms query failed: ${labError.message}`
      })
      console.error('❌ Lab rooms query failed:', labError)
      return false
    }
    
    results.push({
      name: 'Lab Rooms Query',
      status: 'success',
      message: `Lab rooms loaded successfully: ${labs?.length || 0} rooms`,
      data: labs?.length
    })
    console.log(`✅ Lab rooms loaded: ${labs?.length} rooms`)
    
    // Test 3: Check permissions table
    console.log('🔐 Testing permissions query...')
    const { data: permissions, error: permError } = await dbService.read('permissions')
    
    if (permError) {
      results.push({
        name: 'Permissions Query',
        status: 'failed',
        message: `Permissions query failed: ${permError.message}`
      })
      console.error('❌ Permissions query failed:', permError)
      return false
    }
    
    results.push({
      name: 'Permissions Query',
      status: 'success',
      message: `Permissions loaded successfully: ${permissions?.length || 0} permissions`,
      data: permissions?.length
    })
    console.log(`✅ Permissions loaded: ${permissions?.length} permissions`)
    
    // Test 4: Check users table structure
    console.log('👥 Testing users table...')
    const { count: userCount, error: userError } = await dbService.count('users')
    
    if (userError) {
      results.push({
        name: 'Users Table',
        status: 'failed',
        message: `Users table query failed: ${userError.message}`
      })
      console.error('❌ Users table query failed:', userError)
      return false
    }
    
    results.push({
      name: 'Users Table',
      status: 'success',
      message: `Users table accessible: ${userCount || 0} users`,
      data: userCount
    })
    console.log(`✅ Users table accessible: ${userCount} users`)
    
    // Test 5: Test inventory table
    console.log('📦 Testing inventory table...')
    const { count: inventoryCount, error: invError } = await dbService.count('inventaris_alat')
    
    if (invError) {
      results.push({
        name: 'Inventory Table',
        status: 'failed',
        message: `Inventory table query failed: ${invError.message}`
      })
      console.error('❌ Inventory table query failed:', invError)
      return false
    }
    
    results.push({
      name: 'Inventory Table',
      status: 'success',
      message: `Inventory table accessible: ${inventoryCount || 0} items`,
      data: inventoryCount
    })
    console.log(`✅ Inventory table accessible: ${inventoryCount} items`)
    
    // Summary
    const successCount = results.filter(r => r.status === 'success').length
    const totalTests = results.length
    
    console.log(`\n📊 Test Summary: ${successCount}/${totalTests} tests passed`)
    results.forEach(result => {
      const icon = result.status === 'success' ? '✅' : '❌'
      console.log(`${icon} ${result.name}: ${result.message}`)
    })
    
    return successCount === totalTests
    
  } catch (error) {
    console.error('❌ Unexpected error during connection test:', error)
    return false
  }
}

// Test API patterns with CRUD operations
export const testApiPatterns = async (): Promise<boolean> => {
  console.log('\n🧪 Testing API Patterns...')
  
  const results: TestResult[] = []
  
  try {
    // Test 1: CRUD operations on lab_rooms
    const testRoom = {
      name: 'Test Lab API',
      code: 'TESTAPI',
      type: 'laboratory' as const,
      capacity: 15,
      description: 'Test laboratory for API pattern testing',
      location: 'Test Building'
    }
    
    let createdRoomId: string | null = null
    
    // CREATE test
    console.log('🔨 Testing CREATE operation...')
    try {
      const { data: created, error: createError } = await dbService.create('lab_rooms', testRoom)
      
      if (createError) {
        results.push({
          name: 'CREATE Operation',
          status: 'failed',
          message: `CREATE failed: ${createError.message}`
        })
        console.error('❌ CREATE failed:', createError)
      } else if (created) {
        createdRoomId = created.id
        results.push({
          name: 'CREATE Operation',
          status: 'success',
          message: `CREATE successful: ${created.name}`,
          data: created.id
        })
        console.log('✅ CREATE successful:', created.name)
      } else {
        results.push({
          name: 'CREATE Operation',
          status: 'failed',
          message: 'CREATE failed: No data returned'
        })
        console.error('❌ CREATE failed: No data returned')
      }
    } catch (error) {
      results.push({
        name: 'CREATE Operation',
        status: 'failed',
        message: `CREATE error: ${error}`
      })
      console.error('❌ CREATE error:', error)
    }
    
          // READ test (only if CREATE succeeded)
    if (createdRoomId) {
      console.log('📖 Testing READ operation...')
      try {
        const { data: read, error: readError } = await dbService.getById('lab_rooms', createdRoomId)
        
        if (readError) {
          results.push({
            name: 'READ Operation',
            status: 'failed',
            message: `READ failed: ${readError.message}`
          })
          console.error('❌ READ failed:', readError)
        } else if (read) {
          const readData = read as any
          results.push({
            name: 'READ Operation',
            status: 'success',
            message: `READ successful: ${readData.name || 'Unknown'}`,
            data: readData.id || 'Unknown'
          })
          console.log('✅ READ successful:', readData.name || 'Unknown')
        } else {
          results.push({
            name: 'READ Operation',
            status: 'failed',
            message: 'READ failed: No data returned'
          })
          console.error('❌ READ failed: No data returned')
        }
      } catch (error) {
        results.push({
          name: 'READ Operation',
          status: 'failed',
          message: `READ error: ${error}`
        })
        console.error('❌ READ error:', error)
      }
      
      // UPDATE test
      console.log('✏️ Testing UPDATE operation...')
      try {
        const { data: updated, error: updateError } = await dbService.update('lab_rooms', createdRoomId, {
          description: 'Updated test laboratory description',
          capacity: 20
        })
        
        if (updateError) {
          results.push({
            name: 'UPDATE Operation',
            status: 'failed',
            message: `UPDATE failed: ${updateError.message}`
          })
          console.error('❌ UPDATE failed:', updateError)
        } else if (updated) {
          const updatedData = updated as any
          results.push({
            name: 'UPDATE Operation',
            status: 'success',
            message: `UPDATE successful: ${updatedData.description || 'Updated'}`,
            data: updatedData.capacity || 'Unknown'
          })
          console.log('✅ UPDATE successful:', updatedData.description || 'Updated')
        } else {
          results.push({
            name: 'UPDATE Operation',
            status: 'failed',
            message: 'UPDATE failed: No data returned'
          })
          console.error('❌ UPDATE failed: No data returned')
        }
      } catch (error) {
        results.push({
          name: 'UPDATE Operation',
          status: 'failed',
          message: `UPDATE error: ${error}`
        })
        console.error('❌ UPDATE error:', error)
      }
      
      // DELETE test
      console.log('🗑️ Testing DELETE operation...')
      try {
        const { data: deleted, error: deleteError } = await dbService.delete('lab_rooms', createdRoomId)
        
        if (deleteError) {
          results.push({
            name: 'DELETE Operation',
            status: 'failed',
            message: `DELETE failed: ${deleteError.message}`
          })
          console.error('❌ DELETE failed:', deleteError)
        } else {
          results.push({
            name: 'DELETE Operation',
            status: 'success',
            message: 'DELETE successful',
            data: deleted?.id
          })
          console.log('✅ DELETE successful')
        }
      } catch (error) {
        results.push({
          name: 'DELETE Operation',
          status: 'failed',
          message: `DELETE error: ${error}`
        })
        console.error('❌ DELETE error:', error)
      }
    }
    
    // Test 2: Test business logic operations
    console.log('💼 Testing business logic operations...')
    
    try {
      // Test lab operations
      const { data: labsByType, error: labTypeError } = await akbidDb.labs.getByType('laboratory')
      
      if (labTypeError) {
        results.push({
          name: 'Business Logic - Labs',
          status: 'failed',
          message: `Lab type query failed: ${labTypeError.message}`
        })
        console.error('❌ Lab type query failed:', labTypeError)
      } else {
        results.push({
          name: 'Business Logic - Labs',
          status: 'success',
          message: `Lab type query successful: ${labsByType?.length || 0} laboratories`,
          data: labsByType?.length
        })
        console.log(`✅ Lab type query successful: ${labsByType?.length} laboratories`)
      }
    } catch (error) {
      results.push({
        name: 'Business Logic - Labs',
        status: 'failed',
        message: `Business logic error: ${error}`
      })
      console.error('❌ Business logic error:', error)
    }
    
    // Test 3: Test complex query with joins
    console.log('🔗 Testing complex queries...')
    
    try {
      const { data: schedules, error: scheduleError } = await akbidDb.schedules.getWeeklySchedule()
      
      if (scheduleError) {
        results.push({
          name: 'Complex Query - Schedules',
          status: 'failed',
          message: `Schedule query failed: ${scheduleError.message}`
        })
        console.error('❌ Schedule query failed:', scheduleError)
      } else {
        results.push({
          name: 'Complex Query - Schedules',
          status: 'success',
          message: `Schedule query successful: ${schedules?.length || 0} schedules`,
          data: schedules?.length
        })
        console.log(`✅ Schedule query successful: ${schedules?.length} schedules`)
      }
    } catch (error) {
      results.push({
        name: 'Complex Query - Schedules',
        status: 'failed',
        message: `Complex query error: ${error}`
      })
      console.error('❌ Complex query error:', error)
    }
    
    // Summary
    const successCount = results.filter(r => r.status === 'success').length
    const totalTests = results.length
    
    console.log(`\n📊 API Pattern Test Summary: ${successCount}/${totalTests} tests passed`)
    results.forEach(result => {
      const icon = result.status === 'success' ? '✅' : '❌'
      console.log(`${icon} ${result.name}: ${result.message}`)
    })
    
    return successCount === totalTests
    
  } catch (error) {
    console.error('❌ Unexpected error during API pattern test:', error)
    return false
  }
}

// Comprehensive test runner
export const runAllTests = async (): Promise<{
  success: boolean
  connectionTest: boolean
  apiTest: boolean
}> => {
  console.log('🚀 Running All Supabase Tests...\n')
  
  const connectionTest = await testSupabaseConnection()
  const apiTest = await testApiPatterns()
  
  const success = connectionTest && apiTest
  
  console.log('\n🎯 FINAL TEST RESULTS:')
  console.log(`Database Connection: ${connectionTest ? '✅ PASSED' : '❌ FAILED'}`)
  console.log(`API Patterns: ${apiTest ? '✅ PASSED' : '❌ FAILED'}`)
  console.log(`Overall Status: ${success ? '🎉 ALL TESTS PASSED' : '⚠️ SOME TESTS FAILED'}`)
  
  return {
    success,
    connectionTest,
    apiTest
  }
}

// Helper function to test specific table
export const testTable = async (tableName: string): Promise<boolean> => {
  try {
    const { count, error } = await dbService.count(tableName as any)
    
    if (error) {
      console.error(`❌ Table ${tableName} test failed:`, error.message)
      return false
    }
    
    console.log(`✅ Table ${tableName} accessible: ${count} records`)
    return true
    
  } catch (error) {
    console.error(`❌ Table ${tableName} test error:`, error)
    return false
  }
}

// Test all database tables
export const testAllTables = async (): Promise<boolean> => {
  console.log('🗄️ Testing All Database Tables...')
  
  const tables = [
    'users',
    'permissions', 
    'role_permissions',
    'user_permissions',
    'lab_rooms',
    'mata_kuliah',
    'jadwal_praktikum',
    'inventaris_alat',
    'peminjaman_alat',
    'presensi',
    'materi_praktikum',
    'laporan_mahasiswa', 
    'penilaian',
    'audit_logs'
  ]
  
  const results = await Promise.all(
    tables.map(table => testTable(table))
  )
  
  const successCount = results.filter(Boolean).length
  const totalTables = tables.length
  
  console.log(`\n📊 Table Test Summary: ${successCount}/${totalTables} tables accessible`)
  
  if (successCount === totalTables) {
    console.log('🎉 All database tables are accessible!')
    return true
  } else {
    console.log('⚠️ Some tables are not accessible - check database setup')
    return false
  }
}

// Test authentication (without actually logging in)
export const testAuthSetup = async (): Promise<boolean> => {
  console.log('🔐 Testing Auth Setup...')
  
  try {
    // Test getting current session (should be null for unauthenticated)
    const { session, error } = await authService.getCurrentSession()
    
    if (error) {
      console.error('❌ Auth setup test failed:', error.message)
      return false
    }
    
    console.log('✅ Auth service accessible')
    console.log(`Current session: ${session ? 'User logged in' : 'No active session'}`)
    
    return true
    
  } catch (error) {
    console.error('❌ Auth setup test error:', error)
    return false
  }
}

// Export test utilities
export const testUtils = {
  testSupabaseConnection,
  testApiPatterns,
  runAllTests,
  testTable,
  testAllTables,
  testAuthSetup
}

// Quick health check
export const healthCheck = async (): Promise<{
  status: 'healthy' | 'unhealthy'
  details: {
    database: boolean
    auth: boolean
    tables: boolean
  }
}> => {
  console.log('🏥 Running Health Check...')
  
  const database = await testSupabaseConnection()
  const auth = await testAuthSetup()
  const tables = await testAllTables()
  
  const status = database && auth && tables ? 'healthy' : 'unhealthy'
  
  console.log(`\n🏥 Health Check Result: ${status.toUpperCase()}`)
  
  return {
    status,
    details: {
      database,
      auth,
      tables
    }
  }
}