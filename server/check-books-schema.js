const pg = require('pg');
const pool = new pg.Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'look_up_book_db',
  password: 'postgres',
  port: 5432
});

async function checkSchema() {
  try {
    const result = await pool.query(
      "SELECT column_name FROM information_schema.columns WHERE table_name = 'books' ORDER BY ordinal_position;"
    );
    console.log('Books table columns:');
    result.rows.forEach(r => console.log('  -', r.column_name));
    
    // Also check a sample book
    const sample = await pool.query(
      "SELECT * FROM books WHERE award_id IS NOT NULL LIMIT 1;"
    );
    if (sample.rows.length > 0) {
      console.log('\nSample book with award:');
      console.log(JSON.stringify(sample.rows[0], null, 2));
    }
    
    pool.end();
  } catch (e) {
    console.error(e);
    pool.end();
  }
}

checkSchema();
