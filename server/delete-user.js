const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'look_up_book_db',
  password: 'postgres',
  port: 5432,
});

async function deleteUser() {
  try {
    console.log('\nDeleting user with email zabocek@gmail.com...');
    const result = await pool.query(
      'DELETE FROM users WHERE email = $1 RETURNING id, username, email',
      ['zabocek@gmail.com']
    );
    
    if (result.rows.length > 0) {
      console.log(`✓ DELETED: ${result.rows[0].username} (${result.rows[0].email})`);
    } else {
      console.log('No user found with that email');
    }
    
    // Show remaining users
    const allUsers = await pool.query('SELECT id, username, email FROM users');
    console.log(`\nRemaining users: ${allUsers.rows.length}`);
    allUsers.rows.forEach(u => {
      console.log(`  - ID ${u.id}: ${u.username} (${u.email})`);
    });
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
}

deleteUser();
