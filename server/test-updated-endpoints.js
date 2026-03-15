const http = require('http');

// Test the new /api/awards endpoint
http.get('http://localhost:5000/api/awards', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const awards = JSON.parse(data);
    console.log('\n✓ ALL AWARDS WITH PRIZE_TYPE INFO:\n');
    console.log(`Total awards: ${awards.length}\n`);
    
    // Count by type
    const bookCount = awards.filter(a => a.prize_type === 'book').length;
    const careerCount = awards.filter(a => a.prize_type === 'career').length;
    const nullCount = awards.filter(a => !a.prize_type).length;
    
    console.log(`Book Awards: ${bookCount}`);
    console.log(`Career Awards: ${careerCount}`);
    if (nullCount > 0) console.log(`NULL type: ${nullCount}`);
    
    console.log('\nSample awards with details:');
    awards.slice(0, 5).forEach(a => {
      console.log(`  - ID: ${a.award_id}, "${a.prize_name}" (${a.prize_type}), ${a.book_count} books`);
    });
    
    // Now test a specific award for verified books
    console.log('\n✓ TESTING AWARD 37 (National Book Award) - VERIFIED BOOKS ONLY:\n');
    http.get('http://localhost:5000/api/awards/37', (res2) => {
      let data2 = '';
      res2.on('data', chunk => data2 += chunk);
      res2.on('end', () => {
        const books = JSON.parse(data2);
        console.log(`Total verified books: ${books.length}`);
        if (books.length > 0) {
          console.log(`\nFirst 3 books:`);
          books.slice(0, 3).forEach((b, i) => {
            console.log(`  ${i+1}. "${b.title}" (${b.prize_year}, verified: ${b.verified})`);
          });
        }
      });
    });
  });
}).on('error', err => console.error('Error:', err.message));
