const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  password: 'postgres',
  host: 'localhost',
  port: 5432,
  database: 'look_up_book_db'
});

async function fixBookTitles() {
  const client = await pool.connect();
  try {
    console.log('Analyzing books with award-like titles...\n');

    // Find books where title looks like an award instead of a book title
    const badTitles = await client.query(`
      SELECT id, title FROM books 
      WHERE title LIKE '%Award%' 
         OR title LIKE '%Prize%'
         OR title LIKE '%award%'
         OR title LIKE '%prize%'
      ORDER BY id
    `);

    console.log(`Found ${badTitles.rows.length} books with suspicious titles:\n`);
    badTitles.rows.forEach(row => {
      console.log(`ID ${row.id}: "${row.title}"`);
    });

    console.log('\n⚠️  These appear to be award names, not book titles.');
    console.log('They should be removed or replaced with actual book titles.\n');

    // Identify which ones are definitely awards
    const awards = await client.query(`
      SELECT DISTINCT title FROM books 
      WHERE title SIMILAR TO '%(Arts and Letters|Bollingen|Whiting)%'
    `);

    console.log('Books that are definitely awards (not book titles):');
    awards.rows.forEach(row => {
      console.log(`  - "${row.title}"`);
    });

    console.log('\nThese should be deleted from the books table.');
    console.log('\nTo fix this:');
    console.log('1. These award entries should be removed (they\'re not books)');
    console.log('2. Or they should be linked to actual book titles via the awards table\n');

    // Count total affected
    console.log(`Total books with award-like titles: ${badTitles.rows.length}`);
    console.log('Recommendation: Delete these entries as they are not actual books.\n');

  } catch (err) {
    console.error('Error:', err);
  } finally {
    client.release();
    pool.end();
  }
}

fixBookTitles();
