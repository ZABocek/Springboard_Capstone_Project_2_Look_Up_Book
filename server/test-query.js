const { Pool } = require('pg');
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'look_up_book_db',
  password: 'postgres'
});

// Test the exact query with award_id 37
const queryText = `
  SELECT 
    b.id,
    b.book_id,
    b.title,
    b.author_id,
    b.person_id,
    b.award_id,
    b.prize_year,
    b.genre,
    b.verified,
    b.role,
    b.source,
    a.id as award_id_from_awards,
    a.prize_name,
    a.prize_amount,
    b.title as title_of_winning_book
  FROM books b
  JOIN awards a ON b.award_id = a.id
  WHERE b.award_id = $1 AND b.title IS NOT NULL AND b.title != ''
  ORDER BY b.prize_year DESC;
`;

pool.query(queryText, [37], (err, result) => {
  if (err) {
    console.log('ERROR:', err.message);
    process.exit(1);
  } else {
    console.log('Query returned', result.rows.length, 'rows');
    if (result.rows.length > 0) {
      console.log('First row title:', result.rows[0].title);
      console.log('First row award_id:', result.rows[0].award_id);
    } else {
      console.log('No results. Testing components...');
      pool.query('SELECT COUNT(*) as cnt FROM books WHERE award_id = 37', (err2, res2) => {
        console.log('Books with award_id 37:', res2.rows[0].cnt);
        pool.query('SELECT COUNT(*) as cnt FROM awards WHERE id = 37', (err3, res3) => {
          console.log('Awards with id 37:', res3.rows[0].cnt);
          pool.query('SELECT COUNT(*) as cnt FROM books b JOIN awards a ON b.award_id = a.id WHERE b.award_id = 37', (err4, res4) => {
            console.log('JOIN result count for award_id 37:', res4.rows[0].cnt);
            pool.query('SELECT COUNT(*) as cnt FROM books WHERE award_id = 37 AND title IS NOT NULL AND title != \'\'', (err5, res5) => {
              console.log('Books with award_id 37 AND title NOT NULL:', res5.rows[0].cnt);
              pool.end();
              process.exit(0);
            });
          });
        });
      });
    }
  }
});
