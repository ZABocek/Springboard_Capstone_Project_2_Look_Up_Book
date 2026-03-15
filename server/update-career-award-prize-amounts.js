const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const { Pool } = require('pg');

const TSV_PATH = path.join(
  __dirname,
  '..',
  'data',
  'data-fd3921e84d182dea82a7615f0a9dccbaaab6dedd',
  'major_literary_prizes',
  'major_literary_prizes-winners_judges.tsv'
);

function normalizePrizeName(value) {
  return (value || '').trim().replace(/\s+/g, ' ');
}

function parseCareerAwardAmounts(tsvText) {
  const lines = tsvText.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) {
    return new Map();
  }

  const headers = lines[0].split('\t');
  const headerIndex = new Map(headers.map((name, idx) => [name, idx]));

  const required = ['prize_name', 'prize_type', 'prize_amount'];
  for (const key of required) {
    if (!headerIndex.has(key)) {
      throw new Error(`Missing required TSV column: ${key}`);
    }
  }

  const amountOptionsByPrize = new Map();

  for (let i = 1; i < lines.length; i += 1) {
    const cols = lines[i].split('\t');
    const prizeType = (cols[headerIndex.get('prize_type')] || '').trim().toLowerCase();
    if (prizeType !== 'career') {
      continue;
    }

    const prizeName = normalizePrizeName(cols[headerIndex.get('prize_name')]);
    const rawAmount = (cols[headerIndex.get('prize_amount')] || '').trim();
    const amount = Number.parseFloat(rawAmount);

    if (!prizeName || Number.isNaN(amount)) {
      continue;
    }

    if (!amountOptionsByPrize.has(prizeName)) {
      amountOptionsByPrize.set(prizeName, []);
    }

    amountOptionsByPrize.get(prizeName).push(amount);
  }

  const canonicalMap = new Map();

  for (const [prizeName, amounts] of amountOptionsByPrize.entries()) {
    const freq = new Map();
    for (const amount of amounts) {
      freq.set(amount, (freq.get(amount) || 0) + 1);
    }

    let selectedAmount = null;
    let selectedCount = -1;

    for (const [amount, count] of freq.entries()) {
      if (count > selectedCount) {
        selectedAmount = amount;
        selectedCount = count;
      } else if (count === selectedCount && amount > selectedAmount) {
        selectedAmount = amount;
      }
    }

    canonicalMap.set(prizeName, selectedAmount);
  }

  return canonicalMap;
}

async function main() {
  const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
  });

  const client = await pool.connect();

  try {
    const tsvText = fs.readFileSync(TSV_PATH, 'utf8');
    const canonicalMap = parseCareerAwardAmounts(tsvText);

    if (canonicalMap.size === 0) {
      throw new Error('No career-award prize amounts found in source TSV.');
    }

    console.log(`Loaded ${canonicalMap.size} canonical prize amounts for career awards.`);

    const beforeAwards = await client.query(`
      SELECT
        COUNT(*)::int AS total_career_awards,
        COUNT(*) FILTER (WHERE prize_amount IS NULL)::int AS missing_career_award_amounts
      FROM awards
      WHERE COALESCE(prize_type, '') = 'career';
    `);

    const beforeAuthorAwards = await client.query(`
      SELECT
        COUNT(*)::int AS total_author_awards,
        COUNT(*) FILTER (WHERE aa.prize_amount IS NULL)::int AS missing_author_award_amounts
      FROM author_awards aa
      JOIN awards aw ON aw.id = aa.award_id
      WHERE COALESCE(aw.prize_type, '') = 'career';
    `);

    await client.query('BEGIN');

    let updatedAwardRows = 0;

    for (const [prizeName, amount] of canonicalMap.entries()) {
      const updateResult = await client.query(
        `
          UPDATE awards
          SET prize_amount = $1
          WHERE prize_name = $2
            AND COALESCE(prize_type, '') = 'career';
        `,
        [amount, prizeName]
      );
      updatedAwardRows += updateResult.rowCount;
    }

    await client.query(`
      ALTER TABLE author_awards
      ADD COLUMN IF NOT EXISTS prize_amount numeric;
    `);

    const updatedAuthorRows = await client.query(`
      UPDATE author_awards aa
      SET prize_amount = aw.prize_amount
      FROM awards aw
      WHERE aa.award_id = aw.id
        AND COALESCE(aw.prize_type, '') = 'career'
        AND aw.prize_amount IS NOT NULL;
    `);

    await client.query('COMMIT');

    const afterAwards = await client.query(`
      SELECT
        COUNT(*)::int AS total_career_awards,
        COUNT(*) FILTER (WHERE prize_amount IS NULL)::int AS missing_career_award_amounts
      FROM awards
      WHERE COALESCE(prize_type, '') = 'career';
    `);

    const afterAuthorAwards = await client.query(`
      SELECT
        COUNT(*)::int AS total_author_awards,
        COUNT(*) FILTER (WHERE aa.prize_amount IS NULL)::int AS missing_author_award_amounts
      FROM author_awards aa
      JOIN awards aw ON aw.id = aa.award_id
      WHERE COALESCE(aw.prize_type, '') = 'career';
    `);

    console.log(`Career awards total: ${beforeAwards.rows[0].total_career_awards}`);
    console.log(`Missing career award amounts before: ${beforeAwards.rows[0].missing_career_award_amounts}`);
    console.log(`Career award rows updated: ${updatedAwardRows}`);
    console.log(`Missing career award amounts after: ${afterAwards.rows[0].missing_career_award_amounts}`);

    console.log(`Author-award rows total (career): ${beforeAuthorAwards.rows[0].total_author_awards}`);
    console.log(`Missing author-award amounts before: ${beforeAuthorAwards.rows[0].missing_author_award_amounts}`);
    console.log(`Author-award rows updated from awards: ${updatedAuthorRows.rowCount}`);
    console.log(`Missing author-award amounts after: ${afterAuthorAwards.rows[0].missing_author_award_amounts}`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Failed to backfill career-award prize amounts:', error.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

main();
