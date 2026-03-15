# 👋 START HERE - Look Up Book Setup

Welcome! This file tells you exactly what to do next.

---

## ⏱️ Time Required: 15 minutes

---

## 🎯 Your Mission (3 Simple Parts)

### Part 1: Prepare (2 min)
Open this file: `server/.env`

Find this line:
```
DB_PASSWORD=postgres
```

Change `postgres` to your actual PostgreSQL password (the one you set during installation).

**That's it for Part 1!**

---

### Part 2: Load Database (5-10 min)

Open Command Prompt or PowerShell and copy-paste this:

```bash
cd "C:\Users\zaboc\Springboard_Capstone_Project_2_Look_Up_Book-main\Springboard_Capstone_Project_2_Look_Up_Book-main\server"
psql -U postgres -d look_up_book_db -f consolidated_database.sql
```

**What it does:** Loads 81,725 books into your database

**Expected output:** Loading messages for several minutes, then success

**That's it for Part 2!**

---

### Part 3: Start Server (3 min)

Open Command Prompt and copy-paste this:

```bash
cd "C:\Users\zaboc\Springboard_Capstone_Project_2_Look_Up_Book-main\Springboard_Capstone_Project_2_Look_Up_Book-main\server"
npm install
npm start
```

**What it does:**
1. Installs necessary software
2. Starts your server

**Expected output:**
```
Server is running on port 5000
```

If you see this, you're done! ✅

**Keep this terminal running.**

---

## 🧪 Bonus: Test Everything (2 min)

Open a NEW Command Prompt (keep the other one running) and type:

```bash
python test_api_endpoints.py
```

**What it does:** Tests all 12 API endpoints automatically

**Expected output:** Green checkmarks ✅ for all tests

**Done!** Your app is working!

---

## ✅ Success = All 3 Parts Complete

| Part | Step | Status |
|------|------|--------|
| 1 | Update DB password in `.env` | Do this first |
| 2 | Load database with `.sql` file | ~5-10 min |
| 3 | Start server with `npm start` | See "Server running" message |
| 🎁 | Test with `python test_api_endpoints.py` | See green ✅ marks |

---

## 📚 If You Need Help

**During Part 1 (Update Password):**
→ Check `NEXT_STEPS.md` for details

**During Part 2 (Database Load):**
→ If psql not found: Check `SETUP_QUICK_START.md` → Troubleshooting
→ If connection fails: Check `COMPLETE_SETUP_GUIDE.md` → Database Setup

**During Part 3 (Start Server):**
→ If npm not found: Install Node.js from nodejs.org
→ If port in use: Check `SETUP_QUICK_START.md` → Troubleshooting
→ If database error: Go back to Part 2

**During Testing:**
→ If tests fail: Make sure server is running in another terminal
→ If server crashes: Check error messages in terminal

---

## 🆘 Common Issues

### "psql: command not found"
PostgreSQL bin folder not in PATH
→ Solution: Use full path to psql
```bash
"C:\Program Files\PostgreSQL\15\bin\psql" -U postgres -d look_up_book_db -f consolidated_database.sql
```

### "npm: command not found"
Node.js not installed
→ Solution: Download from nodejs.org and install

### "Port 5000 already in use"
Something else is using port 5000
→ Solution: Edit `.env` and change `PORT=5000` to `PORT=5001`

### "Cannot connect to database"
PostgreSQL not running
→ Solution: Start PostgreSQL service (search "Services" in Windows)

### Tests fail
Server not running or database not loaded
→ Solution: Make sure Part 2 and Part 3 completed successfully

---

## 📁 Quick File Reference

| File | Purpose | Location |
|------|---------|----------|
| `.env` | Your credentials | `server/.env` |
| Database | 81,725 books | `server/consolidated_database.sql` |
| Server | Fixed API endpoints | `server/server.js` |
| Tests | Verify everything works | `test_api_endpoints.py` |

---

## 🔒 Security Note

Your `.env` file is **protected from GitHub** ✅

- Contains passwords? ✅ Won't leak
- Credentials safe? ✅ Stays local
- Ready for production? ✅ Structure ready

---

## 🚀 Ready to Start?

**Do this now:**

1. Open `server/.env`
2. Change the password
3. Follow Parts 1-3 above
4. You're done!

---

## 📞 Need More Info?

| Question | File to Read |
|----------|--------------|
| "What do I do exactly?" | `NEXT_STEPS.md` |
| "How do I set everything up?" | `SETUP_QUICK_START.md` |
| "I need detailed help" | `COMPLETE_SETUP_GUIDE.md` |
| "What was done for me?" | `FINAL_CHECKLIST.md` |
| "Technical overview?" | `IMPLEMENTATION_COMPLETE.md` |

---

## ⏰ Timing

- Part 1 (Update password): **2 minutes**
- Part 2 (Load database): **5-10 minutes**
- Part 3 (Start server): **3 minutes**
- Bonus (Test): **2 minutes**

**Total: ~15 minutes to fully working app**

---

## 🎉 When You're Done

You'll have:
- ✅ Database with 81,725 books
- ✅ Running server on http://localhost:5000
- ✅ All 12 API endpoints working
- ✅ Verified with automated tests
- ✅ Secure credential storage
- ✅ Ready for development or deployment

---

**Let's go! Follow Parts 1-3 above.** 🚀

Any issues? Check the "Common Issues" section or read the documentation files listed above.

**Good luck!** 🍀
