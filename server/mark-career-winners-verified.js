const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function markCareerWinnersAsVerified() {
  const client = await pool.connect();
  try {
    console.log('Marking all career award winners as verified...\n');

    // Mark all career award winners as verified
    const updateQuery = `
      UPDATE books b
      SET verified = true
      FROM awards a
      WHERE b.award_id = a.id 
        AND a.prize_type = 'career' 
        AND b.role = 'winner'
        AND b.verified = false
    `;
    
    const result = await client.query(updateQuery);
    console.log(`Updated ${result.rowCount} career award winner records to verified=true\n`);

    // Verify the update
    const verifyQuery = `
      SELECT a.prize_name, COUNT(*) as winner_count
      FROM books b
      JOIN awards a ON b.award_id = a.id
      WHERE a.prize_type = 'career' AND b.verified = true AND b.role = 'winner'
      GROUP BY a.prize_name
      ORDER BY a.prize_name
    `;
    
    const verifyResult = await client.query(verifyQuery);
    console.log('Career awards with verified winners:\n');
    verifyResult.rows.forEach(row => {
      console.log(`${row.prize_name}: ${row.winner_count} verified winners`);
    });

    console.log(`\nTotal verified career award winners: ${verifyResult.rows.reduce((sum, r) => sum + r.winner_count, 0)}`);
    
    pool.end();
  } catch (error) {
    console.error('Error:', error);
    pool.end();
    process.exit(1);
  }
}

markCareerWinnersAsVerified();
