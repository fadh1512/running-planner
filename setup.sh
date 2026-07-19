#!/bin/bash
# ============================================
# Running Planner - Full Setup Script
# ============================================
# Run this script once to install everything:
#   chmod +x setup.sh
#   ./setup.sh
# ============================================

echo ""
echo "==========================================="
echo "  Running Planner - Setup"
echo "==========================================="
echo ""

# ---- Step 1: System packages ----
echo "[1/7] Installing system packages..."
echo ""

# Install Node.js 18.x
if ! command -v node &> /dev/null; then
    echo "  -> Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
    echo "  -> Node.js $(node --version) installed"
else
    echo "  -> Node.js already installed: $(node --version)"
fi

# Install PostgreSQL
if ! command -v psql &> /dev/null; then
    echo "  -> Installing PostgreSQL..."
    sudo apt-get install -y postgresql postgresql-contrib libpq-dev
    echo "  -> PostgreSQL installed"
else
    echo "  -> PostgreSQL already installed"
fi

# Install Python venv (test if venv can actually CREATE environments)
echo "  -> Checking Python venv..."
if ! python3 -m venv --help &> /dev/null; then
    echo "  -> Installing python3.12-venv and python3-pip..."
    sudo apt-get install -y python3.12-venv python3-pip
    echo "  -> python3-venv installed"
else
    echo "  -> python3-venv already working"
fi

echo ""

# ---- Step 2: Start PostgreSQL ----
echo "[2/7] Starting PostgreSQL..."
sudo systemctl start postgresql 2>/dev/null || sudo service postgresql start 2>/dev/null || true
echo "  -> PostgreSQL is running"
echo ""

# ---- Step 3: Create database + set password ----
echo "[3/7] Creating database and setting password..."
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'password';" 2>/dev/null || true
sudo -u postgres psql -c "CREATE DATABASE running_planner;" 2>/dev/null || echo "  -> Database already exists"
echo ""

# ---- Step 4: Setup Backend ----
echo "[4/7] Setting up backend..."
cd backend

if [ ! -d "venv" ] || [ ! -f "venv/bin/activate" ]; then
    python3 -m venv venv
    echo "  -> Virtual environment created"
else
    echo "  -> Virtual environment already exists"
fi

source venv/bin/activate
pip install -r requirements.txt
echo "  -> Backend packages installed"

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    cp .env.example .env
    echo "  -> Created .env from .env.example"
    echo "  -> If your PostgreSQL password is not 'password', edit .env:"
    echo "     DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/running_planner"
else
    echo "  -> .env already exists"
fi

cd ..
echo ""

# ---- Step 5: Setup Frontend ----
echo "[5/7] Setting up frontend..."
cd frontend
npm install
echo "  -> Frontend packages installed"
cd ..
echo ""

# ---- Step 6: Create start scripts ----
echo "[6/7] Creating start scripts..."

cat > start-backend.sh << 'SCRIPT'
#!/bin/bash
cd "$(dirname "$0")/backend"
source venv/bin/activate
echo "Starting backend at http://localhost:8000"
echo "API docs at http://localhost:8000/docs"
uvicorn app.main:app --reload --port 8000
SCRIPT
chmod +x start-backend.sh

cat > start-frontend.sh << 'SCRIPT'
#!/bin/bash
cd "$(dirname "$0")/frontend"
echo "Starting frontend at http://localhost:5173"
npm run dev
SCRIPT
chmod +x start-frontend.sh

cat > start-all.sh << 'SCRIPT'
#!/bin/bash
BASEDIR="$(cd "$(dirname "$0")" && pwd)"
echo "Starting Running Planner..."
echo ""

# Start backend in background
cd "$BASEDIR/backend"
source venv/bin/activate
uvicorn app.main:app --reload --port 8000 &
BACKEND_PID=$!

# Wait for backend to be ready
echo "Waiting for backend to start..."
sleep 4

# Start frontend
cd "$BASEDIR/frontend"
npm run dev &
FRONTEND_PID=$!

echo ""
echo "==========================================="
echo "  Running Planner is live!"
echo "==========================================="
echo "  Frontend: http://localhost:5173"
echo "  Backend:  http://localhost:8000"
echo "  API Docs: http://localhost:8000/docs"
echo "==========================================="
echo ""
echo "Press Ctrl+C to stop both servers."

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM
wait
SCRIPT
chmod +x start-all.sh

echo ""

# ---- Step 7: Done ----
echo "[7/7] Setup complete!"
echo ""
echo "==========================================="
echo "  All done! How to run:"
echo "==========================================="
echo ""
echo "  Option 1 - Start everything:"
echo "    ./start-all.sh"
echo ""
echo "  Option 2 - Start separately:"
echo "    Terminal 1:  ./start-backend.sh"
echo "    Terminal 2:  ./start-frontend.sh"
echo ""
echo "  Then open: http://localhost:5173"
echo ""
echo "  API Docs:  http://localhost:8000/docs"
echo "==========================================="
echo ""
