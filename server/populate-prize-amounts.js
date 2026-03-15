const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'look_up_book_db',
  password: 'postgres'
});

async function populatePrizeAmounts() {
  try {
    console.log('Populating prize_amount column from source data...\n');

    // Read the winners data file
    const winnersFile = path.join(__dirname, '../data/data-fd3921e84d182dea82a7615f0a9dccbaaab6dedd/major_literary_prizes/major_literary_prizes-winners_judges.tsv');
    const winnersData = fs.readFileSync(winnersFile, 'utf8').split('\n').slice(1);

    // Parse the TSV data to get prize_name -> prize_amount mapping
    const prizeAmountMap = {}; // { "Prize Name": amount }

    for (const line of winnersData) {
      if (!line.trim()) continue;

      const parts = line.split('\t');
      if (parts.length < 22) continue;

      const prizeName = parts[16]?.trim();
      const prizeAmount = parts[20]?.trim(); // Column 20 is prize_amount (0-indexed)

      if (prizeName && prizeAmount && !prizeAmountMap[prizeName]) {
        const numAmount = parseFloat(prizeAmount);
        if (!isNaN(numAmount)) {
          prizeAmountMap[prizeName] = numAmount;
        }
      }
    }

    console.log('Prize amount mapping found:');
    Object.entries(prizeAmountMap).slice(0, 5).forEach(([name, amount]) => {
      console.log(`  "${name}" -> $${amount.toLocaleString()}`);
    });
    console.log(`  ... and ${Object.keys(prizeAmountMap).length - 5} more\n`);

    // Update the awards table
    let updated = 0;
    let withAmount = 0;
    let withoutAmount = 0;

    for (const [prizeName, prizeAmount] of Object.entries(prizeAmountMap)) {
      const result = await pool.query(
        'UPDATE awards SET prize_amount = $1 WHERE prize_name = $2',
        [prizeAmount, prizeName]
      );
      updated += result.rowCount;
      if (prizeAmount > 0) withAmount++;
      else withoutAmount++;
    }

    console.log(`Updated ${updated} award records`);
    console.log(`  - Awards with amounts: ${withAmount}`);
    console.log(`  - Awards without amounts: ${withoutAmount}\n`);

    // Verify the update
    const verifyResult = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN prize_amount > 0 THEN 1 END) as with_amount,
        COUNT(CASE WHEN prize_amount IS NULL THEN 1 END) as null_amount
      FROM awards
    `);

    const stats = verifyResult.rows[0];
    console.log('Awards table after update:');
    console.log(`  Total awards: ${stats.total}`);
    console.log(`  Awards with amounts: ${stats.with_amount}`);
    console.log(`  Awards with NULL amount: ${stats.null_amount}\n`);

    // Show some sample awards
    const sampleResult = await pool.query(`
      SELECT prize_name, prize_amount 
      FROM awards 
      WHERE prize_amount > 0 
      ORDER BY prize_amount DESC 
      LIMIT 5
    `);

    console.log('Top 5 awards by amount:');
    sampleResult.rows.forEach(row => {
      console.log(`  "${row.prize_name}": $${row.prize_amount.toLocaleString()}`);
    });

    pool.end();
    console.log('\nDone!');
  } catch (error) {
    console.error('Error:', error);
    pool.end();
    process.exit(1);
  }
}

populatePrizeAmounts();
