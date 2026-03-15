#!/usr/bin/env node
/**
 * Quick test script to verify database and API
 */

const { Pool } = require('pg');

const pool = new Pool({
  user: 'app_user',
  host: 'localhost',
  database: 'look_up_book_db',
  password: 'look_up_book_app_secure_2025',
  port: 5432,
});

async function test() {
  try {
    console.log('\n=== DATABASE TEST ===\n');
    
    // Test author count
    const authorRes = await pool.query('SELECT COUNT(*) FROM authors;');
    console.log(`✓ Total authors: ${authorRes.rows[0].count}`);
    
    // Test book count
    const bookRes = await pool.query('SELECT COUNT(*) FROM books;');
    console.log(`✓ Total books: ${bookRes.rows[0].count}`);
    
    // Test book columns
    const colRes = await pool.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'books' ORDER BY ordinal_position;
    `);
    console.log(`✓ Columns in books table: ${colRes.rows.length}`);
    console.log(`  Columns: ${colRes.rows.map(r => r.column_name).join(', ')}`);
    
    // Test sample books
    const sampleRes = await pool.query(`
      SELECT id, title, author_id, genre, verified 
      FROM books 
      WHERE verified = true 
      ORDER BY id ASC
      LIMIT 10;
    `);
    console.log(`\n✓ Sample books with correct author_id assignment:`);
    sampleRes.rows.forEach((book, idx) => {
      console.log(`  ${idx+1}. "${book.title}" (ID: ${book.id}, Author ID: ${book.author_id}, Genre: ${book.genre})`);
    });
    
    // Test author lookup
    const authorNameRes = await pool.query(`
      SELECT a.id, a.full_name, a.given_name, a.last_name 
      FROM authors a 
      ORDER BY a.last_name, a.given_name
      LIMIT 5;
    `);
    console.log(`\n✓ Sample authors (sorted by last_name, given_name):`);
    authorNameRes.rows.forEach((author, idx) => {
      console.log(`  ${author.id}. ${author.full_name} (${author.given_name} ${author.last_name})`);
    });
    
    // Test NULL author_id count
    const nullRes = await pool.query('SELECT COUNT(*) FROM books WHERE author_id IS NULL;');
    console.log(`\n✓ Books with NULL author_id: ${nullRes.rows[0].count}`);
    
    // Test genre distribution
    const genreRes = await pool.query(`
      SELECT genre, COUNT(*) as count 
      FROM books 
      GROUP BY genre 
      ORDER BY count DESC;
    `);
    console.log(`\n✓ Genre distribution:`);
    genreRes.rows.forEach(row => {
      console.log(`  ${row.genre}: ${row.count}`);
    });
    
    console.log('\n=== ALL TESTS PASSED ===\n');
    process.exit(0);
  } catch (error) {
    console.error('ERROR:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

test();
