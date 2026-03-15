const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'look_up_book_db',
  password: 'postgres',
});

async function checkCareerAwards() {
  try {
    // Count career awards with verified winners
    const result = await pool.query(`
      SELECT 
        a.id, 
        a.prize_name, 
        a.prize_type, 
        COUNT(DISTINCT b.id) as verified_winner_count,
        COUNT(DISTINCT b.prize_year) as years_with_winners
      FROM awards a
      LEFT JOIN books b ON b.award_id = a.id AND b.role = 'winner'
      WHERE a.prize_type = 'career'
      GROUP BY a.id, a.prize_name, a.prize_type
      ORDER BY a.prize_name
    `);

    console.log('\n=== CAREER AWARDS ANALYSIS ===\n');
    result.rows.forEach((r) => {
      console.log(`${r.id}. ${r.prize_name} (${r.prize_type})`);
      console.log(`   Verified Winners: ${r.verified_winner_count}`);
      console.log(`   Years with Winners: ${r.years_with_winners}`);
      console.log('');
    });

    // Get details on which ones actually have winners
    const detailResult = await pool.query(`
      SELECT 
        a.prize_name,
        COUNT(DISTINCT b.id) as winner_count,
        STRING_AGG(DISTINCT b.prize_year::text, ', ' ORDER BY b.prize_year::text DESC) as years,
        STRING_AGG(DISTINCT COALESCE(p.full_name, 'NO NAME'), ', ') as names
      FROM awards a
      LEFT JOIN books b ON b.award_id = a.id AND b.role = 'winner'
      LEFT JOIN people p ON b.person_id = p.person_id
      WHERE a.prize_type = 'career'
      GROUP BY a.prize_name
      ORDER BY winner_count DESC
    `);

    console.log('=== CAREER AWARDS WITH NAMES ===\n');
    detailResult.rows.forEach((r) => {
      console.log(`${r.prize_name}: ${r.winner_count} winners`);
      console.log(`  Years: ${r.years}`);
      console.log(`  Names: ${r.names}`);
      console.log('');
    });

    // Also check book awards by year
    const bookResult = await pool.query(`
      SELECT 
        a.prize_name,
        b.prize_year,
        COUNT(DISTINCT b.id) as book_count
      FROM awards a
      JOIN books b ON b.award_id = a.id AND b.role = 'winner'
      WHERE a.prize_type = 'book'
      GROUP BY a.prize_name, b.prize_year
      ORDER BY a.prize_name, b.prize_year DESC
      LIMIT 20
    `);

    console.log('=== SAMPLE BOOK AWARDS BY YEAR (First 20) ===\n');
    bookResult.rows.forEach((r) => {
      console.log(`${r.prize_name} (${r.prize_year}): ${r.book_count} books`);
    });

    pool.end();
  } catch (error) {
    console.error('Error:', error.message);
    pool.end();
  }
}

checkCareerAwards();
