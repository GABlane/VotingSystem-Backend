const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcrypt');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testInsert() {
  console.log('Testing direct insert to admin_users...\n');

  const email = 'admin@voting.com';
  const password = 'admin123456';

  // Hash password
  const passwordHash = await bcrypt.hash(password, 10);

  console.log('Attempting to insert user:', email);

  const { data, error } = await supabase
    .from('admin_users')
    .insert({
      email: email,
      password_hash: passwordHash,
    })
    .select()
    .single();

  if (error) {
    console.error('\n❌ Insert failed!');
    console.error('Error details:', JSON.stringify(error, null, 2));
  } else {
    console.log('\n✅ User created successfully!');
    console.log('User data:', data);
  }
}

testInsert();
