const http = require('http');

console.log('Testing Award #1 (Academy of American Poets Fellowship)...\n');

http.get('http://localhost:5000/api/awards/1', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const books = JSON.parse(data);
    
    console.log(`✓ Total unique books: ${books.length}\n`);
    console.log('First 5 books:\n');
    
    books.slice(0, 5).forEach((b, i) => {
      const prizeAmount = b.prize_amount ? `$${b.prize_amount.toLocaleString()}` : 'N/A';
      const displayTitle = b.title_of_winning_book || b.title || 'Unknown Title';
      console.log(`${i + 1}. "${displayTitle}" (${b.prize_year ?? 'N/A'})`);
      console.log(`   Prize Amount: ${prizeAmount}`);
      console.log('');
    });
    
    // Check for duplicates
    const titles = books.map(b => `${b.title_of_winning_book || b.title || ''}|${b.prize_year ?? ''}`);
    const uniqueTitles = new Set(titles);
    
    if (uniqueTitles.size === books.length) {
      console.log('✓ No duplicate entries found!');
    } else {
      console.log(`⚠ WARNING: Found ${books.length - uniqueTitles.size} duplicates`);
    }
  });
}).on('error', err => console.error('Error:', err.message));
