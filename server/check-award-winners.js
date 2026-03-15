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
    COUNT(DISTINCT b.book_id) as winners
  FROM awards a 
  LEFT JOIN books b ON a.id = b.award_id AND b.verified = true 
  GROUP BY a.id, a.prize_name, a.prize_type 
  ORDER BY winners ASC, a.prize_name
`, (err, res) => {
  if (err) {
    console.error('ERROR:', err);
  } else {
    console.log('\n=== AWARDS WITH FEW/NO WINNERS ===\n');
    res.rows.forEach(r => {
      const id = r.id.toString().padStart(3);
      const type = r.prize_type.padEnd(6);
      const winners = r.winners.toString().padStart(3);
      console.log(`${id} | ${type} | ${winners} winners | ${r.prize_name}`);
    });
    
    const zero = res.rows.filter(x => x.winners === 0).length;
    const few = res.rows.filter(x => x.winners > 0 && x.winners <= 5).length;
    
    console.log(`\nTotal with 0 winners: ${zero}`);
    console.log(`Total with 1-5 winners: ${few}`);
  }
  pool.end();
});
