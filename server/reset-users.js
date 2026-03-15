const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  password: 'postgres',
  host: 'localhost',
  port: 5432,
  database: 'look_up_book_db'
});

async function resetDatabase() {
  const client = await pool.connect();
  try {
    console.log('1. Clearing users table...');
    await client.query('TRUNCATE TABLE users RESTART IDENTITY CASCADE');
    console.log('✅ Users table cleared\n');

    console.log('2. Checking book titles...');
    const result = await client.query('SELECT id, title, author_id FROM books LIMIT 5');
    console.log('Sample books:');
    result.rows.forEach(row => {
      console.log(`  ID: ${row.id}, Author: ${row.author_id}, Title: ${row.title}`);
    });
    
    console.log('\n3. Checking for award data in titles...');
    const awardResult = await client.query(`
      SELECT id, title FROM books 
      WHERE title LIKE '%award%' OR title LIKE '%winner%' OR title ~ '[0-9]{4}'
      LIMIT 5
    `);
    
    if (awardResult.rows.length > 0) {
      console.log('⚠️  Found titles with award/year data:');
      awardResult.rows.forEach(row => {
        console.log(`  ID: ${row.id}, Title: ${row.title}`);
      });
    } else {
      console.log('✅ No award data found in titles');
    }

  } catch (err) {
    console.error('Error:', err);
  } finally {
    client.release();
    pool.end();
  }
}

resetDatabase();
