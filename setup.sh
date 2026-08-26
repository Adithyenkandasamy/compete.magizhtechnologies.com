#!/bin/bash
# Setup script for Comp platform

echo "🚀 Setting up Comp Platform..."

# Frontend setup
echo "📦 Installing frontend dependencies..."
cd frontend
npm install
cp .env.example .env
echo "✅ Frontend setup complete"

# Backend setup
echo "📦 Setting up backend..."
cd ../backend

# Check if Python 3.11+ is installed
python_version=$(python3 --version 2>&1 | awk '{print $2}')
echo "🐍 Python version: $python_version"

# Create venv
python3 -m venv venv
source venv/bin/activate

# Install dependencies using poetry
pip install poetry
poetry install

cp .env.example .env

echo "✅ Backend setup complete"

echo ""
echo "📝 Next steps:"
echo "1. Update database credentials in backend/.env"
echo "2. Update API URL in frontend/.env if needed"
echo "3. Run 'cd frontend && npm run dev' to start frontend"
echo "4. Run 'cd backend && source venv/bin/activate && uvicorn main:app --reload' to start backend"
echo ""
echo "🎉 Setup complete! Happy coding!"
