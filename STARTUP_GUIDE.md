# Unified Startup Guide

## Overview

The Look Up Book application now supports starting both the server and client with a **single command**. This uses the `concurrently` npm package to run both processes in parallel.

## Quick Start Options

### Option 1: Using npm from the Root Directory (Recommended)

From the project root directory (`c:\Users\zaboc\Springboard_Capstone_Project_2_Look_Up_Book-main\Springboard_Capstone_Project_2_Look_Up_Book-main`):

```bash
npm start
```

This will:
- Start the backend server on `http://localhost:5000`
- Start the frontend client on `http://localhost:3000`
- Both processes will run in the same terminal window with colored output
- Press `Ctrl+C` to stop both processes simultaneously

### Option 2: Using the PowerShell Startup Script

```powershell
.\startup.ps1
```

Or:

```powershell
.\start-dev.ps1
```

Both scripts will:
- Kill any existing Node.js processes to avoid port conflicts
- Verify Node.js and npm are installed
- Start both server and client using `npm start`

### Option 3: Individual Commands

If you need to start components separately:

```bash
# From root directory - start only the server
npm run server

# From root directory - start only the client  
npm run client

# Or navigate to subdirectories
cd server && npm start
cd client && npm start
```

## How It Works

The root `package.json` now contains:

```json
{
  "scripts": {
    "start": "concurrently \"npm run start:server\" \"npm run start:client\"",
    "start:server": "cd server && npm start",
    "start:client": "cd client && npm start",
    "server": "cd server && npm start",
    "client": "cd client && npm start",
    "install:all": "npm install && cd server && npm install && cd ../client && npm install"
  },
  "devDependencies": {
    "concurrently": "^8.2.2"
  }
}
```

The `concurrently` package allows multiple npm scripts to run simultaneously with proper terminal management.

## Installation

The `concurrently` package has already been installed. If you need to reinstall it:

```bash
npm install --save-dev concurrently
```

Or install all dependencies for all packages:

```bash
npm run install:all
```

## What Gets Started

When you run `npm start` from the root:

1. **Backend Server** (Port 5000)
   - Express.js server
   - PostgreSQL database connection
   - API endpoints (login, signup, books, awards, etc.)
   - Location: `/server`

2. **Frontend Client** (Port 3000)
   - React development server
   - Live reload on file changes
   - Access the app at `http://localhost:3000`
   - Location: `/client`

## Environment Variables

Make sure your `.env` file is configured in the `/server` directory:
- `DB_HOST=localhost`
- `DB_USER=postgres`
- `DB_PASSWORD=postgres`
- `DB_NAME=look_up_book_db`
- `DB_PORT=5432`
- `JWT_SECRET=your_super_secret_jwt_key_change_this_in_production`
- `PORT=5000`

## Troubleshooting

### Port Already in Use

If you get an error about port 5000 or 3000 being in use:

1. Kill all Node processes:
   ```powershell
   Get-Process node | Stop-Process -Force
   ```

2. Alternatively, use the PowerShell script which automatically kills existing processes:
   ```powershell
   .\startup.ps1
   ```

### concurrently not found

If you get a "command not found" error for concurrently:

```bash
npm install --save-dev concurrently
```

### Database Connection Failed

Ensure PostgreSQL is running:

```powershell
# Check if PostgreSQL service is running
Get-Service postgresql-x64-17 | Format-Table

# Start PostgreSQL if not running
Start-Service postgresql-x64-17
```

## Project Structure

```
Look_Up_Book/
├── package.json                    ← Root config (start scripts)
├── startup.ps1                     ← PowerShell startup script
├── start-dev.ps1                   ← Alternative startup script
├── server/
│   ├── package.json
│   ├── server.js
│   └── ... (backend files)
├── client/
│   ├── package.json
│   ├── src/
│   └── ... (frontend files)
└── ... (other files)
```

## Summary

**Before**: Had to open two separate terminals and run:
- Terminal 1: `cd server && npm start`
- Terminal 2: `cd client && npm start`

**Now**: Just run from the root:
- `npm start`

Or execute the startup script:
- `.\startup.ps1`
