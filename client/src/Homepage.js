import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate to navigate programmatically
import "./Homepage.css"; // Import CSS for styling
import likeIconURL from "./like_9790408.png"; // Import like icon
import dislikeIconURL from "./dislike_6933384.png"; // Import dislike icon

const Homepage = () => {
  // State to store the selected books
  const [selectedBooks, setSelectedBooks] = useState([]);
  const navigate = useNavigate(); // Initialize useNavigate for navigation

  // Fetch books when the component mounts
  useEffect(() => {
    async function fetchBooks() {
      try {
        // Fetch books from the server
        const response = await fetch("http://localhost:5000/api/tableName");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        let books = await response.json();
        // Transform each book to rename book_id to bookId
        books = books.map((book) => ({
          ...book,
          bookId: book.book_id,
        }));
        console.log(books); // Log the books for debugging
        setSelectedBooks(books); // Update state with fetched books
      } catch (error) {
        console.error("Error fetching books:", error); // Log any errors
      }
    }
    fetchBooks(); // Call the fetchBooks function
  }, []); // Empty dependency array means this runs once when the component mounts

  // Function to handle like or dislike action
  const handleLike = async (bookId, liked) => {
    if (bookId == null) {
      console.error("bookId is null, aborting the like/dislike action");
      return; // Abort if bookId is null
    }

    const userId = localStorage.getItem("userId"); // Get userId from localStorage
    console.log("Sending like/dislike action:", { userId, bookId, liked }); // Log the action

    try {
      // Send like or dislike action to the server
      const response = await fetch("http://localhost:5000/api/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, bookId, liked }),
      });

      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Received response for like/dislike action:", data); // Log the response

      // Update local state with new counts
      setSelectedBooks((currentBooks) =>
        currentBooks.map((book) =>
          book.bookId === bookId
            ? { ...book, like_count: data.likes, dislike_count: data.dislikes }
            : book
        )
      );
    } catch (error) {
      console.error("Error processing like/dislike:", error); // Log any errors
    }
  };

  // Function to handle logout
  const handleLogout = () => {
    localStorage.removeItem("token"); // Remove token from localStorage
    navigate("/login"); // Redirect to login page
  };

  return (
    <div className="homepage">
      <h1 className="welcome-message">Welcome to Look Up Book!</h1>
      <h2 className="recommendation-message">
        Here are 10 books recommended for you to enjoy from award-winning
        authors!
      </h2>
      <nav className="navbar">
        <ul>
          <li>
            <a href="/add-db-book">Add Book from Database to Profile</a>
          </li>
          <li>
            <a href="/add-new-book">
              Submit New Award-winning Book for Verification
            </a>
          </li>
          <li>
            <a href="/admin-verification">Verification of Books Submitted</a>
          </li>
          <li>
            <a href="/search-books">Search Books By Authors</a>
          </li>
          <li>
            <a href="/profile">Profile Page</a>
          </li>
          <li>
            <a href="/search-awards">Search Books by Awards</a>
          </li>
          <li>
            <a href="#" onClick={handleLogout}>
              Logout
            </a>
          </li>
        </ul>
      </nav>
      <div className="book-table">
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Like/Dislike</th>
              <th>Genre</th>
              <th>Year</th>
              <th>Verified</th>
              <th>Author ID</th>
            </tr>
          </thead>
          <tbody>
            {/* Render each book in the table */}
            {selectedBooks.map((book, index) => (
              <tr key={index}>
                <td>{book.title_of_winning_book}</td>
                <td>
                  <img
                    src={likeIconURL}
                    alt="Like"
                    onClick={() => handleLike(book.bookId, true)}
                    style={{ cursor: "pointer", marginRight: "10px", height: "50px" }}
                  />
                  {book.like_count} Likes / {book.dislike_count} Dislikes
                  <img
                    src={dislikeIconURL}
                    alt="Dislike"
                    onClick={() => handleLike(book.bookId, false)}
                    style={{ cursor: "pointer", height: "50px", marginLeft: "10px" }}
                  />
                </td>
                <td>{book.prize_genre}</td>
                <td>{book.prize_year}</td>
                <td>{book.verified ? "True" : "False"}</td>
                <td>{book.person_id}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Homepage;
