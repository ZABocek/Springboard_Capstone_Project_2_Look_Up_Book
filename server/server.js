// Load environment variables from the .env file
require("dotenv").config({ path: ".env" });

// Import necessary libraries
const express = require("express");
const bodyParser = require("body-parser");
const { v4: uuidv4 } = require('uuid');
const bcrypt = require("bcrypt");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { Pool } = require("pg");

// Initialize the express application
const app = express();

// Enable CORS for all routes
app.use(cors());
// Parse JSON request bodies
app.use(bodyParser.json());

// Set up PostgreSQL connection using environment variables
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// JWT secret key from environment variables
const jwtSecret = process.env.JWT_SECRET;

// Function to generate unique IDs using a sequence in the database
const generateUniqueId = async () => {
  const client = await pool.connect();
  try {
    const result = await client.query("SELECT nextval('unique_id_seq') AS id");
    return result.rows[0].id;
  } finally {
    client.release();
  }
};

// Endpoint for user signup
app.post("/signup", async (req, res) => {
  const { username, password, email } = req.body;

  // Check if all required fields are provided
  if (!username || !password || !email) {
    return res.status(400).json("Incorrect form submission");
  }

  const saltRounds = 10; // Number of salt rounds for bcrypt
  try {
    // Hash the password
    const hash = await bcrypt.hash(password, saltRounds);
    const client = await pool.connect();

    // Insert the user into the database and return the user data
    const user = await client.query(
      "INSERT INTO users (username, email, hash) VALUES ($1, $2, $3) RETURNING *",
      [username, email, hash]
    );

    // Generate a JWT for the new user
    const token = jwt.sign({ id: user.rows[0].id }, jwtSecret, {
      expiresIn: "2h",
    });

    // Respond with the token and userId
    res.json({ token, userId: user.rows[0].id });
    client.release();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error registering new user", error: err.message });
  }
});

// Endpoint for admin login
app.post("/admin/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const client = await pool.connect();

    // Query for the admin
    const admin = await client.query("SELECT * FROM admins WHERE username = $1", [username]);
    if (admin.rows.length) {
      // Compare passwords
      const isValid = await bcrypt.compare(password, admin.rows[0].password_hash);
      if (isValid) {
        // Generate a JWT for the admin
        const token = jwt.sign({ id: admin.rows[0].id, isAdmin: true }, jwtSecret, {
          expiresIn: "2h",
        });

        // Respond with the token and adminId
        res.json({ token, adminId: admin.rows[0].id });
      } else {
        res.status(400).json("Wrong credentials");
      }
    } else {
      res.status(400).json("Admin not found");
    }
    client.release();
  } catch (err) {
    console.error(err);
    res.status(500).json("Error logging in as admin");
  }
});

// Route to check if a user is an admin
app.get('/api/is-admin/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const client = await pool.connect();

    // Query for the admin by userId
    const result = await client.query("SELECT * FROM admins WHERE id = $1", [userId]);
    client.release();

    if (result.rows.length > 0) {
      // User is an admin
      res.json({ isAdmin: true, username: result.rows[0].username });
    } else {
      // User is not an admin
      res.status(403).json({ isAdmin: false, message: "Access forbidden" });
    }
  } catch (error) {
    console.error("Error checking admin status:", error);
    res.status(500).send("Error checking admin status");
  }
});

// Endpoint to fetch unverified books
app.get('/api/unverified-books', async (req, res) => {
  try {
    const client = await pool.connect();

    // Query to fetch unverified books
    const queryText = `
      SELECT book_id AS "bookId", 
             title_of_winning_book AS "titleOfWinningBook", 
             full_name AS "fullName"
      FROM tablename
      WHERE verified = false
      AND role = 'winner'
      AND prize_type = 'book';
    `;
    const result = await client.query(queryText);
    client.release();

    // Respond with the results
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching unverified books:', error);
    res.status(500).send('Error fetching unverified books');
  }
});

// Endpoint to update book verification status
app.patch('/api/books/:bookId/verification', async (req, res) => {
  const { bookId } = req.params;
  const { verified } = req.body;

  try {
    const client = await pool.connect();

    // Query to update the verification status of the book
    const queryText = 'UPDATE tablename SET verified = $1 WHERE book_id = $2';
    await client.query(queryText, [verified, bookId]);
    client.release();

    // Respond with success message
    res.json({ message: 'Book verification status updated successfully' });
  } catch (error) {
    console.error('Error updating book verification status:', error);
    res.status(500).send('Error updating book verification status');
  }
});

// Endpoint to submit a new book for verification
app.post('/api/submit-book', async (req, res) => {
  const {
    fullName, givenName, lastName, gender, eliteInstitution, graduateDegree, mfaDegree,
    prizeYear, prizeGenre, titleOfWinningBook, awardId
  } = req.body;

  try {
    // Generate unique IDs for person, author, and book
    const personId = await generateUniqueId();
    const authorId = await generateUniqueId();
    const bookId = await generateUniqueId();
    const verified = false; // New books start as unverified

    const client = await pool.connect();

    // Insert the new book suggestion into 'tablename'
    const queryText = `
      INSERT INTO tablename (person_id, full_name, given_name, last_name, gender, elite_institution, 
                             graduate_degree, mfa_degree, prize_year, prize_genre, 
                             title_of_winning_book, verified, role, prize_type, author_id, book_id, award_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'winner', 'book', $13, $14, $15)
      RETURNING *;
    `;
    const result = await client.query(queryText, [
      personId, fullName, givenName, lastName, gender, eliteInstitution,
      graduateDegree, mfaDegree, prizeYear, prizeGenre,
      titleOfWinningBook, verified, authorId, bookId, awardId
    ]);
    client.release();

    // Respond with the newly inserted book data
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error submitting new book for verification:', error);
    res.status(500).send('Error submitting new book for verification');
  }
});

// Endpoint for user login
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  // Check if all required fields are provided
  if (!username || !password) {
    return res.status(400).json("Incorrect form submission");
  }
  try {
    const client = await pool.connect();

    // Query for the user
    const user = await client.query("SELECT * FROM users WHERE username = $1", [username]);
    if (user.rows.length) {
      // Compare passwords
      const isValid = await bcrypt.compare(password, user.rows[0].hash);
      if (isValid) {
        // Generate a JWT for the user
        const token = jwt.sign({ id: user.rows[0].id }, jwtSecret, {
          expiresIn: "2h",
        });

        // Respond with the token and userId
        res.json({ token, userId: user.rows[0].id });
      } else {
        res.status(400).json("Wrong credentials");
      }
    } else {
      res.status(400).json("User not found");
    }
    client.release();
  } catch (err) {
    console.error(err);
    res.status(500).json("Error logging in");
  }
});

// Endpoint to fetch 10 random books
app.get("/api/tableName", async (req, res) => {
  try {
    const client = await pool.connect();

    // Query to fetch 10 random books
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
    const result = await client.query(queryText);
    res.json(result.rows);
    client.release();
  } catch (error) {
    console.error("Error fetching books from database:", error);
    res.status(500).send("Error fetching books");
  }
});

// Endpoint to fetch authors
app.get("/api/authors", async (req, res) => {
  try {
    const client = await pool.connect();

    // Query to fetch authors
    const queryText = "SELECT DISTINCT author_id, last_name, given_name FROM tableName WHERE author_id IS NOT NULL ORDER BY last_name, given_name;";
    const result = await client.query(queryText);
    res.json(result.rows);
    client.release();
  } catch (error) {
    console.error("Error fetching authors:", error);
    res.status(500).send("Error fetching authors");
  }
});

// Endpoint to fetch books by author ID
app.get("/api/books/:authorId", async (req, res) => {
  const { authorId } = req.params;
  try {
    const client = await pool.connect();

    // Query to fetch books by author ID
    const queryText = `
      SELECT book_id, title_of_winning_book, prize_genre, prize_year, verified, author_id
      FROM tableName
      WHERE author_id = $1
      ORDER BY book_id;
    `;
    const result = await client.query(queryText, [authorId]);
    res.json(result.rows);
    client.release();
  } catch (error) {
    console.error(`Error fetching books for author ${authorId}:`, error);
    res.status(500).send("Error fetching books");
  }
});

// Endpoint to fetch distinct awards
app.get("/api/awards", async (req, res) => {
  try {
    const client = await pool.connect();

    // Query to fetch distinct awards
    const queryText = `
      SELECT DISTINCT award_id, prize_name
      FROM tableName
      WHERE role = 'winner' AND prize_type = 'book' AND title_of_winning_book IS NOT NULL AND title_of_winning_book != ''
      ORDER BY award_id;
    `;
    const result = await client.query(queryText);
    res.json(result.rows);
    client.release();
  } catch (error) {
    console.error("Error fetching awards:", error);
    res.status(500).send("Error fetching awards");
  }
});

// Endpoint to fetch books by award ID
app.get("/api/awards/:awardId", async (req, res) => {
  const { awardId } = req.params;
  try {
    const client = await pool.connect();

    // Query to fetch books by award ID
    const queryText = `
      SELECT * FROM tableName
      WHERE award_id = $1 AND role = 'winner' AND prize_type = 'book' AND title_of_winning_book IS NOT NULL AND title_of_winning_book != ''
      ORDER BY prize_year;
    `;
    const result = await client.query(queryText, [awardId]);
    res.json(result.rows);
    client.release();
  } catch (error) {
    console.error(`Error fetching books for award ${awardId}:`, error);
    res.status(500).send("Error fetching books");
  }
});

// Endpoint to handle likes and dislikes
app.post("/api/like", async (req, res) => {
  const { userId, bookId, liked } = req.body;

  try {
    const client = await pool.connect();

    // Upsert logic: Update if exists, else insert
    const upsertQuery = `
      INSERT INTO user_book_likes (user_id, book_id, liked, likedOn)
      VALUES ($1, $2, $3, NOW())
      ON CONFLICT (user_id, book_id)
      DO UPDATE SET liked = EXCLUDED.liked, likedOn = NOW();
    `;
    await client.query(upsertQuery, [userId, bookId, liked]);

    // Fetch updated like/dislike counts
    const countsQuery = `
      SELECT
        SUM(CASE WHEN liked THEN 1 ELSE 0 END) AS likes,
        SUM(CASE WHEN NOT liked THEN 1 ELSE 0 END) AS dislikes
      FROM user_book_likes
      WHERE book_id = $1
      GROUP BY book_id;
    `;
    const countsResult = await client.query(countsQuery, [bookId]);
    const { likes, dislikes } = countsResult.rows.length > 0 ? countsResult.rows[0] : { likes: 0, dislikes: 0 };

    // Respond with the updated counts
    res.json({ message: "Success", likes, dislikes });
    client.release();
  } catch (error) {
    console.error("Error processing like/dislike", error);
    res.status(500).send("Error processing like/dislike");
  }
});

// Endpoint to fetch user preferences
app.get("/api/user/preference/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const client = await pool.connect();

    // Query to fetch user preferences
    const result = await client.query("SELECT username, reading_preference, favorite_genre FROM users WHERE id = $1", [userId]);
    client.release();
    if (result.rows.length > 0) {
      // Respond with user preferences
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    console.error("Error fetching user preferences:", error);
    res.status(500).send("Error fetching user preferences");
  }
});

// Endpoint to update user preferences
app.post("/api/user/preference/update", async (req, res) => {
  const { userId, readingPreference, favoriteGenre } = req.body;
  try {
    const client = await pool.connect();

    // Update user preferences
    await client.query("UPDATE users SET reading_preference = $1, favorite_genre = $2 WHERE id = $3", [readingPreference, favoriteGenre, userId]);
    client.release();
    res.json({ message: "User preferences updated successfully" });
  } catch (error) {
    console.error("Error updating user preferences:", error);
    res.status(500).send("Error updating user preferences");
  }
});

// Endpoint to fetch books for user profile
app.get("/api/books-for-profile", async (req, res) => {
  try {
    const client = await pool.connect();

    // Query to fetch books for profile
    const queryText = `
      SELECT DISTINCT ON (title_of_winning_book) book_id, title_of_winning_book, full_name
      FROM tablename
      WHERE role = 'winner' AND prize_type = 'book' AND title_of_winning_book IS NOT NULL
      ORDER BY title_of_winning_book, full_name;
    `;
    const result = await client.query(queryText);
    res.json(result.rows);
    client.release();
  } catch (error) {
    console.error("Error fetching books for profile:", error);
    res.status(500).send("Error fetching books");
  }
});

// Endpoint to fetch preferred books for a user
app.get("/api/user/:userId/preferred-books", async (req, res) => {
  const { userId } = req.params;
  try {
    const client = await pool.connect();

    // Query to fetch preferred books for a user
    const queryText = `
      SELECT u.book_id, t.title_of_winning_book, t.full_name, t.prize_name, t.prize_year
      FROM user_preferred_books u
      JOIN tablename t ON u.book_id = t.book_id
      WHERE u.user_id = $1
      ORDER BY t.prize_year, t.full_name, t.title_of_winning_book;
    `;
    const result = await client.query(queryText, [userId]);
    res.json(result.rows);
    client.release();
  } catch (error) {
    console.error("Error fetching user's preferred books:", error);
    res.status(500).send("Error fetching user's preferred books");
  }
});

// Endpoint to add a book to user's preferred list
app.post("/api/user/add-book", async (req, res) => {
  const { userId, bookId } = req.body;
  try {
    const client = await pool.connect();

    // Insert the preferred book
    const queryText = "INSERT INTO user_preferred_books (user_id, book_id) VALUES ($1, $2)";
    await client.query(queryText, [userId, bookId]);
    client.release();
    res.json({ message: "Book added to user's profile successfully" });
  } catch (error) {
    console.error("Error adding book to profile:", error);
    res.status(500).send("Error adding book to profile");
  }
});

// Endpoint to remove a book from user's preferred list
app.post("/api/user/remove-book", async (req, res) => {
  const { userId, bookId } = req.body;

  try {
    const client = await pool.connect();

    // Delete the preferred book
    const queryText = "DELETE FROM user_preferred_books WHERE user_id = $1 AND book_id = $2";
    await client.query(queryText, [userId, bookId]);
    client.release();
    res.json({ message: "Book removed from profile successfully" });
  } catch (error) {
    console.error("Error removing book from profile:", error);
    res.status(500).send("Error removing book from profile");
  }
});

// Start the server and listen on port 5000
app.listen(5000, () => {
  console.log("Server is running on port 5000");
});
