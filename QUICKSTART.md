# 🚀 ServEase - Quick Start Guide

## ⚠️ CRITICAL FIRST STEP (Do this NOW - 5 min)

### Step 1: Revoke Exposed Credentials
1. Go to: https://app.supabase.com → Your Project → Settings → API
2. Find "Service Role Key" section
3. Click "Generate New" to create a new key
4. **Copy the new key** (you won't see it again)

### Step 2: Update Backend Configuration
```bash
# Edit backend/.env
SUPABASE_URL=https://strtoeeidqnsmbszhjhe.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_new_key_from_step_1
PORT=3001
NODE_ENV=development
```

---

## ✅ Setup (10 min)

### Option A: Automatic Setup (Recommended)
```bash
# From monorepo root
chmod +x setup.sh
./setup.sh
```

### Option B: Manual Setup
```bash
# Backend
cd backend
npm install
npm run start:dev

# Frontend (in new terminal)
cd frontend
npm install
npx expo start
```

---

## 🧪 Testing

### Backend is Running?
```bash
# Should return: { "status": "ok", "database": "connected" }
curl http://localhost:3001/health
```

### Frontend is Running?
- iOS Simulator: Press `i` in Expo terminal
- Android Emulator: Press `a` in Expo terminal
- Physical device: Use Expo Go app, scan QR code

---

## 🗄️ Database Setup (if needed)

Run these SQL scripts in Supabase SQL Editor **in this order**:

1. **BEST_PRACTICE_FK_REMOVAL.sql** - Sets up RLS policies
2. **SETUP_AUTH_TRIGGER.sql** - Auto-creates user profiles
3. **SEED_DATA.sql** - Adds test data
4. **VERIFY_SUPABASE_SETUP.sql** - Verify it worked

---

## 🆘 Troubleshooting

### Backend won't start
```
Error: Missing SUPABASE_SERVICE_ROLE_KEY
→ Fix: Update backend/.env with new key
```

### Frontend shows white screen
```
Error: Cannot find navigation screen
→ Fix: Already done! App._layout.tsx updated with all routes
```

### Database queries fail
```
Error: 401 Unauthorized
→ Fix: Check SUPABASE_URL and SERVICE_ROLE_KEY in backend/.env
```

### Still stuck?
- See `SECURITY_AUDIT_REPORT.md` for detailed info
- Check console for exact error messages
- Verify `.env` files exist and have values

---

## 📋 What I Already Fixed For You

✅ Removed hardcoded credentials from code  
✅ Created backend database module  
✅ Fixed frontend routing (70+ screens)  
✅ Added proper CORS configuration  
✅ Created health check endpoint  
✅ Enhanced RLS policies with DELETE support  

---

## 🎯 What's Left To Do

- [ ] Update backend/.env with new Supabase key
- [ ] Run setup.sh or manual npm install
- [ ] Start backend: `npm run start:dev`
- [ ] Start frontend: `npx expo start`
- [ ] Run Supabase SQL scripts (if database not set up)

---

**Questions?** Check SECURITY_AUDIT_REPORT.md or COMPLETE_SETUP_GUIDE.md
