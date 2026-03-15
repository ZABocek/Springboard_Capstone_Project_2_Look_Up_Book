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
  const authorRows = await pool.query(`
    SELECT
      a.id AS author_id,
      a.full_name,
      b.id AS book_row_id,
      b.book_id,
      b.title,
      aa.id AS author_award_id,
      aw.prize_name,
      aw.prize_type
    FROM authors a
    LEFT JOIN books b ON b.author_id = a.id
    LEFT JOIN author_awards aa ON aa.author_id = a.id
    LEFT JOIN awards aw ON aw.id = aa.award_id
    WHERE a.full_name = 'Danez Smith'
    ORDER BY b.id NULLS LAST, aa.id NULLS LAST;
  `);

  const preferredRows = await pool.query(`
    SELECT
      upb.id,
      upb.user_id,
      CASE
        WHEN upb.author_award_id IS NOT NULL THEN 'career'
        ELSE 'book'
      END AS preference_type,
      upb.book_id,
      upb.author_award_id,
      COALESCE(b.title, 'Career Award') AS title,
      COALESCE(book_author.full_name, career_author.full_name) AS full_name,
      COALESCE(b.prize_year, aa.prize_year, aw.prize_year) AS prize_year,
      COALESCE(b.role, aa.role) AS role,
      COALESCE(book_aw.prize_name, aw.prize_name) AS prize_name
    FROM user_preferred_books upb
    LEFT JOIN books b ON b.id = upb.book_id
    LEFT JOIN authors book_author ON book_author.id = b.author_id
    LEFT JOIN awards book_aw ON book_aw.id = b.award_id
    LEFT JOIN author_awards aa ON aa.id = upb.author_award_id
    LEFT JOIN authors career_author ON career_author.id = aa.author_id
    LEFT JOIN awards aw ON aw.id = aa.award_id
    WHERE COALESCE(book_author.full_name, career_author.full_name) = 'Danez Smith'
    ORDER BY upb.id DESC;
  `);

  const careerBooksRemaining = await pool.query(`
    SELECT COUNT(*)::int AS count
    FROM books b
    LEFT JOIN book_awards ba ON ba.book_id = b.id
    LEFT JOIN awards aw ON aw.id = COALESCE(ba.award_id, b.award_id)
    WHERE COALESCE(aw.prize_type, '') = 'career';
  `);

  console.log(
    JSON.stringify(
      {
        authorRows: authorRows.rows,
        preferredCount: preferredRows.rows.length,
        preferredRows: preferredRows.rows,
        careerBooksRemaining: careerBooksRemaining.rows[0].count,
      },
      null,
      2,
    ),
  );
}

run()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
