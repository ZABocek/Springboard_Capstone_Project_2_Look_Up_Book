const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'look_up_book_db',
  password: 'postgres',
  port: 5432,
});

async function test() {
  try {
    // Check if there are any books with award_id values
    const bookCheck = await pool.query('SELECT COUNT(*) as total_books FROM books WHERE award_id IS NOT NULL AND award_id > 0');
    console.log(`Books with award_id: ${bookCheck.rows[0].total_books}`);

    // Check specific award
    const awardCheck = await pool.query('SELECT * FROM awards WHERE id = 1');
    console.log(`\nAward ID 1: ${awardCheck.rows.length > 0 ? awardCheck.rows[0].prize_name : 'Not found'}`);

    // Check books for award 1
    const booksForAward1 = await pool.query(`
      SELECT b.id, b.title, b.award_id, a.prize_name
      FROM books b
      LEFT JOIN awards a ON b.award_id = a.id
      WHERE b.award_id = 1
      LIMIT 5
    `);
    console.log(`\nBooks with award_id = 1: ${booksForAward1.rows.length}`);
    if (booksForAward1.rows.length > 0) {
      console.log('Sample books:');
      booksForAward1.rows.forEach(row => {
        console.log(`  - ${row.title} (Award: ${row.prize_name})`);
      });
    }

    // Check all awards and their book counts
    const awardStats = await pool.query(`
      SELECT a.id, a.prize_name, COUNT(b.id) as book_count
      FROM awards a
      LEFT JOIN books b ON a.id = b.award_id
      GROUP BY a.id, a.prize_name
      ORDER BY a.id
      LIMIT 10
    `);
    console.log(`\nFirst 10 awards with book counts:`);
    awardStats.rows.forEach(row => {
      console.log(`  Award ${row.id}: ${row.prize_name} = ${row.book_count} books`);
    });

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
}

test();
