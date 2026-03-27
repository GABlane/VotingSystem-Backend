/**
 * Test Supabase Connection
 *
 * This script tests if the backend can connect to Supabase
 * and if the admin_users table exists.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Testing Supabase Connection...\n');
console.log('Supabase URL:', supabaseUrl);
console.log('Service Role Key:', supabaseKey ? `${supabaseKey.substring(0, 20)}...` : 'NOT SET');
console.log('');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  console.log('\nPlease check your .env file has:');
  console.log('- SUPABASE_URL');
  console.log('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    // Test 1: Check if we can query the admin_users table
    console.log('Test 1: Checking admin_users table...');
    const { data, error } = await supabase
      .from('admin_users')
      .select('count')
      .limit(0);

    if (error) {
      console.error('❌ Failed to access admin_users table');
      console.error('Error:', error.message);
      console.log('\n💡 This usually means:');
      console.log('   1. The database schema has not been applied');
      console.log('   2. Run backend/database/schema.sql in Supabase SQL Editor');
      return false;
    }

    console.log('✅ admin_users table exists\n');

    // Test 2: Count existing admin users
    console.log('Test 2: Counting existing admin users...');
    const { count, error: countError } = await supabase
      .from('admin_users')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('❌ Error counting users:', countError.message);
      return false;
    }

    console.log(`✅ Found ${count} admin user(s) in database\n`);

    // Test 3: List existing users (emails only)
    if (count > 0) {
      console.log('Test 3: Listing existing admin users...');
      const { data: users, error: listError } = await supabase
        .from('admin_users')
        .select('email, created_at');

      if (!listError && users) {
        users.forEach(user => {
          console.log(`  - ${user.email} (created: ${new Date(user.created_at).toLocaleDateString()})`);
        });
      }
      console.log('');
    }

    return true;
  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
    return false;
  }
}

testConnection().then(success => {
  if (success) {
    console.log('🎉 Supabase connection is working!');
    console.log('\nYou can now run: node scripts/seed-admin.js');
  } else {
    console.log('\n⚠️  Please fix the issues above before running the seeder.');
  }
  process.exit(success ? 0 : 1);
});
