const http = require('http');

// Test award 37 (National Book Award)
http.get('http://localhost:5000/api/awards/37', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const books = JSON.parse(data);
    console.log('Award 37 (National Book Award) has', books.length, 'books');
    if (books.length > 0) {
      console.log('\nFirst 3 books:');
      books.slice(0, 3).forEach(b => {
        console.log(`  - "${b.title}" by ${b.authors}`);
      });
    }
  });
}).on('error', err => console.error('Error:', err.message));
