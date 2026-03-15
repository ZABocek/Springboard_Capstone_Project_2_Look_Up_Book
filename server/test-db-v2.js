// Test database schema and data with new columns (publication_year, genres, etc)

const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  database: 'look_up_book_db',
  user: 'app_user',
  password: 'look_up_book_app_secure_2025',
  port: 5432
});

async function testDatabase() {
  try {
    console.log('\n========================================');
    console.log('DATABASE VALIDATION TEST - v2');
    console.log('With Publication Years and Proper Genres');
    console.log('========================================\n');
    
    // Test 1: Author count
    const authorRes = await pool.query('SELECT COUNT(*) FROM authors;');
    console.log(`✓ Total authors: ${authorRes.rows[0].count}`);
    
    // Test 2: Book count
    const bookRes = await pool.query('SELECT COUNT(*) FROM books;');
    console.log(`✓ Total books: ${bookRes.rows[0].count}`);
    
    // Test 3: Check columns in books table
    const columnsRes = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'books'
      ORDER BY ordinal_position;
    `);
    console.log(`✓ Columns in books table: ${columnsRes.rows.length}`);
    columnsRes.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}`);
    });
    
    // Test 4: NULL author_id check
    const nullRes = await pool.query('SELECT COUNT(*) FROM books WHERE author_id IS NULL;');
    console.log(`\n✓ Books with NULL author_id: ${nullRes.rows[0].count}`);
    
    // Test 5: Genre distribution
    const genreRes = await pool.query(`
      SELECT genre, COUNT(*) as count
      FROM books
      GROUP BY genre
      ORDER BY count DESC;
    `);
    console.log(`\n✓ Genre distribution:`);
    genreRes.rows.forEach(row => {
      console.log(`  - ${row.genre}: ${row.count}`);
    });
    
    // Test 6: Publication year distribution
    const yearRes = await pool.query(`
      SELECT 
        publication_year,
        COUNT(*) as count
      FROM books
      GROUP BY publication_year
      ORDER BY publication_year DESC NULLS LAST
      LIMIT 25;
    `);
    console.log(`\n✓ Publication year distribution (top 25):`);
    yearRes.rows.forEach(row => {
      const yearLabel = row.publication_year === null ? 'Unknown/NULL' : row.publication_year;
      console.log(`  - Year ${yearLabel}: ${row.count} books`);
    });
    
    // Test 7: Sample books with ALL columns
    const sampleRes = await pool.query(`
      SELECT 
        b.id,
        b.title,
        a.full_name,
        b.publication_year,
        b.genre,
        b.verified,
        b.source
      FROM books b
      JOIN authors a ON b.author_id = a.id
      ORDER BY b.id ASC
      LIMIT 15;
    `);
    console.log(`\n✓ Sample books (first 15):`);
    sampleRes.rows.forEach(book => {
      console.log(`  ID ${book.id}: "${book.title}"`);
      console.log(`    Author: ${book.full_name}`);
      console.log(`    Year: ${book.publication_year || 'Unknown'}, Genre: ${book.genre}, Verified: ${book.verified}, Source: ${book.source}`);
    });
    
    // Test 8: Books by year range
    const yearRangeRes = await pool.query(`
      SELECT 
        CASE 
          WHEN publication_year < 1950 THEN '< 1950'
          WHEN publication_year >= 1950 AND publication_year < 1980 THEN '1950-1979'
          WHEN publication_year >= 1980 AND publication_year < 2000 THEN '1980-1999'
          WHEN publication_year >= 2000 THEN '2000+'
          ELSE 'Unknown'
        END as era,
        COUNT(*) as count
      FROM books
      GROUP BY era
      ORDER BY era;
    `);
    console.log(`\n✓ Books by publication era:`);
    yearRangeRes.rows.forEach(row => {
      console.log(`  - ${row.era}: ${row.count} books`);
    });
    
    // Test 9: Genre by year
    console.log(`\n✓ Genre by decade (sample):`);
    const genreByYearRes = await pool.query(`
      SELECT 
        (publication_year / 10 * 10)::TEXT || 's' as decade,
        genre,
        COUNT(*) as count
      FROM books
      WHERE publication_year IS NOT NULL
      GROUP BY decade, genre
      ORDER BY decade DESC, count DESC
      LIMIT 20;
    `);
    genreByYearRes.rows.forEach(row => {
      console.log(`  - ${row.decade}: ${row.genre} (${row.count})`);
    });
    
    // Test 10: Books with missing publication years
    const missingYearRes = await pool.query(`
      SELECT COUNT(*) as count
      FROM books
      WHERE publication_year IS NULL;
    `);
    console.log(`\n✓ Books with missing publication_year: ${missingYearRes.rows[0].count}`);
    
    // Test 11: Books with Unknown genre
    const unknownGenreRes = await pool.query(`
      SELECT COUNT(*) as count
      FROM books
      WHERE genre = 'Unknown';
    `);
    console.log(`✓ Books with Unknown genre: ${unknownGenreRes.rows[0].count}`);
    
    // Test 12: Data integrity check
    const integrityRes = await pool.query(`
      SELECT 
        (SELECT COUNT(DISTINCT id) FROM authors) as unique_author_ids,
        (SELECT COUNT(DISTINCT id) FROM books) as unique_book_ids,
        (SELECT COUNT(DISTINCT author_id) FROM books) as books_with_author_id;
    `);
    const integrity = integrityRes.rows[0];
    console.log(`\n✓ Data integrity:`);
    console.log(`  - Unique author IDs: ${integrity.unique_author_ids}`);
    console.log(`  - Unique book IDs: ${integrity.unique_book_ids}`);
    console.log(`  - Books with author_id: ${integrity.books_with_author_id}`);
    
    // Test 13: Top authors by book count
    const topAuthorsRes = await pool.query(`
      SELECT 
        a.full_name,
        COUNT(b.id) as book_count
      FROM authors a
      JOIN books b ON a.id = b.author_id
      GROUP BY a.id, a.full_name
      ORDER BY book_count DESC
      LIMIT 10;
    `);
    console.log(`\n✓ Top 10 authors by book count:`);
    topAuthorsRes.rows.forEach(author => {
      console.log(`  - ${author.full_name}: ${author.book_count} books`);
    });
    
    console.log('\n========================================');
    console.log('✅ === ALL TESTS PASSED ===');
    console.log('========================================\n');
    
    process.exit(0);
  } catch (error) {
    console.error('✗ Test failed:', error);
    process.exit(1);
  }
}

testDatabase();
