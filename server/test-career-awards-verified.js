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

async function testCareerAwardsWithVerifiedWinners() {
  const client = await pool.connect();
  try {
    console.log('=== CAREER AWARDS WITH VERIFIED WINNERS ===\n');

    const query = `
      SELECT a.id, a.prize_name, COUNT(*) as winner_count
      FROM books b
      JOIN awards a ON b.award_id = a.id
      WHERE a.prize_type = 'career' 
        AND b.verified = true 
        AND b.role = 'winner'
      GROUP BY a.id, a.prize_name
      ORDER BY a.prize_name
    `;
    
    const result = await client.query(query);
    console.log(`Found ${result.rowCount} career awards with verified winners:\n`);
    
    result.rows.forEach(row => {
      console.log(`Award ID ${row.id}: ${row.prize_name}`);
      console.log(`  Verified winners: ${row.winner_count}\n`);
    });

    // Now get the actual author names for the first career award with winners
    if (result.rows.length > 0) {
      const firstAward = result.rows[0];
      console.log(`\n=== SAMPLE: ${firstAward.prize_name} (ID: ${firstAward.id}) ===\n`);
      
      const authorsQuery = `
        SELECT DISTINCT p.full_name, COUNT(*) as occurrences
        FROM books b
        JOIN awards a ON b.award_id = a.id
        LEFT JOIN people p ON b.person_id = p.person_id
        WHERE a.id = $1 
          AND b.verified = true 
          AND b.role = 'winner'
        GROUP BY p.full_name
        ORDER BY p.full_name
      `;
      
      const authorsResult = await client.query(authorsQuery, [firstAward.id]);
      console.log(`Authors:`);
      authorsResult.rows.forEach(row => {
        console.log(`  - ${row.full_name} (${row.occurrences})`);
      });
    }
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

testCareerAwardsWithVerifiedWinners();
