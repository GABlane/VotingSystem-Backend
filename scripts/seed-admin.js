/**
 * Seed Script: Create Admin User
 *
 * Usage: node scripts/seed-admin.js
 *
 * This script creates a default admin user for development.
 * Make sure the backend server is running on PORT 3001.
 */

const http = require('http');

const adminUser = {
  email: 'admin@voting.com',
  password: 'admin123456'
};

const data = JSON.stringify(adminUser);

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/auth/register',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

console.log('🌱 Seeding admin user...');
console.log(`Email: ${adminUser.email}`);
console.log(`Password: ${adminUser.password}`);
console.log('');

const req = http.request(options, (res) => {
  let responseData = '';

  res.on('data', (chunk) => {
    responseData += chunk;
  });

  res.on('end', () => {
    if (res.statusCode === 201) {
      console.log('✅ Admin user created successfully!');
      console.log('');
      console.log('You can now login at: http://localhost:3000/admin/login');
      console.log(`Email: ${adminUser.email}`);
      console.log(`Password: ${adminUser.password}`);
    } else if (res.statusCode === 400) {
      const error = JSON.parse(responseData);
      if (error.message && error.message.includes('already exists')) {
        console.log('ℹ️  Admin user already exists!');
        console.log('');
        console.log('Login at: http://localhost:3000/admin/login');
        console.log(`Email: ${adminUser.email}`);
        console.log(`Password: ${adminUser.password}`);
      } else {
        console.error('❌ Error creating admin user:');
        console.error(responseData);
      }
    } else {
      console.error(`❌ Error (${res.statusCode}):`);
      console.error(responseData);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Failed to connect to backend server.');
  console.error('Make sure the backend is running on http://localhost:3001');
  console.error('');
  console.error('Start it with: cd backend && npm run start:dev');
  console.error('');
  console.error('Error:', error.message);
});

req.write(data);
req.end();
