// Popup script for settings management
document.addEventListener('DOMContentLoaded', () => {
  loadSettings();
  
  document.getElementById('settingsForm').addEventListener('submit', saveSettings);
  document.getElementById('testConnection').addEventListener('click', testServerConnection);
});

function loadSettings() {
  chrome.storage.sync.get(['enabled', 'serverUrl', 'apiKey'], (result) => {
    document.getElementById('enabled').checked = result.enabled !== false;
    document.getElementById('serverUrl').value = result.serverUrl || 'http://localhost:3001';
    document.getElementById('apiKey').value = result.apiKey || '';
  });
}

function saveSettings(e) {
  e.preventDefault();
  
  const settings = {
    enabled: document.getElementById('enabled').checked,
    serverUrl: document.getElementById('serverUrl').value,
    apiKey: document.getElementById('apiKey').value
  };
  
  chrome.storage.sync.set(settings, () => {
    showStatus('Settings saved successfully!', 'success');
    
    // Update badge on active tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0] && (tabs[0].url.includes('meet.google.com') || tabs[0].url.includes('zoom.us'))) {
        chrome.action.setBadgeText({
          text: settings.enabled ? 'ON' : 'OFF',
          tabId: tabs[0].id
        });
        
        chrome.action.setBadgeBackgroundColor({
          color: settings.enabled ? '#4CAF50' : '#F44336'
        });
      }
    });
  });
}

async function testServerConnection() {
  const serverUrl = document.getElementById('serverUrl').value;
  
  if (!serverUrl) {
    showStatus('Please enter a server URL', 'error');
    return;
  }
  
  try {
    showStatus('Testing connection...', 'info');
    
    const response = await fetch(`${serverUrl}/health`);
    
    if (response.ok) {
      const data = await response.json();
      showStatus('✓ Server connection successful!', 'success');
    } else {
      showStatus('Server responded with error: ' + response.status, 'error');
    }
  } catch (error) {
    showStatus('Failed to connect to server. Make sure it\'s running.', 'error');
  }
}

function showStatus(message, type) {
  const statusEl = document.getElementById('status');
  statusEl.textContent = message;
  statusEl.className = `status ${type}`;
  statusEl.style.display = 'block';
  
  // Hide after 3 seconds for success messages
  if (type === 'success') {
    setTimeout(() => {
      statusEl.style.display = 'none';
    }, 3000);
  }
}
