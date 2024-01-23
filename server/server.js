require('dotenv').config({ path: '../.env' }); // Adjust the path to the .env file if needed
const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const xlsx = require('xlsx');

const app = express();
app.use(cors());
app.use(bodyParser.json());
// PostgreSQL connection setup
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

// JWT secret key
const jwtSecret = process.env.JWT_SECRET;

app.post('/signup', async (req, res) => {
    const { username, password, email } = req.body;

    if (!username || !password || !email) {
        return res.status(400).json('Incorrect form submission');
    }

    const saltRounds = 10;
    try {
        const hash = await bcrypt.hash(password, saltRounds);
        const client = await pool.connect();
        const user = await client.query('INSERT INTO users (username, email, hash) VALUES ($1, $2, $3) RETURNING *', [username, email, hash]);

        const token = jwt.sign({ id: user.rows[0].id }, jwtSecret, { expiresIn: '2h' });

        res.json({ token });
        client.release();
    } catch (err) {
        console.error(err);
        res.status(500).send('Error registering new user');
    }
});

app.get('/api/books', async (req, res) => {
    try {
        // Read the Excel file
        const workbook = xlsx.readFile('../client/src/lit_prize_winners_and_judges_data.xlsx');
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = xlsx.utils.sheet_to_json(sheet);

        // Filter and map the data
        const filteredBooks = data.filter(book => book.title_of_winning_book && book.role === 'winner').map(book => ({
            title: book.title_of_winning_book,
            author: book.full_name,
            prize: book.prize_name
        }));

        // Shuffle and select 10 books
        const selectedBooks = filteredBooks.sort(() => 0.5 - Math.random()).slice(0, 10);

        res.json(selectedBooks);
    } catch (error) {
        console.error('Error fetching books:', error);
        res.status(500).send('Error fetching books');
    }
});

app.listen(5000, () => {
    console.log('Server is running on port 5000');
});