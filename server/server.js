require("dotenv").config({ path: ".env" }); // Adjust the path to the .env file if needed
const express = require("express");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { Pool } = require("pg");
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
app.post("/signup", async (req, res) => {
  const { username, password, email } = req.body;
  if (!username || !password || !email) {
    return res.status(400).json("Incorrect form submission");
  }
  const saltRounds = 10;
  try {
    const hash = await bcrypt.hash(password, saltRounds);
    const client = await pool.connect();
    // When inserting the user, you're already returning the user data
    const user = await client.query(
      "INSERT INTO users (username, email, hash) VALUES ($1, $2, $3) RETURNING *",
      [username, email, hash]
    );
    const token = jwt.sign({ id: user.rows[0].id }, jwtSecret, {
      expiresIn: "2h",
    });
    // Include userId in the response
    res.json({ token, userId: user.rows[0].id }); // Modified line
    client.release();
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ message: "Error registering new user", error: err.message });
  }
});
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json("Incorrect form submission");
  }
  try {
    const client = await pool.connect();
    const user = await client.query("SELECT * FROM users WHERE username = $1", [username]);
    if (user.rows.length) {
      const isValid = await bcrypt.compare(password, user.rows[0].hash);
      if (isValid) {
        const token = jwt.sign({ id: user.rows[0].id }, jwtSecret, {
          expiresIn: "2h",
        });
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
app.get("/api/tableName", async (req, res) => {
  try {
    const client = await pool.connect();
    // SQL query to get 10 random books where role is 'winner' and title_of_winning_book is not null
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
app.get("/api/authors", async (req, res) => {
  try {
    const client = await pool.connect();
    const queryText =
      "SELECT DISTINCT author_id, last_name, given_name FROM tableName WHERE author_id IS NOT NULL ORDER BY last_name, given_name;";
    const result = await client.query(queryText);
    res.json(result.rows);
    client.release();
  } catch (error) {
    console.error("Error fetching authors:", error);
    res.status(500).send("Error fetching authors");
  }
});
app.get("/api/books/:authorId", async (req, res) => {
  const { authorId } = req.params;
  try {
    const client = await pool.connect();
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
// Add this endpoint to server.js
app.get("/api/awards", async (req, res) => {
  try {
    const client = await pool.connect();
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
app.get("/api/awards/:awardId", async (req, res) => {
  const { awardId } = req.params;
  try {
    const client = await pool.connect();
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
  console.log("Received like/dislike request:", { userId, bookId, liked }); // Add this line

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
    res.json({ message: "Success", likes, dislikes });
    client.release();
  } catch (error) {
    console.error("Error processing like/dislike", error);
    res.status(500).send("Error processing like/dislike");
  }
});

app.get("/api/user/preference/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const client = await pool.connect();
    // Include username in the SELECT query
    const result = await client.query("SELECT username, reading_preference, favorite_genre FROM users WHERE id = $1", [userId]);
    client.release();
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    console.error("Error fetching user preferences:", error);
    res.status(500).send("Error fetching user preferences");
  }
});

app.post("/api/user/preference/update", async (req, res) => {
  const { userId, readingPreference, favoriteGenre } = req.body;
  try {
    const client = await pool.connect();
    await client.query("UPDATE users SET reading_preference = $1, favorite_genre = $2 WHERE id = $3", [readingPreference, favoriteGenre, userId]);
    client.release();
    res.json({ message: "User preferences updated successfully" });
  } catch (error) {
    console.error("Error updating user preferences:", error);
    res.status(500).send("Error updating user preferences");
  }
});

app.get("/api/books-for-profile", async (req, res) => {
  try {
    const client = await pool.connect();
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

app.get("/api/user/:userId/preferred-books", async (req, res) => {
  const { userId } = req.params;
  try {
    const client = await pool.connect();
    const queryText = `
      SELECT u.book_id, t.title_of_winning_book, t.full_name, t.prize_name, t.prize_year
      FROM user_preferred_books u
      JOIN tablename t ON u.book_id = t.book_id
      WHERE u.user_id = $1
      ORDER BY t.prize_year, t.full_name, t.title_of_winning_book;
    `;
    const result = await client.query(queryText, [userId]);
    client.release();
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching user's preferred books:", error);
    res.status(500).send("Error fetching user's preferred books");
  }
});

app.post("/api/user/add-book", async (req, res) => {
  const { userId, bookId } = req.body;
  try {
    const client = await pool.connect();
    const queryText = "INSERT INTO user_preferred_books (user_id, book_id) VALUES ($1, $2)";
    await client.query(queryText, [userId, bookId]);
    client.release();
    res.json({ message: "Book added to user's profile successfully" });
  } catch (error) {
    console.error("Error adding book to profile:", error);
    res.status(500).send("Error adding book to profile");
  }
});

app.listen(5000, () => {
  console.log("Server is running on port 5000");
});