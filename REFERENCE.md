# 📌 SERVEASE - ONE PAGE REFERENCE

## 🔥 DO THIS FIRST (5 min)

```bash
# 1. Get new Supabase key
# → Go to: https://app.supabase.com → Settings → API
# → Click Generate New Service Role Key
# → Copy it

# 2. Update backend/.env
nano backend/.env
# Change: SUPABASE_SERVICE_ROLE_KEY=your_new_key

# 3. Save and test
cd backend && npm install && npm run start:dev
# Should show: "ServEase API Running Successfully"
```

---

## ▶️ THEN START BOTH SERVERS

```bash
# Terminal 1: Backend
cd backend
npm run start:dev
# Waits for requests

# Terminal 2: Frontend  
cd frontend
npm install  # (if not done)
npx expo start
# Press 'i' for iOS Simulator
# Press 'a' for Android Emulator
```

---

## ✅ TEST IT

```bash
# Terminal 3: Test API
curl http://localhost:3001/health
# Should show: { "status": "ok", ... }
```

---

## 🗺️ KEY FILES

| What | Where | Edit to change |
|------|-------|-----------------|
| Backend settings | `backend/.env` | Database credentials, port |
| Frontend settings | `frontend/.env` | Supabase URL & keys |
| Routes (app) | `frontend/app/_layout.tsx` | Navigation structure |
| API endpoints | `backend/src/modules/` | Business logic |
| Database setup | `BEST_PRACTICE_FK_REMOVAL.sql` | Schema & policies |

---

## 🏗️ WHAT'S BUILT

```
✅ Backend    → npm run start:dev
   ├─ Health check endpoint
   ├─ Providers API (GET /providers)
   └─ Database connected to Supabase

✅ Frontend   → npx expo start  
   ├─ 70+ screens configured
   ├─ Customer & Provider flows
   └─ Navigation working

✅ Database   → Supabase (need to run SQL scripts)
   ├─ User profiles
   ├─ Providers
   ├─ Services
   └─ Bookings
```

---

## 🔗 API ENDPOINTS

```
GET  /health
→ Test if server is running

GET  /providers
→ List all providers

GET  /providers/:id
→ Get provider details

GET  /providers/category/:name
→ Find providers by category
```

---

## 🚨 COMMON ERRORS

| Error | Fix |
|-------|-----|
| `Module not found` | Run `npm install` in that folder |
| `SUPABASE_SERVICE_ROLE_KEY not found` | Edit `backend/.env`, add new key |
| `Cannot connect to database` | Verify URL and key are correct in `.env` |
| `White screen in app` | Kill and restart `npx expo start` |
| `Port 3001 already in use` | Change PORT in `backend/.env` |

---

## 📱 SIMULATOR COMMANDS

```
npx expo start

i   → Open iOS Simulator (Mac only)
a   → Open Android Emulator
w   → Open in browser  
q   → Quit
r   → Reload app
```

---

## 📝 NEXT STEPS

1. ✅ Start backend & frontend (see above)
2. ⏳ Build Auth module (user login)
3. ⏳ Build Bookings module (make reservations)
4. ⏳ Build Chat module (messaging)
5. ⏳ Deploy to production

---

## 📚 MORE INFO

- `GET_RUNNING.md` - Step by step guide
- `ARCHITECTURE.md` - System design
- `SECURITY_AUDIT_REPORT.md` - Security details
- `QUICKSTART.md` - Fast reference

---

## 💡 REMEMBER

- Backend needs: `npm run start:dev`
- Frontend needs: `npx expo start`
- Both running at same time for app to work
- Check `.env` files have actual values (not placeholders)
- First startup might take 1-2 min to compile
