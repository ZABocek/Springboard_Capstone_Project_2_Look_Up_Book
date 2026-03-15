const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function populateAuthorNames() {
  try {
    console.log('Reading major_literary_prizes-winners_judges.tsv...');
    
    const tsvPath = path.join(__dirname, '../data/data-fd3921e84d182dea82a7615f0a9dccbaaab6dedd/major_literary_prizes/major_literary_prizes-winners_judges.tsv');
    const tsvContent = fs.readFileSync(tsvPath, 'utf-8');
    const lines = tsvContent.split('\n');
    
    // Parse header
    const headers = lines[0].split('\t');
    const personIdIdx = headers.indexOf('person_id');
    const fullNameIdx = headers.indexOf('full_name');
    const givenNameIdx = headers.indexOf('given_name');
    const lastNameIdx = headers.indexOf('last_name');
    const genderIdx = headers.indexOf('gender');
    
    console.log(`Indices: person_id=${personIdIdx}, full_name=${fullNameIdx}, given_name=${givenNameIdx}, last_name=${lastNameIdx}, gender=${genderIdx}`);
    
    // Extract unique people with their data
    const peopleMap = {};
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split('\t');
      if (parts.length < fullNameIdx + 1) continue;
      
      const personId = parseInt(parts[personIdIdx]);
      const fullName = parts[fullNameIdx]?.trim() || '';
      const givenName = parts[givenNameIdx]?.trim() || '';
      const lastName = parts[lastNameIdx]?.trim() || '';
      const gender = parts[genderIdx]?.trim() || '';
      
      if (personId && !isNaN(personId) && fullName && fullName !== 'No Winner') {
        if (!peopleMap[personId]) {
          peopleMap[personId] = {
            person_id: personId,
            full_name: fullName,
            given_name: givenName,
            family_name: lastName,
            gender: gender || null
          };
        }
      }
    }
    
    const uniquePeople = Object.values(peopleMap);
    console.log(`\nExtracted ${uniquePeople.length} unique people from TSV`);
    
    // Update database
    const client = await pool.connect();
    try {
      let updated = 0;
      let inserted = 0;
      
      for (const person of uniquePeople) {
        // Check if person_id exists in database
        const checkQuery = 'SELECT id FROM people WHERE person_id = $1';
        const checkResult = await client.query(checkQuery, [person.person_id]);
        
        if (checkResult.rows.length > 0) {
          // Update existing record
          const updateQuery = `
            UPDATE people 
            SET full_name = $1, given_name = $2, family_name = $3, gender = $4
            WHERE person_id = $5 AND (full_name IS NULL OR full_name = '')
          `;
          const res = await client.query(updateQuery, [
            person.full_name,
            person.given_name,
            person.family_name,
            person.gender,
            person.person_id
          ]);
          if (res.rowCount > 0) updated++;
        } else {
          // Insert new record
          const insertQuery = `
            INSERT INTO people (person_id, full_name, given_name, family_name, gender)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT DO NOTHING
          `;
          const res = await client.query(insertQuery, [
            person.person_id,
            person.full_name,
            person.given_name,
            person.family_name,
            person.gender
          ]);
          if (res.rowCount > 0) inserted++;
        }
      }
      
      console.log(`\nDatabase updates:`);
      console.log(`  - Updated existing records: ${updated}`);
      console.log(`  - Inserted new records: ${inserted}`);
      
      // Now verify career award authors
      console.log('\n=== CAREER AWARD WINNERS ===\n');
      const verifyQuery = `
        SELECT DISTINCT p.full_name, a.prize_name, COUNT(*) as award_count
        FROM books b
        JOIN awards a ON b.award_id = a.id
        LEFT JOIN people p ON b.person_id = p.person_id
        WHERE a.prize_type = 'career' AND b.role = 'winner' AND b.verified = true
        GROUP BY p.full_name, a.prize_name
        ORDER BY a.prize_name, p.full_name
      `;
      
      const verifyResult = await client.query(verifyQuery);
      console.log(`Found ${verifyResult.rows.length} career award winner entries:\n`);
      
      const byAward = {};
      verifyResult.rows.forEach(row => {
        if (!byAward[row.prize_name]) {
          byAward[row.prize_name] = [];
        }
        byAward[row.prize_name].push({
          name: row.full_name || 'UNKNOWN',
          count: row.award_count
        });
      });
      
      Object.keys(byAward).sort().forEach(award => {
        const winners = byAward[award];
        console.log(`${award}: ${winners.length} unique winners`);
        winners.forEach(w => {
          console.log(`  - ${w.name} (${w.count} record${w.count > 1 ? 's' : ''})`);
        });
        console.log();
      });
      
    } finally {
      client.release();
    }
    
    pool.end();
  } catch (error) {
    console.error('Error:', error);
    pool.end();
    process.exit(1);
  }
}

populateAuthorNames();
