const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'look_up_book_db',
  password: 'postgres'
});

async function checkSchema() {
  try {
    const result = await pool.query('SELECT * FROM books LIMIT 1');
    if (result.rows.length > 0) {
      const columns = Object.keys(result.rows[0]);
      console.log('Books table columns:');
      columns.forEach((col, i) => {
        console.log(`  ${i + 1}. ${col}`);
      });
      console.log('\nSample book:');
      const book = result.rows[0];
      console.log(`  ID: ${book.id}`);
      console.log(`  Title: ${book.title}`);
      console.log(`  Award ID: ${book.award_id}`);
      if ('verified' in book) {
        console.log(`  Verified: ${book.verified}`);
      } else {
        console.log('  NOTE: No "verified" column found');
      }
    }
    pool.end();
  } catch (err) {
    console.error('Error:', err.message);
    pool.end();
  }
}

checkSchema();
