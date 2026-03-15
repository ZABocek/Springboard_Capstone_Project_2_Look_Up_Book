const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'look_up_book_db',
  password: 'postgres',
});

pool.query('SELECT column_name, data_type FROM information_schema.columns WHERE table_name = \'people\' ORDER BY ordinal_position', (err, res) => {
  if (err) console.error(err);
  else {
    console.log('People table columns:');
    res.rows.forEach(r => console.log(`  ${r.column_name}: ${r.data_type}`));
  }
  pool.end();
});
