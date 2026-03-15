const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'look_up_book_db',
  password: 'postgres',
  port: 5432,
});

async function testQuery() {
  try {
    console.log('\n=== TESTING LOGIN QUERY ===\n');
    
    // Test 1: Query with email (case-insensitive)
    const testEmail = 'zabocek@gmail.com';
    console.log(`Test 1: Looking for email: "${testEmail}"`);
    const result1 = await pool.query(
      "SELECT id, username, email FROM users WHERE LOWER(username) = LOWER($1) OR LOWER(email) = LOWER($1)",
      [testEmail]
    );
    console.log(`Result: ${result1.rows.length} row(s) found`);
    if (result1.rows.length > 0) {
      console.log(`  User: ${result1.rows[0].username} / ${result1.rows[0].email}`);
    } else {
      console.log('  ❌ USER NOT FOUND!');
    }
    
    // Test 2: Query with username
    const testUsername = 'zdenek andrew bocek';
    console.log(`\nTest 2: Looking for username: "${testUsername}"`);
    const result2 = await pool.query(
      "SELECT id, username, email FROM users WHERE LOWER(username) = LOWER($1) OR LOWER(email) = LOWER($1)",
      [testUsername]
    );
    console.log(`Result: ${result2.rows.length} row(s) found`);
    if (result2.rows.length > 0) {
      console.log(`  User: ${result2.rows[0].username} / ${result2.rows[0].email}`);
    } else {
      console.log('  ❌ USER NOT FOUND!');
    }
    
    // Test 3: Show all users for comparison
    console.log('\nAll users in database:');
    const allUsers = await pool.query('SELECT id, username, email FROM users');
    allUsers.rows.forEach(user => {
      console.log(`  ID ${user.id}: ${user.username} (${user.email})`);
    });
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
}

testQuery();
