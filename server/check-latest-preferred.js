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
  const result = await pool.query(`
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
      COALESCE(book_author.full_name, career_author.full_name, 'Unknown') AS full_name,
      COALESCE(b.prize_year, aa.prize_year, aw.prize_year) AS prize_year,
      COALESCE(book_aw.prize_name, aw.prize_name) AS prize_name
    FROM user_preferred_books upb
    LEFT JOIN books b ON b.id = upb.book_id
    LEFT JOIN authors book_author ON book_author.id = b.author_id
    LEFT JOIN awards book_aw ON book_aw.id = b.award_id
    LEFT JOIN author_awards aa ON aa.id = upb.author_award_id
    LEFT JOIN authors career_author ON career_author.id = aa.author_id
    LEFT JOIN awards aw ON aw.id = aa.award_id
    WHERE upb.user_id = 1
    ORDER BY upb.id DESC
    LIMIT 12;
  `);

  console.log(JSON.stringify({ latest: result.rows }, null, 2));
}

run()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
