@echo off
REM Build script for Chrome extension (Windows)

echo Building Interview Co-Pilot Chrome Extension...

REM Create dist directory
if not exist dist mkdir dist

REM Copy static files
copy manifest.json dist\ >nul
copy src\popup.html dist\ >nul
copy src\styles.css dist\ >nul

REM Copy source files (for development)
copy src\content.js dist\ >nul
copy src\background.js dist\ >nul
copy src\popup.js dist\ >nul

echo Build complete! Extension files are in the 'dist' directory.
echo.
echo To install the extension:
echo 1. Open Chrome and go to chrome://extensions/
echo 2. Enable Developer mode
echo 3. Click 'Load unpacked' and select the 'dist' directory
