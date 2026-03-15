const pg = require('pg');
const pool = new pg.Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'look_up_book_db',
  password: 'postgres',
  port: 5432
});

async function testBooks() {
  try {
    const result = await pool.query(
      "SELECT b.id, b.title, a.full_name, a.given_name, a.last_name, aw.prize_name, b.prize_year FROM books b LEFT JOIN authors a ON b.author_id = a.id LEFT JOIN awards aw ON b.award_id = aw.id WHERE a.given_name IS NOT NULL AND a.last_name IS NOT NULL AND aw.prize_name IS NOT NULL LIMIT 10;"
    );
    
    console.log('\n✓ Sample books with both author and award data:\n');
    result.rows.forEach(r => {
      console.log(`  "${r.title.substring(0, 40)}"` + 
        `\n    by ${r.given_name} ${r.last_name}` + 
        `\n    ${r.prize_name} (${r.prize_year})\n`);
    });
    
    pool.end();
  } catch (e) {
    console.error(e);
    pool.end();
  }
}

testBooks();
