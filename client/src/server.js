// server.js

const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

const app = express();

app.use(cors());
app.use(bodyParser.json());

// PostgreSQL connection setup
const pool = new Pool({
    user: 'your_database_user',
    host: 'localhost',
    database: 'your_database_name',
    password: 'your_database_password',
    port: 5432,
});

// JWT secret key
const jwtSecret = 'your_jwt_secret_key';

app.post('/signup', async (req, res) => {
    const { username, password, email } = req.body;

    if (!username || !password || !email) {
        return res.status(400).json('Incorrect form submission');
    }

    const saltRounds = 10;
    const hash = await bcrypt.hash(password, saltRounds);

    try {
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

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
