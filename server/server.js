require("dotenv").config({ path: ".env" }); // Load environment variables from .env file
const express = require("express"); // Import the express library
const bodyParser = require("body-parser"); // Import the body-parser library for parsing request bodies
const { v4: uuidv4 } = require('uuid'); // Import UUID library to generate unique IDs
const bcrypt = require("bcrypt"); // Import bcrypt library for hashing passwords
const cors = require("cors"); // Import cors library for enabling Cross-Origin Resource Sharing
const jwt = require("jsonwebtoken"); // Import jsonwebtoken library for handling JWTs
const { Pool } = require("pg"); // Import Pool from the pg library for PostgreSQL connection
const app = express(); // Initialize the express application

app.use(cors()); // Enable CORS for all routes
app.use(bodyParser.json()); // Parse JSON request bodies

// PostgreSQL connection setup using environment variables
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// JWT secret key
const jwtSecret = process.env.JWT_SECRET;

// Endpoint for user signup
app.post("/signup", async (req, res) => {
  const { username, password, email } = req.body; // Extract username, password, and email from request body

  // Check if all required fields are provided
  if (!username || !password || !email) {
    return res.status(400).json("Incorrect form submission");
  }

  const saltRounds = 10; // Number of salt rounds for bcrypt
  try {
    const hash = await bcrypt.hash(password, saltRounds); // Hash the password
    const client = await pool.connect(); // Get a PostgreSQL client from the pool
    // Insert the user into the database and return the user data
    const user = await client.query(
      "INSERT INTO users (username, email, hash) VALUES ($1, $2, $3) RETURNING *",
      [username, email, hash]
    );
    // Generate a JWT for the new user
    const token = jwt.sign({ id: user.rows[0].id }, jwtSecret, {
      expiresIn: "2h",
    });
    res.json({ token, userId: user.rows[0].id }); // Respond with the token and userId
    client.release(); // Release the PostgreSQL client back to the pool
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error registering new user", error: err.message });
  }
});

// Endpoint for admin login
app.post("/admin/login", async (req, res) => {
  const { username, password } = req.body; // Extract username and password from request body

  try {
    const client = await pool.connect(); // Get a PostgreSQL client from the pool
    const admin = await client.query("SELECT * FROM admins WHERE username = $1", [username]); // Query for the admin
    if (admin.rows.length) {
      const isValid = await bcrypt.compare(password, admin.rows[0].password_hash); // Compare passwords
      if (isValid) {
        // Generate a JWT for the admin
        const token = jwt.sign({ id: admin.rows[0].id, isAdmin: true }, jwtSecret, {
          expiresIn: "2h",
        });
        res.json({ token, adminId: admin.rows[0].id }); // Respond with the token and adminId
      } else {
        res.status(400).json("Wrong credentials"); // Invalid password
      }
    } else {
      res.status(400).json("Admin not found"); // Admin not found
    }
    client.release(); // Release the PostgreSQL client back to the pool
  } catch (err) {
    console.error(err);
    res.status(500).json("Error logging in as admin");
  }
});

// Route to check if a user is an admin
app.get('/api/is-admin/:userId', async (req, res) => {
  const { userId } = req.params; // Extract userId from route parameters
  try {
    const client = await pool.connect(); // Get a PostgreSQL client from the pool
    const result = await client.query("SELECT * FROM admins WHERE id = $1", [userId]); // Query for the admin by userId
    client.release(); // Release the PostgreSQL client back to the pool

    if (result.rows.length > 0) {
      res.json({ isAdmin: true, username: result.rows[0].username }); // User is an admin
    } else {
      res.status(403).json({ isAdmin: false, message: "Access forbidden" }); // User is not an admin
    }
  } catch (error) {
    console.error("Error checking admin status:", error);
    res.status(500).send("Error checking admin status");
  }
});

// Endpoint to fetch unverified books
app.get('/api/unverified-books', async (req, res) => {
  try {
    const client = await pool.connect(); // Get a PostgreSQL client from the pool
    const queryText = `
      SELECT book_id AS "bookId", 
             title_of_winning_book AS "titleOfWinningBook", 
             full_name AS "fullName"
      FROM tableName
      WHERE verified = false
      AND role = 'winner'
      AND prize_type = 'book';
    `;
    const result = await client.query(queryText); // Execute the query
    client.release(); // Release the PostgreSQL client back to the pool
    res.json(result.rows); // Respond with the results
  } catch (error) {
    console.error('Error fetching unverified books:', error);
    res.status(500).send('Error fetching unverified books');
  }
});

// Endpoint to update book verification status
app.patch('/api/books/:bookId/verification', async (req, res) => {
  const { bookId } = req.params; // Extract bookId from route parameters
  const { verified } = req.body; // Extract verified status from request body

  try {
    const client = await pool.connect(); // Get a PostgreSQL client from the pool
    const queryText = 'UPDATE tablename SET verified = $1 WHERE book_id = $2';
    await client.query(queryText, [verified, bookId]); // Execute the update query
    client.release(); // Release the PostgreSQL client back to the pool
    res.json({ message: 'Book verification status updated successfully' });
  } catch (error) {
    console.error('Error updating book verification status:', error);
    res.status(500).send('Error updating book verification status');
  }
});

// Endpoint to submit a new book for verification
app.post('/api/submit-book', async (req, res) => {
  // Extract book details from the request body including the newly added awardId
  const {
    fullName, givenName, lastName, gender, eliteInstitution, graduateDegree, mfaDegree,
    prizeYear, prizeGenre, titleOfWinningBook, awardId // Ensure this is passed as an integer from the client
  } = req.body;

  // Generate UUIDs for the respective IDs
  const personId = uuidv4();
  const authorId = uuidv4();
  const bookId = uuidv4();

  try {
    const client = await pool.connect(); // Get a PostgreSQL client from the pool
    // Insert the new book suggestion into 'tablename', with 'verified' initially set to false
    const queryText = `
      INSERT INTO tablename (person_id, full_name, given_name, last_name, gender, elite_institution, 
                             graduate_degree, mfa_degree, prize_year, prize_genre, 
                             title_of_winning_book, verified, role, prize_type, author_id, book_id, award_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, false, 'winner', 'book', $12, $13, $14)
      RETURNING *;`;
    // Ensure awardId is correctly handled as an integer
    const result = await client.query(queryText, [personId, fullName, givenName, lastName, gender, eliteInstitution,
                                                  graduateDegree, mfaDegree, prizeYear, prizeGenre, 
                                                  titleOfWinningBook, authorId, bookId, parseInt(awardId)]);
    client.release(); // Release the PostgreSQL client back to the pool
    res.json(result.rows[0]);
  } catch ( error ) {
    console.error('Error submitting new book for verification:', error);
    res.status(500).send('Error submitting new book for verification');
  }
});

// Endpoint for user login
app.post("/login", async (req, res) => {
  const { username, password } = req.body; // Extract username and password from request body
  if (!username || !password) {
    return res.status(400).json("Incorrect form submission");
  }
  try {
    const client = await pool.connect(); // Get a PostgreSQL client from the pool
    const user = await client.query("SELECT * FROM users WHERE username = $1", [username]); // Query for the user
    if (user.rows.length) {
      const isValid = await bcrypt.compare(password, user.rows[0].hash); // Compare passwords
      if (isValid) {
        // Generate a JWT for the user
        const token = jwt.sign({ id: user.rows[0].id }, jwtSecret, {
          expiresIn: "2h",
        });
        res.json({ token, userId: user.rows[0].id }); // Respond with the token and userId
      } else {
        res.status(400).json("Wrong credentials"); // Invalid password
      }
    } else {
      res.status(400).json("User not found"); // User not found
    }
    client.release(); // Release the PostgreSQL client back to the pool
  } catch (err) {
    console.error(err);
    res.status(500).json("Error logging in");
  }
});

// Endpoint to fetch 10 random books
app.get("/api/tableName", async (req, res) => {
  try {
    const client = await pool.connect(); // Get a PostgreSQL client from the pool
    const queryText = `
    SELECT tableName.book_id, title_of_winning_book, prize_genre, prize_year, verified, person_id,
           COALESCE(like_count, 0) AS like_count,
           COALESCE(dislike_count, 0) AS dislike_count
    FROM tableName
    LEFT JOIN (
        SELECT book_id, COUNT(*) FILTER (WHERE liked = true) AS like_count,
               COUNT(*) FILTER (WHERE liked = false) AS dislike_count
        FROM user_book_likes
        GROUP BY book_id
    ) likes ON tableName.book_id = likes.book_id
    WHERE role = 'winner' AND title_of_winning_book IS NOT NULL
    ORDER BY RANDOM()
    LIMIT 10;
    `;
    const result = await client.query(queryText); // Execute the query
    res.json(result.rows); // Respond with the results
    client.release(); // Release the PostgreSQL client back to the pool
  } catch (error) {
    console.error("Error fetching books from database:", error);
    res.status(500).send("Error fetching books");
  }
});

// Endpoint to fetch authors
app.get("/api/authors", async (req, res) => {
  try {
    const client = await pool.connect(); // Get a PostgreSQL client from the pool
    const queryText = "SELECT DISTINCT author_id, last_name, given_name FROM tableName WHERE author_id IS NOT NULL ORDER BY last_name, given_name;";
    const result = await client.query(queryText); // Execute the query
    res.json(result.rows); // Respond with the results
    client.release(); // Release the PostgreSQL client back to the pool
  } catch (error) {
    console.error("Error fetching authors:", error);
    res.status(500).send("Error fetching authors");
  }
});

// Endpoint to fetch books by author ID
app.get("/api/books/:authorId", async (req, res) => {
  const { authorId } = req.params; // Extract authorId from route parameters
  try {
    const client = await pool.connect(); // Get a PostgreSQL client from the pool
    const queryText = `
      SELECT book_id, title_of_winning_book, prize_genre, prize_year, verified, author_id
      FROM tableName
      WHERE author_id = $1
      ORDER BY book_id;
    `;
    const result = await client.query(queryText, [authorId]); // Execute the query
    res.json(result.rows); // Respond with the results
    client.release(); // Release the PostgreSQL client back to the pool
  } catch (error) {
    console.error(`Error fetching books for author ${authorId}:`, error);
    res.status(500).send("Error fetching books");
  }
});

// Endpoint to fetch distinct awards
app.get("/api/awards", async (req, res) => {
  try {
    const client = await pool.connect(); // Get a PostgreSQL client from the pool
    const queryText = `
      SELECT DISTINCT award_id, prize_name
      FROM tableName
      WHERE role = 'winner' AND prize_type = 'book' AND title_of_winning_book IS NOT NULL AND title_of_winning_book != ''
      ORDER BY award_id;
    `;
    const result = await client.query(queryText); // Execute the query
    res.json(result.rows); // Respond with the results
    client.release(); // Release the PostgreSQL client back to the pool
  } catch (error) {
    console.error("Error fetching awards:", error);
    res.status(500).send("Error fetching awards");
  }
});

// Endpoint to fetch books by award ID
app.get("/api/awards/:awardId", async (req, res) => {
  const { awardId } = req.params; // Extract awardId from route parameters
  try {
    const client = await pool.connect(); // Get a PostgreSQL client from the pool
    const queryText = `
      SELECT * FROM tableName
      WHERE award_id = $1 AND role = 'winner' AND prize_type = 'book' AND title_of_winning_book IS NOT NULL AND title_of_winning_book != ''
      ORDER BY prize_year;
    `;
    const result = await client.query(queryText, [awardId]); // Execute the query
    res.json(result.rows); // Respond with the results
    client.release(); // Release the PostgreSQL client back to the pool
  } catch (error) {
    console.error(`Error fetching books for award ${awardId}:`, error);
    res.status(500).send("Error fetching books");
  }
});

// Endpoint to handle likes and dislikes
app.post("/api/like", async (req, res) => {
  const { userId, bookId, liked } = req.body; // Extract userId, bookId, and liked status from request body

  try {
    const client = await pool.connect(); // Get a PostgreSQL client from the pool
    // Upsert logic: Update if exists, else insert
    const upsertQuery = `
      INSERT INTO user_book_likes (user_id, book_id, liked, likedOn)
      VALUES ($1, $2, $3, NOW())
      ON CONFLICT (user_id, book_id)
      DO UPDATE SET liked = EXCLUDED.liked, likedOn = NOW();
    `;
    await client.query(upsertQuery, [userId, bookId, liked]); // Execute the upsert query
    // Fetch updated like/dislike counts
    const countsQuery = `
      SELECT
        SUM(CASE WHEN liked THEN 1 ELSE 0 END) AS likes,
        SUM(CASE WHEN NOT liked THEN 1 ELSE 0 END) AS dislikes
      FROM user_book_likes
      WHERE book_id = $1
      GROUP BY book_id;
    `;
    const countsResult = await client.query(countsQuery, [bookId]); // Execute the counts query
    const { likes, dislikes } = countsResult.rows.length > 0 ? countsResult.rows[0] : { likes: 0, dislikes: 0 };
    res.json({ message: "Success", likes, dislikes }); // Respond with the updated counts
    client.release(); // Release the PostgreSQL client back to the pool
  } catch (error) {
    console.error("Error processing like/dislike", error);
    res.status(500).send("Error processing like/dislike");
  }
});

// Endpoint to fetch user preferences
app.get("/api/user/preference/:userId", async (req, res) => {
  const { userId } = req.params; // Extract userId from route parameters
  try {
    const client = await pool.connect(); // Get a PostgreSQL client from the pool
    const result = await client.query("SELECT username, reading_preference, favorite_genre FROM users WHERE id = $1", [userId]); // Query for user preferences
    client.release(); // Release the PostgreSQL client back to the pool
    if (result.rows.length > 0) {
      res.json(result.rows[0]); // Respond with user preferences
    } else {
      res.status(404).json({ message: "User not found" }); // User not found
    }
  } catch (error) {
    console.error("Error fetching user preferences:", error);
    res.status(500).send("Error fetching user preferences");
  }
});

// Endpoint to update user preferences
app.post("/api/user/preference/update", async (req, res) => {
  const { userId, readingPreference, favoriteGenre } = req.body; // Extract userId, readingPreference, and favoriteGenre from request body
  try {
    const client = await pool.connect(); // Get a PostgreSQL client from the pool
    await client.query("UPDATE users SET reading_preference = $1, favorite_genre = $2 WHERE id = $3", [readingPreference, favoriteGenre, userId]); // Execute the update query
    client.release(); // Release the PostgreSQL client back to the pool
    res.json({ message: "User preferences updated successfully" }); // Respond with success message
  } catch (error) {
    console.error("Error updating user preferences:", error);
    res.status(500).send("Error updating user preferences");
  }
});

// Endpoint to fetch books for user profile
app.get("/api/books-for-profile", async (req, res) => {
  try {
    const client = await pool.connect(); // Get a PostgreSQL client from the pool
    const queryText = `
      SELECT DISTINCT ON (title_of_winning_book) book_id, title_of_winning_book, full_name
      FROM tablename
      WHERE role = 'winner' AND prize_type = 'book' AND title_of_winning_book IS NOT NULL
      ORDER BY title_of_winning_book, full_name;
    `;
    const result = await client.query(queryText); // Execute the query
    res.json(result.rows); // Respond with the results
    client.release(); // Release the PostgreSQL client back to the pool
  } catch (error) {
    console.error("Error fetching books for profile:", error);
    res.status(500).send("Error fetching books");
  }
});

// Endpoint to fetch preferred books for a user
app.get("/api/user/:userId/preferred-books", async (req, res) => {
  const { userId } = req.params; // Extract userId from route parameters
  try {
    const client = await pool.connect(); // Get a PostgreSQL client from the pool
    const queryText = `
      SELECT u.book_id, t.title_of_winning_book, t.full_name, t.prize_name, t.prize_year
      FROM user_preferred_books u
      JOIN tablename t ON u.book_id = t.book_id
      WHERE u.user_id = $1
      ORDER BY t.prize_year, t.full_name, t.title_of_winning_book;
    `;
    const result = await client.query(queryText, [userId]); // Execute the query
    res.json(result.rows); // Respond with the results
    client.release(); // Release the PostgreSQL client back to the pool
  } catch (error) {
    console.error("Error fetching user's preferred books:", error);
    res.status(500).send("Error fetching user's preferred books");
  }
});

// Endpoint to add a book to user's preferred list
app.post("/api/user/add-book", async (req, res) => {
  const { userId, bookId } = req.body; // Extract userId and bookId from request body
  try {
    const client = await pool.connect(); // Get a PostgreSQL client from the pool
    const queryText = "INSERT INTO user_preferred_books (user_id, book_id) VALUES ($1, $2)"; // SQL query to insert the preferred book
    await client.query(queryText, [userId, bookId]); // Execute the insert query
    client.release(); // Release the PostgreSQL client back to the pool
    res.json({ message: "Book added to user's profile successfully" }); // Respond with success message
  } catch (error) {
    console.error("Error adding book to profile:", error);
    res.status(500).send("Error adding book to profile");
  }
});

// Endpoint to remove a book from user's preferred list
app.post("/api/user/remove-book", async (req, res) => {
  const { userId, bookId } = req.body; // Extract userId and bookId from request body

  try {
    const client = await pool.connect(); // Get a PostgreSQL client from the pool
    const queryText = "DELETE FROM user_preferred_books WHERE user_id = $1 AND book_id = $2"; // SQL query to delete the preferred book
    await client.query(queryText, [userId, bookId]); // Execute the delete query
    client.release(); // Release the PostgreSQL client back to the pool
    res.json({ message: "Book removed from profile successfully" }); // Respond with success message
  } catch (error) {
    console.error("Error removing book from profile:", error);
    res.status(500).send("Error removing book from profile");
  }
});

// Start the server and listen on port 5000
app.listen(5000, () => {
  console.log("Server is running on port 5000");
});
