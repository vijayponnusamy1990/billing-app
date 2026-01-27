#!/bin/bash
set -e

echo "🚀 Initializing Database and Seeding Users..."
python setup_database.py

echo "🏃 Starting Backend Server..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
