const fs = require('fs');
const readline = require('readline');
const pg = require('pg');

const pool = new pg.Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'look_up_book_db',
  password: 'postgres'
});

const TSV_PATH = 'c:\\Users\\zaboc\\Springboard_Capstone_Project_2_Look_Up_Book-main\\Springboard_Capstone_Project_2_Look_Up_Book-main\\data\\data-fd3921e84d182dea82a7615f0a9dccbaaab6dedd\\major_literary_prizes\\major_literary_prizes-winners_judges.tsv';

async function loadAllCareerAwards() {
  console.log('Starting comprehensive career award load...\n');
  
  const fileStream = fs.createReadStream(TSV_PATH, 'utf8');
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let headerMap = {};
  let lineNumber = 0;
  let processedCount = 0;
  let insertedCount = 0;
  let skipCount = 0;
  const errorLog = [];

  try {
    for await (const line of rl) {
      lineNumber++;
      
      if (lineNumber === 1) {
        // Parse header
        const headers = line.split('\t');
        headers.forEach((h, i) => headerMap[h.trim()] = i);
        console.log(`Header parsed. Columns: ${Object.keys(headerMap).length}`);
        continue;
      }

      if (lineNumber % 500 === 0) {
        console.log(`Processing line ${lineNumber}...`);
      }

      const fields = line.split('\t');
      
      try {
        // Extract fields
        const personId = fields[headerMap['person_id']]?.trim();
        const fullName = fields[headerMap['full_name']]?.trim();
        const givenName = fields[headerMap['given_name']]?.trim();
        const lastName = fields[headerMap['last_name']]?.trim();
        const role = fields[headerMap['role']]?.trim();
        const prizeName = fields[headerMap['prize_name']]?.trim();
        const prizeYear = fields[headerMap['prize_year']]?.trim();
        const prizeType = fields[headerMap['prize_type']]?.trim();
        const prizeAmount = fields[headerMap['prize_amount']]?.trim();

        // Only process career awards that are winners and have names
        if (prizeType === 'career' && role === 'winner' && fullName && fullName !== 'No Winner') {
          processedCount++;

          // Get the award ID
          const awardRes = await pool.query(
            'SELECT id FROM awards WHERE prize_name = $1 AND prize_type = $2',
            [prizeName, 'career']
          );

          if (awardRes.rows.length === 0) {
            skipCount++;
            errorLog.push(`Award not found: ${prizeName}`);
            continue;
          }

          const awardId = awardRes.rows[0].id;

          // Get or create person
          let personRes = await pool.query(
            'SELECT person_id FROM people WHERE full_name = $1',
            [fullName]
          );

          let finalPersonId;
          if (personRes.rows.length > 0) {
            finalPersonId = personRes.rows[0].person_id;
          } else {
            // Create new person
            const insertRes = await pool.query(
              'INSERT INTO people (full_name, given_name, family_name) VALUES ($1, $2, $3) RETURNING person_id',
              [fullName, givenName || '', lastName || '']
            );
            finalPersonId = insertRes.rows[0].person_id;
          }

          // Insert or skip if duplicate
          const year = parseInt(prizeYear) || 0;
          const amount = parseFloat(prizeAmount) || 0;

          try {
            await pool.query(
              `INSERT INTO books (award_id, person_id, title, prize_year, prize_amount, verified, role)
               VALUES ($1, $2, $3, $4, $5, true, $6)
               ON CONFLICT (award_id, person_id, prize_year) DO NOTHING`,
              [awardId, finalPersonId, fullName, year, amount, 'winner']
            );
            insertedCount++;
          } catch (err) {
            skipCount++;
          }
        }
      } catch (err) {
        errorLog.push(`Line ${lineNumber}: ${err.message}`);
      }
    }

    console.log('\n=== LOAD COMPLETE ===\n');
    console.log(`Lines processed: ${lineNumber}`);
    console.log(`Career award entries found: ${processedCount}`);
    console.log(`Records inserted: ${insertedCount}`);
    console.log(`Records skipped: ${skipCount}`);
    
    if (errorLog.length > 0 && errorLog.length <= 10) {
      console.log('\nErrors/Warnings:');
      errorLog.forEach(e => console.log(`  - ${e}`));
    } else if (errorLog.length > 10) {
      console.log(`\nWarnings: ${errorLog.length} total`);
    }

    // Show awards with new winners
    console.log('\n=== AWARDS WITH NEW WINNERS ===\n');
    const awardsRes = await pool.query(`
      SELECT 
        a.id, 
        a.prize_name,
        COUNT(DISTINCT b.book_id) as winner_count
      FROM awards a
      LEFT JOIN books b ON a.id = b.award_id AND b.verified = true
      WHERE a.prize_type = 'career'
      GROUP BY a.id, a.prize_name
      ORDER BY winner_count DESC, a.prize_name
    `);

    awardsRes.rows.forEach(r => {
      const id = r.id.toString().padStart(3);
      const count = r.winner_count.toString().padStart(3);
      console.log(`ID ${id}: ${count} winners - ${r.prize_name}`);
    });

    pool.end();
  } catch (err) {
    console.error('Fatal error:', err);
    pool.end();
    process.exit(1);
  }
}

loadAllCareerAwards();
