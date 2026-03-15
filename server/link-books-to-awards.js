const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'look_up_book_db',
  password: 'postgres'
});

async function linkBooksToAwards() {
  try {
    console.log('Starting book-to-award linking process...\n');

    // Read the winners data file
    const winnersFile = path.join(__dirname, '../data/data-fd3921e84d182dea82a7615f0a9dccbaaab6dedd/major_literary_prizes/major_literary_prizes-winners_judges.tsv');
    const winnersData = fs.readFileSync(winnersFile, 'utf8').split('\n').slice(1);

    console.log(`Loaded ${winnersData.length} winner records\n`);

    // Parse the TSV data
    const winners = [];
    const awardMap = {}; // Map prize_name to award id
    let skipped = 0;

    for (const line of winnersData) {
      if (!line.trim()) continue;

      const parts = line.split('\t');
      if (parts.length < 22) continue;

      const title = parts[21]?.trim();
      const prizeName = parts[16]?.trim();
      const prizeYear = parts[17]?.trim();
      const role = parts[14]?.trim();

      // Only process winners (not judges), and only if we have a title
      if (role === 'winner' && title && prizeName) {
        winners.push({
          title: title.toLowerCase().replace(/\s+/g, ' ').trim(),
          prizeName: prizeName,
          prizeYear: parseInt(prizeYear) || null
        });
      } else {
        skipped++;
      }
    }

    console.log(`Parsed ${winners.length} valid winner records (${skipped} skipped)\n`);

    // Get all awards from database
    const awardsResult = await pool.query('SELECT id, prize_name FROM awards ORDER BY id');
    const awards = awardsResult.rows;

    console.log(`Found ${awards.length} awards in database\n`);

    // Build map of prize_name to award id
    awards.forEach(award => {
      awardMap[award.prize_name.toLowerCase()] = award.id;
    });

    console.log('Prize name mapping:');
    Object.entries(awardMap).forEach(([name, id]) => {
      console.log(`  "${name}" -> award_id ${id}`);
    });
    console.log('');

    // Now match books to winners and update award_id
    let matched = 0;
    let unmatched = 0;

    // Get all HathiTrust books
    const booksResult = await pool.query(
      'SELECT id, title, prize_year FROM books WHERE title IS NOT NULL ORDER BY id'
    );
    const books = booksResult.rows;

    console.log(`Found ${books.length} books with titles\n`);
    console.log('Matching books to awards...\n');

    // Create a mapping of title -> award info
    const titleToAwardMap = {};
    winners.forEach(winner => {
      titleToAwardMap[winner.title] = titleToAwardMap[winner.title] || [];
      titleToAwardMap[winner.title].push({
        prizeName: winner.prizeName,
        prizeYear: winner.prizeYear
      });
    });

    // Try to match books
    for (const book of books) {
      const bookTitle = book.title.toLowerCase().replace(/\s+/g, ' ').trim();
      const bookYear = book.prize_year ? parseInt(book.prize_year) : null;

      if (titleToAwardMap[bookTitle]) {
        // Found matching title(s)
        const awardInfos = titleToAwardMap[bookTitle];
        
        // Try to match by year if available, otherwise use first match
        let awardInfo = awardInfos[0];
        if (bookYear) {
          const yearMatch = awardInfos.find(info => info.prizeYear === bookYear);
          if (yearMatch) {
            awardInfo = yearMatch;
          }
        }

        const awardId = awardMap[awardInfo.prizeName.toLowerCase()];
        if (awardId) {
          await pool.query(
            'UPDATE books SET award_id = $1 WHERE id = $2',
            [awardId, book.id]
          );
          matched++;
          
          if (matched <= 10) {
            console.log(`  ✓ Matched: "${book.title}" -> ${awardInfo.prizeName} (year: ${awardInfo.prizeYear})`);
          }
        } else {
          unmatched++;
        }
      } else {
        unmatched++;
      }
    }

    if (matched > 10) {
      console.log(`  ... and ${matched - 10} more matches\n`);
    }

    console.log(`\nMatching complete!`);
    console.log(`Matched: ${matched} books`);
    console.log(`Unmatched: ${unmatched} books\n`);

    // Verify the results
    const verifyResult = await pool.query(`
      SELECT 
        COUNT(*) as total_books,
        COUNT(DISTINCT award_id) as distinct_awards,
        SUM(CASE WHEN award_id IS NOT NULL THEN 1 ELSE 0 END) as books_with_awards,
        SUM(CASE WHEN award_id IS NULL THEN 1 ELSE 0 END) as books_without_awards
      FROM books
    `);

    const stats = verifyResult.rows[0];
    console.log('Database statistics:');
    console.log(`  Total books: ${stats.total_books}`);
    console.log(`  Distinct awards: ${stats.distinct_awards}`);
    console.log(`  Books with awards: ${stats.books_with_awards}`);
    console.log(`  Books without awards: ${stats.books_without_awards}\n`);

    // Show sample of updated awards
    const sampleResult = await pool.query(`
      SELECT b.award_id, COUNT(*) as cnt, a.prize_name
      FROM books b
      LEFT JOIN awards a ON b.award_id = a.id
      WHERE b.award_id IS NOT NULL
      GROUP BY b.award_id, a.prize_name
      ORDER BY cnt DESC
      LIMIT 10
    `);

    console.log('Top 10 awards by book count:');
    sampleResult.rows.forEach(row => {
      console.log(`  award_id ${row.award_id}: ${row.cnt} books - ${row.prize_name}`);
    });

    pool.end();
    console.log('\nDone!');
  } catch (error) {
    console.error('Error:', error);
    pool.end();
    process.exit(1);
  }
}

linkBooksToAwards();
