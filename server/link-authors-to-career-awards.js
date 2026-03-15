const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function linkAuthorsToCareers() {
  const client = await pool.connect();
  try {
    console.log('Starting to link authors to career awards...');

    // Get all career award winners
    const query = `
      SELECT b.id, b.person_id, p.full_name, a.prize_name, a.id as award_id
      FROM books b
      JOIN awards a ON b.award_id = a.id
      LEFT JOIN people p ON b.person_id = p.person_id
      WHERE a.prize_type = 'career' 
        AND b.role = 'winner'
        AND b.verified = true
      ORDER BY a.prize_name, p.full_name
    `;

    const result = await client.query(query);
    console.log(`Found ${result.rows.length} career award winner records`);

    // Group by award to see what we have
    const byAward = {};
    result.rows.forEach(row => {
      if (!byAward[row.prize_name]) {
        byAward[row.prize_name] = [];
      }
      byAward[row.prize_name].push({
        person_id: row.person_id,
        full_name: row.full_name || 'UNKNOWN',
        book_id: row.id
      });
    });

    console.log('\n=== CAREER AWARDS BY AUTHOR ===\n');
    Object.keys(byAward).sort().forEach(award => {
      const winners = byAward[award];
      const uniqueAuthors = [...new Set(winners.map(w => w.full_name))];
      console.log(`${award}:`);
      console.log(`  Total records: ${winners.length}`);
      console.log(`  Unique authors: ${uniqueAuthors.length}`);
      uniqueAuthors.slice(0, 5).forEach(author => {
        console.log(`    - ${author}`);
      });
      if (uniqueAuthors.length > 5) {
        console.log(`    ... and ${uniqueAuthors.length - 5} more`);
      }
      console.log();
    });

    // Check for missing author names
    const missingNames = result.rows.filter(r => !r.full_name);
    if (missingNames.length > 0) {
      console.log(`\n⚠️  WARNING: ${missingNames.length} records missing author names`);
      console.log('Sample missing records:');
      missingNames.slice(0, 5).forEach(r => {
        console.log(`  - Book ID: ${r.id}, Person ID: ${r.person_id}, Award: ${r.prize_name}`);
      });
    }

    pool.end();
  } catch (error) {
    console.error('Error:', error);
    pool.end();
    process.exit(1);
  }
}

linkAuthorsToCareers();
