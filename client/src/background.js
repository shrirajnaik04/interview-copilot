// Background service worker
chrome.runtime.onInstalled.addListener(() => {
  console.log('Interview Co-Pilot extension installed');
  
  // Set default settings
  chrome.storage.sync.set({
    enabled: true,
    serverUrl: 'http://localhost:3001',
    apiKey: ''
  });
});

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
  // Check if we're on a supported site
  if (tab.url.includes('meet.google.com') || tab.url.includes('zoom.us')) {
    // Toggle extension state
    chrome.storage.sync.get(['enabled'], (result) => {
      const newState = !result.enabled;
      chrome.storage.sync.set({ enabled: newState });
      
      // Update icon badge
      chrome.action.setBadgeText({
        text: newState ? 'ON' : 'OFF',
        tabId: tab.id
      });
      
      chrome.action.setBadgeBackgroundColor({
        color: newState ? '#4CAF50' : '#F44336'
      });
    });
  } else {
    // Show notification for unsupported sites
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'Interview Co-Pilot',
      message: 'Please navigate to Google Meet or Zoom to use this extension.'
    });
  }
});

// Listen for tab updates to update badge
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    if (tab.url.includes('meet.google.com') || tab.url.includes('zoom.us')) {
      chrome.storage.sync.get(['enabled'], (result) => {
        chrome.action.setBadgeText({
          text: result.enabled ? 'ON' : 'OFF',
          tabId: tabId
        });
        
        chrome.action.setBadgeBackgroundColor({
          color: result.enabled ? '#4CAF50' : '#F44336'
        });
      });
    } else {
      chrome.action.setBadgeText({
        text: '',
        tabId: tabId
      });
    }
  }
});

// Handle messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getSettings') {
    chrome.storage.sync.get(['enabled', 'serverUrl', 'apiKey'], (result) => {
      sendResponse(result);
    });
    return true; // Keep message channel open
  }
  
  if (request.action === 'saveSettings') {
    chrome.storage.sync.set(request.settings, () => {
      sendResponse({ success: true });
    });
    return true;
  }
});
