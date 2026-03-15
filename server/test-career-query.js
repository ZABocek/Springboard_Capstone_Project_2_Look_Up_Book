const path = require('path');
const { Pool } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD || '',
  port: Number(process.env.DB_PORT || 5432),
});

async function testCareers() {
  try {
    console.log('Testing career award query...');
    
    const queryText = `
      SELECT DISTINCT ON (p.full_name)
        b.id,
        COALESCE(p.full_name, 'Unknown Author') as title,
        b.prize_year,
        a.prize_name,
        a.prize_amount
      FROM books b
      JOIN awards a ON b.award_id = a.id
      LEFT JOIN people p ON b.person_id = p.person_id
      WHERE b.award_id = 1 AND b.verified = true AND b.role = 'winner'
      ORDER BY p.full_name ASC
    `;
    
    const result = await pool.query(queryText);
    console.log(`Found ${result.rows.length} career award winners`);
    result.rows.forEach((row, idx) => {
      console.log(`  ${idx+1}. ${row.title} - ${row.prize_name} (${row.prize_year}) - $${row.prize_amount}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

testCareers();
