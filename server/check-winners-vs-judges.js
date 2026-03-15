const pg = require('pg');

const pool = new pg.Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'look_up_book_db',
  password: 'postgres'
});

pool.query(`
  SELECT 
    a.id,
    a.prize_name,
    a.prize_type,
    COUNT(CASE WHEN b.role = 'winner' THEN 1 END) as winners,
    COUNT(CASE WHEN b.role = 'judge' THEN 1 END) as judges,
    COUNT(CASE WHEN b.role IS NULL THEN 1 END) as nulls
  FROM books b
  JOIN awards a ON b.award_id = a.id
  WHERE a.prize_type = 'career'
  GROUP BY a.id, a.prize_name, a.prize_type
  ORDER BY a.prize_name
`, (err, res) => {
  if (err) {
    console.error('ERROR:', err);
  } else {
    console.log('\n=== Career Awards: Winners vs Judges ===\n');
    res.rows.forEach(r => {
      const id = r.id.toString().padStart(3);
      const w = r.winners.toString().padStart(3);
      const j = r.judges.toString().padStart(3);
      console.log(`ID ${id}: ${w} winners | ${j} judges | ${r.prize_name}`);
    });
  }
  pool.end();
});
