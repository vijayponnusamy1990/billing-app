#!/bin/bash
set -e

# Check if python3-venv is installed on Ubuntu/Debian
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    if ! python3 -m venv --help > /dev/null 2>&1; then
        echo "Error: python3-venv is not installed. Please run: sudo apt update && sudo apt install python3-venv"
        exit 1
    fi
fi

if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

source venv/bin/activate

echo "Installing dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

echo "Initializing Database..."
# Use the unified setup script instead of the old separate ones
python setup_database.py
