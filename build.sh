#!/bin/bash
set -e

echo "Installing Python dependencies..."
pip install --upgrade pip
pip install setuptools wheel
pip install --no-cache-dir --prefer-binary -r requirements.txt

echo "Build completed successfully!"
