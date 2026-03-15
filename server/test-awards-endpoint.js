const http = require('http');

http.get('http://localhost:5000/api/awards', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const awards = JSON.parse(data);
    console.log('Total awards:', awards.length);
    console.log('\nFirst 5 awards:');
    awards.slice(0, 5).forEach(a => console.log(`  - ${a.prize_name} (ID: ${a.award_id})`));
    
    console.log('\nAwards with books:');
    const awardIds = awards.map(a => a.award_id);
    console.log(awardIds.join(', '));
  });
}).on('error', err => console.error('Error:', err.message));
