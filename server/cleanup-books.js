const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  password: 'postgres',
  host: 'localhost',
  port: 5432,
  database: 'look_up_book_db'
});

async function cleanupDatabase() {
  const client = await pool.connect();
  try {
    console.log('Starting database cleanup...\n');

    console.log('1. Counting corrupted book entries (award names as titles)...');
    const countBefore = await client.query(`
      SELECT COUNT(*) as count FROM books 
      WHERE title LIKE '%Award%' 
         OR title LIKE '%Prize%'
    `);
    console.log(`   Found: ${countBefore.rows[0].count} corrupted entries\n`);

    console.log('2. Deleting corrupted entries...');
    const deleteResult = await client.query(`
      DELETE FROM books 
      WHERE title LIKE '%Award%' 
         OR title LIKE '%Prize%'
    `);
    console.log(`   ✅ Deleted: ${deleteResult.rowCount} corrupted entries\n`);

    console.log('3. Checking remaining valid books...');
    const countAfter = await client.query('SELECT COUNT(*) as count FROM books');
    console.log(`   Remaining valid books: ${countAfter.rows[0].count}\n`);

    console.log('4. Sample of valid books:');
    const samples = await client.query('SELECT id, title, author_id FROM books LIMIT 5');
    samples.rows.forEach(row => {
      console.log(`   ID ${row.id}: "${row.title}" by Author ${row.author_id}`);
    });

    console.log('\n✅ Database cleanup complete!');

  } catch (err) {
    console.error('Error:', err);
  } finally {
    client.release();
    pool.end();
  }
}

cleanupDatabase();
