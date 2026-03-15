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

function parseBookAwardAmounts(tsvText) {
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
    if (prizeType !== 'book') {
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

  // Pick a stable canonical amount per prize name using frequency then highest amount.
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
    const canonicalMap = parseBookAwardAmounts(tsvText);

    if (canonicalMap.size === 0) {
      throw new Error('No book-award prize amounts found in source TSV.');
    }

    console.log(`Loaded ${canonicalMap.size} canonical prize amounts for book awards.`);

    const beforeResult = await client.query(`
      SELECT
        COUNT(*)::int AS total_book_awards,
        COUNT(*) FILTER (WHERE prize_amount IS NULL)::int AS missing_book_award_amounts
      FROM awards
      WHERE COALESCE(prize_type, '') = 'book';
    `);

    await client.query('BEGIN');

    let updatedRows = 0;

    for (const [prizeName, amount] of canonicalMap.entries()) {
      const updateResult = await client.query(
        `
          UPDATE awards
          SET prize_amount = $1
          WHERE prize_name = $2
            AND COALESCE(prize_type, '') = 'book';
        `,
        [amount, prizeName]
      );
      updatedRows += updateResult.rowCount;
    }

    await client.query('COMMIT');

    const afterResult = await client.query(`
      SELECT
        COUNT(*)::int AS total_book_awards,
        COUNT(*) FILTER (WHERE prize_amount IS NULL)::int AS missing_book_award_amounts
      FROM awards
      WHERE COALESCE(prize_type, '') = 'book';
    `);

    const unmatchedResult = await client.query(`
      SELECT prize_name
      FROM awards
      WHERE COALESCE(prize_type, '') = 'book'
        AND prize_amount IS NULL
      ORDER BY prize_name;
    `);

    const before = beforeResult.rows[0];
    const after = afterResult.rows[0];

    console.log(`Book awards total: ${before.total_book_awards}`);
    console.log(`Missing prize_amount before: ${before.missing_book_award_amounts}`);
    console.log(`Rows updated in awards table: ${updatedRows}`);
    console.log(`Missing prize_amount after: ${after.missing_book_award_amounts}`);

    if (unmatchedResult.rows.length > 0) {
      console.log('Book awards still missing prize_amount (first 25):');
      unmatchedResult.rows.slice(0, 25).forEach((row) => {
        console.log(`  - ${row.prize_name}`);
      });
    }
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Failed to backfill book-award prize amounts:', error.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

main();
