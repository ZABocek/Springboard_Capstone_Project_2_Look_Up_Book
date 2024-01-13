// server.js

const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const cors = require('cors');

const app = express();
const { Pool } = require('pg');
app.use(cors());
app.use(bodyParser.json());

// PostgreSQL connection setup will go here

app.listen(3001, () => {
    console.log('Server is running on port 3001');
});

// Inside server.js

const pool = new Pool({
    user: 'your_username',
    host: 'localhost',
    database: 'your_database_name',
    password: 'your_password',
    port: 5432,
});

// You can use pool to query your database
