const { Client } = require('pg');

const client = new Client({
  user: 'postgres',
  host: 'localhost',
  database: 'look_up_book_db',
  password: 'Kapital74!',
  port: 5432,
});

client.connect().then(() => {
  client.query('SELECT id, username, email FROM users ORDER BY id DESC LIMIT 10', (err, res) => {
    if (err) {
      console.error('ERROR:', err.message);
    } else {
      console.log('Users in database:');
      if (res.rows.length === 0) {
        console.log('  [EMPTY] No users found!');
      } else {
        res.rows.forEach(row => {
          console.log(`  ID: ${row.id} | Username: ${row.username} | Email: ${row.email}`);
        });
      }
    }
    client.end();
  });
}).catch(e => console.error('Connection failed:', e.message));
