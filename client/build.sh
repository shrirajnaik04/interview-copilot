#!/bin/bash
# Build script for Chrome extension

echo "Building Interview Co-Pilot Chrome Extension..."

# Create dist directory
mkdir -p dist

# Copy static files
cp manifest.json dist/
cp src/popup.html dist/
cp src/styles.css dist/
cp -r icons dist/ 2>/dev/null || echo "No icons directory found"

# Copy source files (for development)
cp src/content.js dist/
cp src/background.js dist/
cp src/popup.js dist/

echo "Build complete! Extension files are in the 'dist' directory."
echo ""
echo "To install the extension:"
echo "1. Open Chrome and go to chrome://extensions/"
echo "2. Enable Developer mode"
echo "3. Click 'Load unpacked' and select the 'dist' directory"
