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

function normalizeTitle(value) {
  return (value || '')
    .trim()
    .toLowerCase()
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\s+/g, ' ');
}

function normalizeGenre(rawGenre) {
  const value = (rawGenre || '').trim().toLowerCase();
  if (value === 'prose') return 'Prose';
  if (value === 'poetry') return 'Poetry';
  return null;
}

function parsePrizeRows(tsvText) {
  const lines = tsvText.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) {
    return [];
  }

  const headers = lines[0].split('\t');
  const headerIndex = new Map(headers.map((name, index) => [name, index]));

  const requiredHeaders = ['prize_type', 'title_of_winning_book', 'prize_year', 'prize_genre'];
  for (const header of requiredHeaders) {
    if (!headerIndex.has(header)) {
      throw new Error(`Missing required column in TSV: ${header}`);
    }
  }

  const unique = new Map();

  for (let i = 1; i < lines.length; i += 1) {
    const cols = lines[i].split('\t');
    const prizeType = (cols[headerIndex.get('prize_type')] || '').trim().toLowerCase();
    if (prizeType !== 'book') {
      continue;
    }

    const title = normalizeTitle(cols[headerIndex.get('title_of_winning_book')] || '');
    const yearRaw = (cols[headerIndex.get('prize_year')] || '').trim();
    const year = Number(yearRaw);
    const genre = normalizeGenre(cols[headerIndex.get('prize_genre')] || '');

    if (!title || !Number.isInteger(year) || !genre) {
      continue;
    }

    const key = `${title}||${year}`;
    if (!unique.has(key)) {
      unique.set(key, {
        normalized_title: title,
        prize_year: year,
        genre,
      });
    }
  }

  return Array.from(unique.values());
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
    const prizeRows = parsePrizeRows(tsvText);

    if (prizeRows.length === 0) {
      throw new Error('No usable book-prize rows were parsed from the TSV source.');
    }

    console.log(`Parsed ${prizeRows.length} unique book award rows from TSV.`);

    await client.query('BEGIN');

    await client.query(`
      ALTER TABLE books
      ADD COLUMN IF NOT EXISTS genre VARCHAR(50);
    `);

    const beforeStats = await client.query(`
      SELECT COUNT(*)::int AS missing_genre_count
      FROM books b
      WHERE (
        b.award_id IS NOT NULL
        OR EXISTS (
          SELECT 1
          FROM book_awards ba
          JOIN awards aw ON aw.id = ba.award_id
          WHERE ba.book_id = b.id
            AND COALESCE(aw.prize_type, '') <> 'career'
        )
      )
      AND (b.genre IS NULL OR TRIM(b.genre) = '' OR LOWER(TRIM(b.genre)) = 'unknown');
    `);

    await client.query(`
      CREATE TEMP TABLE tmp_book_genres (
        normalized_title TEXT NOT NULL,
        prize_year INT NOT NULL,
        genre VARCHAR(50) NOT NULL
      ) ON COMMIT DROP;
    `);

    const insertSql = `
      INSERT INTO tmp_book_genres (normalized_title, prize_year, genre)
      VALUES ($1, $2, $3)
      ON CONFLICT DO NOTHING;
    `;

    for (const row of prizeRows) {
      await client.query(insertSql, [row.normalized_title, row.prize_year, row.genre]);
    }

    const updateResult = await client.query(`
      UPDATE books b
      SET genre = t.genre
      FROM tmp_book_genres t
      WHERE LOWER(TRIM(b.title)) = t.normalized_title
        AND COALESCE(b.prize_year, b.publication_year) = t.prize_year
        AND (
          b.genre IS NULL
          OR TRIM(b.genre) = ''
          OR LOWER(TRIM(b.genre)) = 'unknown'
          OR LOWER(TRIM(b.genre)) = 'no genre'
        );
    `);

    const afterStats = await client.query(`
      SELECT COUNT(*)::int AS missing_genre_count
      FROM books b
      WHERE (
        b.award_id IS NOT NULL
        OR EXISTS (
          SELECT 1
          FROM book_awards ba
          JOIN awards aw ON aw.id = ba.award_id
          WHERE ba.book_id = b.id
            AND COALESCE(aw.prize_type, '') <> 'career'
        )
      )
      AND (b.genre IS NULL OR TRIM(b.genre) = '' OR LOWER(TRIM(b.genre)) = 'unknown');
    `);

    await client.query('COMMIT');

    console.log(`Updated ${updateResult.rowCount} book rows with genre from prize data.`);
    console.log(`Missing genre before update: ${beforeStats.rows[0].missing_genre_count}`);
    console.log(`Missing genre after update: ${afterStats.rows[0].missing_genre_count}`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Failed to update book genres:', error.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

main();
