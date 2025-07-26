// Diagnostic script for Interview Co-Pilot
// Run this in the browser console on a Google Meet or Zoom page

console.log('🔍 Starting Interview Co-Pilot Diagnostics...');

// Test 1: Check if extension is loaded
setTimeout(() => {
  const overlay = document.getElementById('interview-copilot-overlay');
  if (overlay) {
    console.log('✅ Extension overlay found');
  } else {
    console.log('❌ Extension overlay NOT found - extension may not be loaded');
  }
}, 2000);

// Test 2: Check server connection
async function testServerConnection() {
  try {
    console.log('🔍 Testing server connection...');
    const response = await fetch('http://localhost:3001/health');
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Server is responding:', data);
    } else {
      console.log('❌ Server responded with error:', response.status);
    }
  } catch (error) {
    console.log('❌ Cannot reach server:', error.message);
  }
}

// Test 3: Check Chrome extension storage
function testExtensionSettings() {
  if (typeof chrome !== 'undefined' && chrome.storage) {
    chrome.storage.sync.get(['enabled', 'serverUrl'], (result) => {
      console.log('🔍 Extension settings:', result);
      if (result.enabled === false) {
        console.log('⚠️ Extension is disabled in settings');
      }
      if (!result.serverUrl) {
        console.log('⚠️ No server URL configured, using default');
      }
    });
  } else {
    console.log('❌ Chrome extension APIs not available');
  }
}

// Test 4: Check Socket.IO availability
function testSocketIO() {
  const script = document.createElement('script');
  script.src = 'https://cdn.socket.io/4.7.2/socket.io.min.js';
  script.onload = () => {
    console.log('✅ Socket.IO library loaded successfully');
    
    // Try to connect
    const testSocket = io('http://localhost:3001', {
      transports: ['websocket', 'polling'],
      timeout: 5000
    });
    
    testSocket.on('connect', () => {
      console.log('✅ Socket.IO connection successful:', testSocket.id);
      testSocket.disconnect();
    });
    
    testSocket.on('connect_error', (error) => {
      console.log('❌ Socket.IO connection failed:', error.message);
    });
  };
  script.onerror = () => {
    console.log('❌ Failed to load Socket.IO library');
  };
  document.head.appendChild(script);
}

// Test 5: Check current page compatibility
function testPageCompatibility() {
  const url = window.location.href;
  if (url.includes('meet.google.com') || url.includes('zoom.us')) {
    console.log('✅ Page is compatible:', url);
  } else {
    console.log('⚠️ Page may not be compatible:', url);
    console.log('Try navigating to meet.google.com or zoom.us');
  }
}

// Run all tests
console.log('🔍 Running diagnostics...');
testPageCompatibility();
testServerConnection();
testExtensionSettings();
testSocketIO();

console.log('');
console.log('📋 Instructions:');
console.log('1. Check the messages above for any ❌ or ⚠️ issues');
console.log('2. If server is not responding, make sure it\'s running: npm start');
console.log('3. If extension overlay not found, reload the extension');
console.log('4. If Socket.IO fails, check if localhost is blocked');
console.log('5. Check the debug panel in the overlay (🔧 button)');
