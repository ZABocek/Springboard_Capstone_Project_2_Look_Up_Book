const pg = require('pg');

const pool = new pg.Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'look_up_book_db',
  password: 'postgres'
});

pool.query(`
  SELECT DISTINCT role, COUNT(*) as count
  FROM books
  WHERE award_id IS NOT NULL
  GROUP BY role
  ORDER BY count DESC
`, (err, res) => {
  if (err) {
    console.error('ERROR:', err);
  } else {
    console.log('\n=== Book Roles in Database ===\n');
    res.rows.forEach(r => {
      console.log(`Role: "${r.role}" - ${r.count} records`);
    });
  }
  pool.end();
});
