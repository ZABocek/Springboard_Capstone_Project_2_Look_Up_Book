const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'look_up_book_db',
  password: 'postgres',
});

async function loadCareerAwards() {
  try {
    const tsvPath = path.join(
      'c:\\Users\\zaboc\\Springboard_Capstone_Project_2_Look_Up_Book-main',
      'Springboard_Capstone_Project_2_Look_Up_Book-main\\data',
      'data-fd3921e84d182dea82a7615f0a9dccbaaab6dedd\\major_literary_prizes',
      'major_literary_prizes-winners_judges.tsv'
    );

    const fileContent = fs.readFileSync(tsvPath, 'utf-8');
    const lines = fileContent.split('\n');
    const headers = lines[0].split('\t');

    // Map headers to indices
    const indices = {
      person_id: headers.indexOf('person_id'),
      full_name: headers.indexOf('full_name'),
      given_name: headers.indexOf('given_name'),
      last_name: headers.indexOf('last_name'),
      role: headers.indexOf('role'),
      prize_name: headers.indexOf('prize_name'),
      prize_year: headers.indexOf('prize_year'),
      prize_type: headers.indexOf('prize_type'),
      prize_amount: headers.indexOf('prize_amount'),
      title_of_winning_book: headers.indexOf('title_of_winning_book'),
    };

    console.log('Processing career award data from TSV...\n');

    let processedCount = 0;
    let insertedCount = 0;
    let skippedCount = 0;
    const awardMap = {};

    // First pass: collect all career awards and their data
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;

      const cols = lines[i].split('\t');
      if (cols.length <= indices.prize_type) continue;

      const prizeType = cols[indices.prize_type]?.trim();
      if (prizeType !== 'career') continue;

      const prizeYear = cols[indices.prize_year]?.trim();
      const personId = cols[indices.person_id]?.trim();
      const fullName = cols[indices.full_name]?.trim();
      const giveName = cols[indices.given_name]?.trim();
      const familyName = cols[indices.last_name]?.trim();
      const role = cols[indices.role]?.trim();
      const prizeName = cols[indices.prize_name]?.trim();
      const prizeAmount = cols[indices.prize_amount]?.trim();

      // Only process winners
      if (role !== 'winner' || !prizeName || !personId || !prizeYear) {
        skippedCount++;
        continue;
      }

      processedCount++;

      // Get award ID by prize name
      const awardResult = await pool.query(
        'SELECT id FROM awards WHERE prize_name = $1 AND prize_type = $2',
        [prizeName, 'career']
      );

      if (!awardResult.rows.length) {
        console.log(`⚠️  Award not found: ${prizeName}`);
        continue;
      }

      const awardId = awardResult.rows[0].id;

      // Ensure person exists in people table
      const personResult = await pool.query(
        'SELECT id FROM people WHERE person_id = $1',
        [personId]
      );

      let personDbId;
      if (personResult.rows.length) {
        personDbId = personResult.rows[0].id;
      } else {
        // Insert new person
        const insertPersonResult = await pool.query(
          `INSERT INTO people (person_id, full_name, given_name, family_name)
           VALUES ($1, $2, $3, $4)
           RETURNING id`,
          [personId, fullName, giveName, familyName]
        );
        personDbId = insertPersonResult.rows[0].id;
      }

      // Insert book record for career award winner
      const insertBookResult = await pool.query(
        `INSERT INTO books (
          award_id, 
          person_id, 
          title,
          prize_year,
          verified,
          role
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id`,
        [awardId, personDbId, fullName, parseInt(prizeYear), true, 'winner']
      ).catch(err => {
        console.error(`Error inserting book for person ${fullName} (${personId}) in award ${prizeName}:`, err.message);
        return { rows: [] };
      });

      if (insertBookResult.rows.length) {
        insertedCount++;
      }

      if (processedCount % 500 === 0) {
        console.log(`Progress: ${processedCount} processed, ${insertedCount} inserted...`);
      }
    }

    console.log('\n=== CAREER AWARD LOAD COMPLETE ===');
    console.log(`Total entries processed: ${processedCount}`);
    console.log(`Records inserted: ${insertedCount}`);
    console.log(`Records skipped: ${skippedCount}`);

    // Verify the results
    const verifyResult = await pool.query(`
      SELECT 
        a.prize_name,
        a.prize_type,
        COUNT(DISTINCT b.id) as winner_count,
        COUNT(DISTINCT b.prize_year) as years
      FROM awards a
      LEFT JOIN books b ON b.award_id = a.id AND b.role = 'winner'
      WHERE a.prize_type = 'career'
      GROUP BY a.prize_name, a.prize_type
      HAVING COUNT(DISTINCT b.id) > 0
      ORDER BY winner_count DESC
    `);

    console.log('\n=== CAREER AWARDS WITH DATA ===\n');
    verifyResult.rows.forEach((r) => {
      console.log(`${r.prize_name}: ${r.winner_count} winners across ${r.years} years`);
    });

    pool.end();
  } catch (error) {
    console.error('Error:', error.message);
    pool.end();
    process.exit(1);
  }
}

loadCareerAwards();
