const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'look_up_book_db',
  password: 'postgres'
});

async function updateAwardsWithPrizeType() {
  try {
    console.log('Starting award prize_type update...\n');

    // Read the winners data file
    const winnersFile = path.join(__dirname, '../data/data-fd3921e84d182dea82a7615f0a9dccbaaab6dedd/major_literary_prizes/major_literary_prizes-winners_judges.tsv');
    const winnersData = fs.readFileSync(winnersFile, 'utf8').split('\n').slice(1);

    console.log(`Loaded ${winnersData.length} winner records\n`);

    // Parse the TSV data to get unique prize_name -> prize_type mapping
    const prizeTypeMap = {}; // { "Prize Name": "book" | "career" }

    for (const line of winnersData) {
      if (!line.trim()) continue;

      const parts = line.split('\t');
      if (parts.length < 21) continue;

      const prizeName = parts[16]?.trim(); // Column 16 is prize_name (0-indexed)
      const prizeType = parts[19]?.trim(); // Column 19 is prize_type (0-indexed)

      if (prizeName && prizeType && !prizeTypeMap[prizeName]) {
        prizeTypeMap[prizeName] = prizeType;
      }
    }

    console.log('Prize type mapping found:');
    Object.entries(prizeTypeMap).forEach(([name, type]) => {
      console.log(`  "${name}" -> ${type}`);
    });
    console.log('');

    // Update the awards table
    let updated = 0;
    let bookAwards = 0;
    let careerAwards = 0;
    let unknownAwards = 0;

    for (const [prizeName, prizeType] of Object.entries(prizeTypeMap)) {
      await pool.query(
        'UPDATE awards SET prize_type = $1 WHERE prize_name = $2',
        [prizeType, prizeName]
      );
      updated++;

      if (prizeType === 'book') bookAwards++;
      else if (prizeType === 'career') careerAwards++;
      else unknownAwards++;
    }

    console.log(`Updated ${updated} awards`);
    console.log(`  - Book awards: ${bookAwards}`);
    console.log(`  - Career awards: ${careerAwards}`);
    console.log(`  - Unknown/Other: ${unknownAwards}\n`);

    // Verify the update
    const verifyResult = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN prize_type = 'book' THEN 1 END) as book_awards,
        COUNT(CASE WHEN prize_type = 'career' THEN 1 END) as career_awards,
        COUNT(CASE WHEN prize_type IS NULL THEN 1 END) as null_awards
      FROM awards
    `);

    const stats = verifyResult.rows[0];
    console.log('Awards table after update:');
    console.log(`  Total awards: ${stats.total}`);
    console.log(`  Book awards: ${stats.book_awards}`);
    console.log(`  Career awards: ${stats.career_awards}`);
    console.log(`  NULL prize_type: ${stats.null_awards}\n`);

    // Show breakdown
    const breakdownResult = await pool.query(`
      SELECT prize_type, COUNT(*) as cnt
      FROM awards
      GROUP BY prize_type
      ORDER BY cnt DESC
    `);

    console.log('Prize type breakdown:');
    breakdownResult.rows.forEach(row => {
      console.log(`  ${row.prize_type || 'NULL'}: ${row.cnt}`);
    });

    pool.end();
    console.log('\nDone!');
  } catch (error) {
    console.error('Error:', error);
    pool.end();
    process.exit(1);
  }
}

updateAwardsWithPrizeType();
