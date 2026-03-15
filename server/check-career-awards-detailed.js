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
    COUNT(*) as total_books,
    COUNT(DISTINCT b.person_id) as unique_people,
    COUNT(CASE WHEN b.verified = true THEN 1 END) as verified_count,
    COUNT(CASE WHEN b.verified = false THEN 1 END) as unverified_count
  FROM books b 
  JOIN awards a ON a.id = b.award_id 
  WHERE a.prize_type = 'career' 
  GROUP BY a.id, a.prize_name 
  ORDER BY a.prize_name
`, (err, res) => {
  if (err) {
    console.error('ERROR:', err);
  } else {
    console.log('\n=== Career Awards in Database ===\n');
    res.rows.forEach(r => {
      const id = r.id.toString().padStart(3);
      const total = r.total_books.toString().padStart(4);
      const unique = r.unique_people.toString().padStart(3);
      const verified = r.verified_count.toString().padStart(3);
      console.log(`ID ${id}: ${total} total | ${unique} unique people | ${verified} verified`);
    });
    
    console.log('\n');
    const totalRecords = res.rows.reduce((sum, r) => sum + parseInt(r.total_books), 0);
    const verifiedRecords = res.rows.reduce((sum, r) => sum + parseInt(r.verified_count), 0);
    console.log(`Total career award records: ${totalRecords}`);
    console.log(`Verified records: ${verifiedRecords}`);
  }
  pool.end();
});
