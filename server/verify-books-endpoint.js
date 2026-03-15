const pg = require('pg');
const pool = new pg.Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'look_up_book_db',
  password: 'postgres',
  port: 5432
});

async function test() {
  try {
    const result = await pool.query(`
      SELECT COUNT(*) FROM books b 
      LEFT JOIN authors a ON b.author_id = a.id 
      LEFT JOIN awards aw ON b.award_id = aw.id 
      WHERE b.title IS NOT NULL AND b.title != '' 
        AND b.award_id IS NOT NULL
        AND a.given_name IS NOT NULL AND a.given_name != ''
        AND a.last_name IS NOT NULL AND a.last_name != '';
    `);
    console.log('\n✓ Award-winning books with full author info:', result.rows[0].count);
    
    // Show sample
    const sample = await pool.query(`
      SELECT b.title, a.given_name, a.last_name, aw.prize_name, b.prize_year
      FROM books b 
      LEFT JOIN authors a ON b.author_id = a.id 
      LEFT JOIN awards aw ON b.award_id = aw.id 
      WHERE b.title IS NOT NULL AND b.title != '' 
        AND b.award_id IS NOT NULL
        AND a.given_name IS NOT NULL AND a.given_name != ''
        AND a.last_name IS NOT NULL AND a.last_name != ''
      LIMIT 5;
    `);
    
    console.log('\n✓ Sample books:\n');
    sample.rows.forEach(r => {
      console.log(`  "${r.title.substring(0, 40)}" by ${r.given_name} ${r.last_name}`);
      console.log(`    ${r.prize_name} (${r.prize_year})\n`);
    });
    
    pool.end();
  } catch (e) {
    console.error(e);
    pool.end();
  }
}

test();
