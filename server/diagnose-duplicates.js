const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'look_up_book_db',
  password: 'postgres'
});

async function diagnose() {
  try {
    // Check award records for the Academy of American Poets Fellowship
    console.log('Checking Academy of American Poets Fellowship (award_id 1):\n');
    
    const awardsResult = await pool.query(
      'SELECT id, prize_name, prize_amount FROM awards WHERE prize_name LIKE \'%Academy%\''
    );
    console.log('Award records found:');
    awardsResult.rows.forEach(row => {
      console.log(`  ID: ${row.id}, Name: "${row.prize_name}", Amount: ${row.prize_amount}`);
    });

    // Check books for this award
    console.log('\nBooks for award_id 1:');
    const booksResult = await pool.query(
      'SELECT id, title, award_id, verified FROM books WHERE award_id = 1 LIMIT 5'
    );
    console.log(`Total books with award_id 1: ${booksResult.rows.length}`);
    booksResult.rows.forEach(row => {
      console.log(`  ID: ${row.id}, Title: "${row.title}", Award: ${row.award_id}, Verified: ${row.verified}`);
    });

    // Check if there are multiple award records with same id
    console.log('\nLooking for duplicate award entries in results:');
    const duplicateAwardsResult = await pool.query(`
      SELECT a.id, COUNT(*) as count
      FROM awards a
      GROUP BY a.id
      HAVING COUNT(*) > 1
    `);
    if (duplicateAwardsResult.rows.length > 0) {
      console.log('Found duplicate award IDs:');
      duplicateAwardsResult.rows.forEach(row => {
        console.log(`  Award ID ${row.id}: ${row.count} rows`);
      });
    } else {
      console.log('No duplicate award IDs found');
    }

    // Check the awards table
    console.log('\nAll awards with name variations:');
    const allAwardsResult = await pool.query(`
      SELECT id, prize_name, prize_amount, prize_type 
      FROM awards 
      WHERE prize_name LIKE '%Diamonstein%' OR prize_name LIKE '%Mildred%'
      ORDER BY id
    `);
    allAwardsResult.rows.forEach(row => {
      console.log(`  ID: ${row.id}, Name: "${row.prize_name}", Amount: ${row.prize_amount}, Type: ${row.prize_type}`);
    });

    pool.end();
  } catch (err) {
    console.error('Error:', err);
    pool.end();
  }
}

diagnose();
