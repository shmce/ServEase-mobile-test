#!/bin/bash

# ServEase Full Setup Script
# This script sets up both backend and frontend to run locally with your Supabase database

set -e  # Exit on error

echo "
╔════════════════════════════════════════════════════════════════╗
║       ServEase - Complete Local Development Setup            ║
╚════════════════════════════════════════════════════════════════╝
"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running from root directory
if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    echo -e "${RED}❌ ERROR: Please run this script from the monorepo root directory${NC}"
    echo "   Current directory: $(pwd)"
    echo "   Expected structure: /backend and /frontend subdirectories"
    exit 1
fi

# Step 1: Backend Setup
echo -e "${YELLOW}Step 1: Setting up Backend...${NC}"

if [ ! -f "backend/.env" ]; then
    echo "   📝 Creating backend/.env..."
    cat > backend/.env << 'EOF'
# Supabase Configuration
SUPABASE_URL=https://strtoeeidqnsmbszhjhe.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_new_service_role_key_here

# Server
PORT=3001
NODE_ENV=development
EOF
    echo -e "${YELLOW}   ⚠️  UPDATE backend/.env with your new Supabase Service Role Key!${NC}"
else
    echo -e "${GREEN}   ✅ backend/.env already exists${NC}"
fi

echo "   📦 Installing backend dependencies..."
cd backend
npm install --silent > /dev/null 2>&1
cd ..
echo -e "${GREEN}   ✅ Backend dependencies installed${NC}"

# Step 2: Frontend Setup
echo -e "${YELLOW}Step 2: Setting up Frontend...${NC}"

if [ ! -f "frontend/.env" ]; then
    echo "   📝 Creating frontend/.env..."
    cat > frontend/.env << 'EOF'
# Frontend Configuration (Safe - only public keys)
EXPO_PUBLIC_SUPABASE_URL=https://strtoeeidqnsmbszhjhe.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0cnRvZWVpZHFuc21ic3poamhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzNTc2MzksImV4cCI6MjA4OTkzMzYzOX0.nlyLYzTvpw1bUZy8hdK4WDmdsbr86vAcaINAQ8wvPoE
EXPO_PUBLIC_API_URL=http://localhost:3001
EOF
    echo -e "${GREEN}   ✅ frontend/.env created${NC}"
else
    echo -e "${GREEN}   ✅ frontend/.env already exists${NC}"
fi

echo "   📦 Installing frontend dependencies..."
cd frontend
npm install --silent > /dev/null 2>&1
cd ..
echo -e "${GREEN}   ✅ Frontend dependencies installed${NC}"

# Step 3: Verification
echo -e "${YELLOW}Step 3: Verifying Setup...${NC}"

# Check Node versions
echo "   Node.js version: $(node --version)"
echo "   npm version: $(npm --version)"

# Check for required files
echo "   📋 Checking required files..."
files_ok=true

check_file() {
    if [ -f "$1" ]; then
        echo -e "   ${GREEN}✅${NC} $1"
    else
        echo -e "   ${RED}❌${NC} $1 (missing)"
        files_ok=false
    fi
}

check_file "backend/.env"
check_file "backend/src/main.ts"
check_file "backend/src/app.module.ts"
check_file "frontend/.env"
check_file "frontend/app/_layout.tsx"

if [ "$files_ok" = true ]; then
    echo -e "${GREEN}   ✅ All required files found${NC}"
else
    echo -e "${RED}   ❌ Some files are missing${NC}"
fi

# Step 4: Instructions
echo ""
echo -e "${GREEN}✅ Setup Complete!${NC}"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  NEXT STEPS:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1️⃣  UPDATE YOUR CREDENTIALS (CRITICAL!):"
echo "   a) Go to Supabase Dashboard → Settings → API"
echo "   b) Generate new Service Role Key (revoke the old one)"
echo "   c) Copy new key to: backend/.env"
echo "   d) Edit: SUPABASE_SERVICE_ROLE_KEY=<paste_here>"
echo ""
echo "2️⃣  START THE BACKEND:"
echo "   cd backend"
echo "   npm run start:dev"
echo "   ✅ Should see: 'ServEase API Running Successfully'"
echo "   Test: curl http://localhost:3001/health"
echo ""
echo "3️⃣  START THE FRONTEND (in new terminal):"
echo "   cd frontend"
echo "   npx expo start"
echo "   Press 'i' for iOS Simulator or 'a' for Android Emulator"
echo ""
echo "4️⃣  CONFIGURE SUPABASE (if not done yet):"
echo "   Run SQL scripts in order:"
echo "   • BEST_PRACTICE_FK_REMOVAL.sql"
echo "   • SETUP_AUTH_TRIGGER.sql"
echo "   • SEED_DATA.sql"
echo "   • VERIFY_SUPABASE_SETUP.sql"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📚 For detailed info, see: SECURITY_AUDIT_REPORT.md"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
