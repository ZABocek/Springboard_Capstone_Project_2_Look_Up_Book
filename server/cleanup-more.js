const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  password: 'postgres',
  host: 'localhost',
  port: 5432,
  database: 'look_up_book_db'
});

async function cleanupMore() {
  const client = await pool.connect();
  try {
    console.log('Finding more corrupted entries...\n');

    // Find all titles that look like awards
    const result = await client.query(`
      SELECT DISTINCT title FROM books 
      WHERE title LIKE '%Poet%' 
         OR title LIKE '%Lannan%'
         OR title LIKE '%Fellowship%'
         OR title LIKE '%Laureate%'
      ORDER BY title
    `);

    console.log(`Found ${result.rows.length} unique titles with award keywords:\n`);
    result.rows.forEach(row => {
      console.log(`  - "${row.title}"`);
    });

    console.log('\nDeleting entries with these patterns...');
    const deleteResult = await client.query(`
      DELETE FROM books 
      WHERE title LIKE '%Poet%' 
         OR title LIKE '%Lannan%'
         OR title LIKE '%Fellowship%'
         OR title LIKE '%Laureate%'
    `);

    console.log(`✅ Deleted ${deleteResult.rowCount} more corrupted entries\n`);

    // Count remaining books
    const countAfter = await client.query('SELECT COUNT(*) as count FROM books');
    console.log(`Remaining valid books: ${countAfter.rows[0].count}\n`);

    console.log('Sample of current books:');
    const samples = await client.query('SELECT id, title, author_id FROM books LIMIT 5');
    samples.rows.forEach(row => {
      console.log(`  ID ${row.id}: "${row.title}" by Author ${row.author_id}`);
    });

  } catch (err) {
    console.error('Error:', err);
  } finally {
    client.release();
    pool.end();
  }
}

cleanupMore();
