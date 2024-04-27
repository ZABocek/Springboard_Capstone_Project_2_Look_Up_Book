
# Look Up Book

Look Up Book is a web application designed for exploring, verifying, and managing award-winning books. It enables users and administrators to interact with a book database through various functionalities such as adding books, verifying books for authenticity, searching books by author or award, and managing user profiles.

## Features

- User authentication and admin verification.
- CRUD operations on books and user preferences.
- Search functionalities for books by authors and awards.
- Profile management for storing user preferences and favorite books.

## Prerequisites

Before you begin, ensure you have met the following requirements:
- Node.js installed on your machine.
- PostgreSQL for the database.
- React for the client-side application.

## Installation

Clone the repository to your local machine:

```bash
git clone https://github.com/your-username/look-up-book.git
cd look-up-book
```

### Setting Up the Server

1. Navigate to the server directory:
   ```bash
   cd server
   ```
2. Install the necessary packages:
   ```bash
   npm install
   ```
3. Create a `.env` file in the server directory and add the following environment variables based on your PostgreSQL setup:
   ```
   DB_NAME=my_database
   DB_USER=postgres
   DB_PASSWORD=your_password
   DB_HOST=localhost
   DB_PORT=5432
   JWT_SECRET=your_jwt_secret
   ```
4. Start the server:
   ```bash
   npm start
   ```

### Setting Up the Client

1. Navigate to the client directory:
   ```bash
   cd ../client
   ```
2. Install the necessary packages:
   ```bash
   npm install
   ```
3. Start the React application:
   ```bash
   npm start
   ```

## Usage

After starting both the server and the client, the web application will be accessible at `http://localhost:3000`. Here are some common actions you can perform:

- **Login/Signup:** Access the application by registering as a new user or logging in with existing credentials.
- **Adding Books:** Users can submit new award-winning books for verification.
- **Searching Books:** Search for books by authors or awards.
- **Admin Functions:** Verify submitted books and manage application data.

## Contributing

Contributions are welcome! For major changes, please open an issue first to discuss what you would like to change.

## License

This project is licensed under the MIT License - see the LICENSE.md file for details.
