const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'look_up_book_db',
  password: 'postgres',
  port: 5432,
});

async function diagnose() {
  try {
    console.log('\n=== DATABASE DIAGNOSTIC ===\n');
    
    // Get all users
    const result = await pool.query('SELECT id, username, email, hash FROM users ORDER BY id DESC LIMIT 5');
    
    if (result.rows.length === 0) {
      console.log('❌ NO USERS IN DATABASE');
      return;
    }
    
    console.log('Users in database:');
    console.log('-------------------');
    result.rows.forEach((row, idx) => {
      console.log(`\n${idx + 1}. ID: ${row.id}`);
      console.log(`   Username: ${row.username}`);
      console.log(`   Email: ${row.email}`);
      console.log(`   Hash stored: ${row.hash ? 'YES' : 'NO'}`);
      console.log(`   Hash preview: ${row.hash ? row.hash.substring(0, 20) + '...' : 'N/A'}`);
    });
    
    // Now ask user to test a specific password
    console.log('\n\n=== PASSWORD TEST ===');
    console.log('To test if a password works, we need:');
    console.log('1. Which username/email would you like to test?');
    console.log('2. What password did you use to create that account?');
    console.log('\nPlease provide these values in your next message.');
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
}

diagnose();
