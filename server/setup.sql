-- Create users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL
);

-- Create book_details table
CREATE TABLE book_details (
    id SERIAL PRIMARY KEY,
    book_name VARCHAR(255),
    author VARCHAR(255),
    prize VARCHAR(255)
);
