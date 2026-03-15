require('dotenv').config({ path: '.env' });
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function run() {
  const tables = [
    'authors',
    'people',
    'awards',
    'books',
    'book_awards',
    'users',
    'user_preferred_books',
    'user_book_likes',
  ];

  for (const table of tables) {
    const countRes = await pool.query(`SELECT COUNT(*)::int AS c FROM ${table}`);
    console.log(`${table}: ${countRes.rows[0].c}`);
  }

  const booksCols = await pool.query(
    "SELECT column_name FROM information_schema.columns WHERE table_name='books' ORDER BY ordinal_position"
  );
  console.log('books columns:', booksCols.rows.map((r) => r.column_name).join(', '));

  const authorsCols = await pool.query(
    "SELECT column_name FROM information_schema.columns WHERE table_name='authors' ORDER BY ordinal_position"
  );
  console.log('authors columns:', authorsCols.rows.map((r) => r.column_name).join(', '));

  const awardsCols = await pool.query(
    "SELECT column_name FROM information_schema.columns WHERE table_name='awards' ORDER BY ordinal_position"
  );
  console.log('awards columns:', awardsCols.rows.map((r) => r.column_name).join(', '));

  const missingAuthorIds = await pool.query('SELECT COUNT(*)::int AS c FROM books WHERE author_id IS NULL');
  const missingBookIds = await pool.query('SELECT COUNT(*)::int AS c FROM books WHERE book_id IS NULL');
  const missingAwardYears = await pool.query(`
    SELECT COUNT(*)::int AS c
    FROM books
    WHERE role = 'winner'
      AND award_id IS NOT NULL
      AND prize_year IS NULL
  `);

  const careerWinners = await pool.query(`
    SELECT COUNT(*)::int AS c
    FROM books b
    JOIN awards a ON a.id = b.award_id
    WHERE b.verified = true
      AND b.role = 'winner'
      AND a.prize_type = 'career'
  `);

  const nullTitleRows = await pool.query(`
    SELECT COUNT(*)::int AS c
    FROM books
    WHERE verified = true
      AND title IS NULL
  `);

  console.log('books missing author_id:', missingAuthorIds.rows[0].c);
  console.log('books missing book_id:', missingBookIds.rows[0].c);
  console.log('awarded winner books missing prize_year:', missingAwardYears.rows[0].c);
  console.log('career winner rows:', careerWinners.rows[0].c);
  console.log('verified rows with null title:', nullTitleRows.rows[0].c);
}

run()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
