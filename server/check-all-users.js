const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'look_up_book_db',
  password: 'postgres',
  port: 5432,
});

async function checkAll() {
  try {
    const result = await pool.query('SELECT id, username, email FROM users ORDER BY id');
    console.log(`Total users: ${result.rows.length}\n`);
    result.rows.forEach(row => {
      console.log(`ID ${row.id}: "${row.username}" / "${row.email}"`);
    });
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
}

checkAll();
