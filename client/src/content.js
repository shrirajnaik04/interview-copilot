// Content script - injected into Google Meet/Zoom pages
class InterviewCopilot {
  constructor() {
    this.isActive = false;
    this.recognition = null;
    this.socket = null;
    this.overlay = null;
    this.currentTranscript = '';
    this.answers = [];
    
    this.init();
  }

  async init() {
    console.log('🚀 Interview Co-Pilot: Starting initialization...');
    
    // Check page compatibility first
    if (!this.isCompatiblePage()) {
      console.log('⚠️ Page not compatible, skipping initialization');
      return;
    }
    
    // Check if extension is enabled
    const settings = await this.getSettings();
    console.log('⚙️ Settings loaded:', settings);
    
    if (!settings.enabled) {
      console.log('🚫 Extension is disabled');
      return;
    }

    console.log('✅ Initializing Interview Co-Pilot...');
    this.createOverlay();
    this.updateStatus('Setting up...', 'info');
    this.updateDebug('🚀 Extension started');
    
    // Initialize components with proper sequencing
    this.setupSpeechRecognition();
    
    // Connect to server with timeout fallback
    this.connectToServer();
    
    // Fallback initialization if connection takes too long
    setTimeout(() => {
      if (this.statusElement && this.statusElement.textContent.includes('Setting up')) {
        console.log('⚠️ Fallback initialization - assuming server unavailable');
        this.updateStatus('Ready (Offline)', 'ready');
        this.updateDebug('⚠️ Running in offline mode');
      }
    }, 5000);
    
    this.setupKeyboardShortcuts();
    this.updateDebug('✅ All components initialized');
  }

  isCompatiblePage() {
    const url = window.location.href;
    const title = document.title.toLowerCase();
    
    // Check for video conferencing platforms
    const isGoogleMeet = url.includes('meet.google.com') || title.includes('google meet');
    const isZoom = url.includes('zoom.us') || title.includes('zoom');
    const isTestPage = url.includes('test') || title.includes('interview');
    
    console.log('🔍 Page compatibility check:', { url, title, isGoogleMeet, isZoom, isTestPage });
    
    return isGoogleMeet || isZoom || isTestPage;
  }

  async getSettings() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(['enabled', 'apiKey', 'serverUrl'], (result) => {
        resolve({
          enabled: result.enabled !== false,
          apiKey: result.apiKey || '',
          serverUrl: result.serverUrl || 'http://localhost:3001'
        });
      });
    });
  }

  createOverlay() {
    // Remove any existing overlay to prevent duplicates
    const existingOverlay = document.getElementById('interview-copilot-overlay');
    if (existingOverlay) {
      existingOverlay.remove();
    }

    // Create floating overlay with enhanced UI/UX (React Portal-style rendering)
    this.overlay = document.createElement('div');
    this.overlay.id = 'interview-copilot-overlay';
    this.overlay.className = 'compact-mode'; // Start in compact mode
    
    // Set maximum z-index to ensure it appears above all content
    this.overlay.style.zIndex = '2147483647'; // Maximum z-index value
    this.overlay.style.position = 'fixed';
    this.overlay.style.pointerEvents = 'auto';
    
    this.overlay.innerHTML = `
      <div class="copilot-header">
        <span>🤖 Interview Co-Pilot</span>
        <div class="controls">
          <button id="toggle-listening" class="btn-control">🎤</button>
          <button id="expand-toggle" class="btn-control" title="Expand/Collapse">⇲</button>
          <button id="settings-toggle" class="btn-control" title="Settings">⚙️</button>
          <button id="emergency-hide" class="btn-control" title="Emergency Hide (Ctrl+Shift+H)">👁️</button>
          <button id="minimize-overlay" class="btn-control">−</button>
          <button id="close-overlay" class="btn-control">×</button>
        </div>
      </div>
      <div class="copilot-content">
        <!-- Compact Mode: Only AI Response -->
        <div class="compact-section">
          <div class="ai-response-compact">
            <div id="ai-response-streaming" class="response-text-streaming">Ready to assist with your interview...</div>
            <div class="confidence-indicator">
              <span id="response-confidence" class="confidence-bar">🟢</span>
              <span class="response-source">Together.ai</span>
            </div>
          </div>
        </div>
        
        <!-- Expanded Mode: Full Interface -->
        <div class="expanded-section" style="display: none;">
          <div class="chat-container">
            <div class="transcript-section">
              <div class="section-header">
                <h4>🎤 Live Transcript</h4>
                <div class="transcript-confidence">
                  <span id="transcript-confidence" class="confidence-indicator">🟢</span>
                  <span class="confidence-text">High</span>
                </div>
              </div>
              <div id="live-transcript" class="transcript-text">Listening for questions...</div>
            </div>
            
            <div class="answer-section">
              <div class="section-header">
                <h4>🤖 AI Response</h4>
                <div class="context-tags" id="context-tags"></div>
              </div>
              <div id="ai-response-full" class="response-text">Ready to assist with your interview...</div>
              <div class="suggested-followups" id="suggested-followups" style="display: none;">
                <h5>💡 Suggested Follow-ups:</h5>
                <div class="followup-chips"></div>
              </div>
            </div>
            
            <div class="conversation-history" style="display: none;">
              <h4>📝 Conversation History</h4>
              <div id="conversation-list" class="conversation-list"></div>
            </div>
          </div>
          
          <div class="debug-section" style="display: none;">
            <h4>🔧 Debug Info</h4>
            <div id="debug-info" class="debug-text"></div>
          </div>
        </div>
        
        <!-- Settings Panel -->
        <div class="settings-panel" style="display: none;">
          <h4>⚙️ Settings</h4>
          <div class="setting-item">
            <label>API Key:</label>
            <input type="password" id="api-key-input" placeholder="Enter Together.ai API key">
          </div>
          <div class="setting-item">
            <label>Model:</label>
            <select id="model-select">
              <option value="mistralai/Mixtral-8x7B-Instruct-v0.1">Mixtral 8x7B</option>
              <option value="meta-llama/Llama-2-70b-chat-hf">LLaMA 2 70B</option>
            </select>
          </div>
          <div class="setting-item">
            <label>Opacity:</label>
            <input type="range" id="opacity-slider" min="50" max="100" value="98">
            <span id="opacity-value">98%</span>
          </div>
          <div class="setting-item">
            <label>
              <input type="checkbox" id="show-confidence" checked> Show Confidence Indicators
            </label>
          </div>
          <div class="setting-item">
            <label>
              <input type="checkbox" id="stream-responses" checked> Stream Responses
            </label>
          </div>
          <div class="setting-item">
            <label>
              <input type="checkbox" id="auto-hide-mode"> Auto-hide when inactive
            </label>
          </div>
        </div>
        
        <div class="status-section">
          <span id="status-indicator" class="status-info">Initializing...</span>
          <div class="action-buttons">
            <button id="debug-toggle" class="btn-debug" title="Toggle Debug Info">🔧</button>
            <button id="history-toggle" class="btn-debug" title="Toggle History">📝</button>
          </div>
        </div>
      </div>
    `;

    // Append to body (React Portal-style) to ensure it's always on top
    document.body.appendChild(this.overlay);
    
    // Force focus and ensure it's interactive
    this.overlay.tabIndex = -1;
    
    this.setupOverlayEvents();
    this.setupKeyboardShortcuts();
    this.loadUserPreferences();
    this.setupAutoHide();
  }

  setupOverlayEvents() {
    document.getElementById('toggle-listening').addEventListener('click', () => {
      this.toggleListening();
    });

    document.getElementById('expand-toggle').addEventListener('click', () => {
      this.toggleExpandMode();
    });

    document.getElementById('settings-toggle').addEventListener('click', () => {
      this.toggleSettings();
    });

    document.getElementById('emergency-hide').addEventListener('click', () => {
      this.emergencyHide();
    });

    document.getElementById('minimize-overlay').addEventListener('click', () => {
      this.overlay.classList.toggle('minimized');
    });

    document.getElementById('close-overlay').addEventListener('click', () => {
      this.overlay.style.display = 'none';
    });

    document.getElementById('debug-toggle').addEventListener('click', () => {
      const debugSection = document.querySelector('.debug-section');
      debugSection.style.display = debugSection.style.display === 'none' ? 'block' : 'none';
    });

    document.getElementById('history-toggle').addEventListener('click', () => {
      const historySection = document.querySelector('.conversation-history');
      historySection.style.display = historySection.style.display === 'none' ? 'block' : 'none';
    });

    // Settings event handlers
    document.getElementById('opacity-slider').addEventListener('input', (e) => {
      const opacity = e.target.value;
      this.overlay.style.background = `rgba(248, 250, 252, ${opacity / 100})`;
      document.getElementById('opacity-value').textContent = opacity + '%';
      this.saveUserPreference('opacity', opacity);
    });

    document.getElementById('show-confidence').addEventListener('change', (e) => {
      this.showConfidenceIndicators = e.target.checked;
      this.saveUserPreference('showConfidence', e.target.checked);
      // Update visibility of confidence indicators
      this.updateConfidenceVisibility();
    });

    document.getElementById('stream-responses').addEventListener('change', (e) => {
      this.streamResponses = e.target.checked;
      this.saveUserPreference('streamResponses', e.target.checked);
    });

    document.getElementById('auto-hide-mode').addEventListener('change', (e) => {
      this.autoHideMode = e.target.checked;
      this.saveUserPreference('autoHideMode', e.target.checked);
      if (e.target.checked) {
        this.startAutoHideTimer();
      } else {
        this.stopAutoHideTimer();
      }
    });

    // API key save handler
    document.getElementById('api-key-input').addEventListener('change', (e) => {
      this.saveUserPreference('apiKey', e.target.value);
    });

    document.getElementById('model-select').addEventListener('change', (e) => {
      this.saveUserPreference('selectedModel', e.target.value);
    });

    // Make overlay draggable
    this.makeDraggable();
    this.makeDockable();
  }

  toggleExpandMode() {
    const isCompact = this.overlay.classList.contains('compact-mode');
    if (isCompact) {
      this.overlay.classList.remove('compact-mode');
      this.overlay.classList.add('expanded-mode');
      document.querySelector('.compact-section').style.display = 'none';
      document.querySelector('.expanded-section').style.display = 'block';
      document.getElementById('expand-toggle').innerHTML = '⇱';
      document.getElementById('expand-toggle').title = 'Compact Mode';
    } else {
      this.overlay.classList.remove('expanded-mode');
      this.overlay.classList.add('compact-mode');
      document.querySelector('.compact-section').style.display = 'block';
      document.querySelector('.expanded-section').style.display = 'none';
      document.getElementById('expand-toggle').innerHTML = '⇲';
      document.getElementById('expand-toggle').title = 'Expand Mode';
    }
    this.saveUserPreference('expandMode', !isCompact);
  }

  toggleSettings() {
    const settingsPanel = document.querySelector('.settings-panel');
    const isVisible = settingsPanel.style.display !== 'none';
    settingsPanel.style.display = isVisible ? 'none' : 'block';
  }

  emergencyHide() {
    this.overlay.style.display = this.overlay.style.display === 'none' ? 'block' : 'none';
  }

  makeDockable() {
    let isDocked = false;
    const overlay = this.overlay;
    
    // Check if near screen edges and auto-dock
    const checkDocking = () => {
      const rect = overlay.getBoundingClientRect();
      const threshold = 20;
      
      if (rect.left <= threshold && !isDocked) {
        overlay.style.left = '0px';
        overlay.classList.add('docked-left');
        isDocked = true;
      } else if (rect.right >= window.innerWidth - threshold && !isDocked) {
        overlay.style.right = '0px';
        overlay.style.left = 'auto';
        overlay.classList.add('docked-right');
        isDocked = true;
      } else if (isDocked && rect.left > threshold && rect.right < window.innerWidth - threshold) {
        overlay.classList.remove('docked-left', 'docked-right');
        isDocked = false;
      }
    };

    // Add mouse move listener for docking
    overlay.addEventListener('mouseup', checkDocking);
  }

  updateConfidenceIndicator(confidence, type = 'transcript') {
    if (!this.showConfidenceIndicators) return;
    
    const indicator = document.getElementById(`${type}-confidence`);
    if (!indicator) return;
    
    let color, text;
    if (confidence >= 0.8) {
      color = '🟢';
      text = 'High';
    } else if (confidence >= 0.6) {
      color = '🟡';
      text = 'Medium';
    } else {
      color = '🔴';
      text = 'Low';
    }
    
    indicator.innerHTML = color;
    if (type === 'transcript') {
      document.querySelector('.confidence-text').textContent = text;
    }
  }

  addContextTags(question) {
    const tags = this.extractTags(question);
    const container = document.getElementById('context-tags');
    container.innerHTML = tags.map(tag => 
      `<span class="context-tag">#${tag}</span>`
    ).join('');
  }

  extractTags(text) {
    const techKeywords = {
      'API': ['api', 'rest', 'endpoint', 'request', 'response'],
      'Selenium': ['selenium', 'webdriver', 'automation', 'testing'],
      'Behavioral': ['tell me about', 'describe', 'experience', 'challenging'],
      'JavaScript': ['javascript', 'js', 'node', 'react', 'angular'],
      'Python': ['python', 'django', 'flask', 'pandas'],
      'Database': ['sql', 'database', 'query', 'mysql', 'postgresql'],
      'DevOps': ['docker', 'kubernetes', 'ci/cd', 'deployment']
    };
    
    const tags = [];
    const lowerText = text.toLowerCase();
    
    Object.entries(techKeywords).forEach(([tag, keywords]) => {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        tags.push(tag);
      }
    });
    
    return tags;
  }

  saveUserPreference(key, value) {
    chrome.storage.local.set({ [key]: value });
  }

  loadUserPreferences() {
    chrome.storage.local.get(['opacity', 'showConfidence', 'streamResponses', 'expandMode', 'autoHideMode', 'apiKey', 'selectedModel'], (result) => {
      if (result.opacity) {
        document.getElementById('opacity-slider').value = result.opacity;
        document.getElementById('opacity-value').textContent = result.opacity + '%';
        this.overlay.style.background = `rgba(248, 250, 252, ${result.opacity / 100})`;
      }
      
      this.showConfidenceIndicators = result.showConfidence !== false;
      document.getElementById('show-confidence').checked = this.showConfidenceIndicators;
      
      this.streamResponses = result.streamResponses !== false;
      document.getElementById('stream-responses').checked = this.streamResponses;
      
      this.autoHideMode = result.autoHideMode || false;
      document.getElementById('auto-hide-mode').checked = this.autoHideMode;
      
      if (result.apiKey) {
        document.getElementById('api-key-input').value = result.apiKey;
      }
      
      if (result.selectedModel) {
        document.getElementById('model-select').value = result.selectedModel;
      }
      
      if (result.expandMode) {
        this.toggleExpandMode();
      }
      
      this.updateConfidenceVisibility();
      
      if (this.autoHideMode) {
        this.startAutoHideTimer();
      }
    });
  }

  updateConfidenceVisibility() {
    const confidenceElements = document.querySelectorAll('.confidence-indicator, .transcript-confidence');
    confidenceElements.forEach(el => {
      el.style.display = this.showConfidenceIndicators ? 'flex' : 'none';
    });
  }

  setupAutoHide() {
    this.autoHideTimer = null;
    this.isUserActive = false;
    
    // Track user interaction with the overlay
    this.overlay.addEventListener('mouseenter', () => {
      this.isUserActive = true;
      this.stopAutoHideTimer();
    });
    
    this.overlay.addEventListener('mouseleave', () => {
      this.isUserActive = false;
      if (this.autoHideMode) {
        this.startAutoHideTimer();
      }
    });
  }

  startAutoHideTimer() {
    if (this.autoHideTimer) return;
    
    this.autoHideTimer = setTimeout(() => {
      if (!this.isUserActive && this.autoHideMode && !this.isActive) {
        this.overlay.style.opacity = '0.3';
        this.overlay.style.pointerEvents = 'none';
      }
    }, 10000); // Hide after 10 seconds of inactivity
  }

  stopAutoHideTimer() {
    if (this.autoHideTimer) {
      clearTimeout(this.autoHideTimer);
      this.autoHideTimer = null;
    }
    this.overlay.style.opacity = '1';
    this.overlay.style.pointerEvents = 'auto';
  }

  streamResponseText(text, element) {
    if (!this.streamResponses) {
      element.innerHTML = this.formatText(text);
      return;
    }
    
    element.innerHTML = '';
    let index = 0;
    const words = text.split(' ');
    
    const streamInterval = setInterval(() => {
      if (index < words.length) {
        element.innerHTML += (index > 0 ? ' ' : '') + words[index];
        index++;
      } else {
        clearInterval(streamInterval);
      }
    }, 50); // Stream each word every 50ms
  }

  makeDraggable() {
    const header = this.overlay.querySelector('.copilot-header');
    let isDragging = false;
    let startX, startY, initialX, initialY;

    header.addEventListener('mousedown', (e) => {
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      initialX = this.overlay.offsetLeft;
      initialY = this.overlay.offsetTop;
    });

    document.addEventListener('mousemove', (e) => {
      if (isDragging) {
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        this.overlay.style.left = (initialX + dx) + 'px';
        this.overlay.style.top = (initialY + dy) + 'px';
      }
    });

    document.addEventListener('mouseup', () => {
      isDragging = false;
    });
  }

  setupSpeechRecognition() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      this.showError('Speech recognition not supported in this browser');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    
    // Enhanced speech recognition settings for better accuracy
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';
    this.recognition.maxAlternatives = 5;
    
    // Additional settings for better quality
    this.recognition.serviceURI = '';  // Use default service
    
    // Add confidence threshold
    this.minConfidence = 0.7;

    this.recognition.onstart = () => {
      this.updateStatus('Listening...', 'listening');
    };

    this.recognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';
      let highestConfidence = 0;

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        
        // Use the alternative with highest confidence
        let bestTranscript = result[0].transcript;
        let bestConfidence = result[0].confidence || 1;
        
        for (let j = 0; j < result.length; j++) {
          if (result[j].confidence > bestConfidence) {
            bestTranscript = result[j].transcript;
            bestConfidence = result[j].confidence;
          }
        }
        
        if (result.isFinal) {
          // Only use high-confidence final results
          if (bestConfidence >= this.minConfidence) {
            finalTranscript += bestTranscript;
            highestConfidence = Math.max(highestConfidence, bestConfidence);
          }
        } else {
          interimTranscript += bestTranscript;
        }
      }

      // Update display with both final and interim results
      const displayTranscript = finalTranscript || interimTranscript;
      this.currentTranscript = displayTranscript;
      this.updateTranscript(displayTranscript, highestConfidence);

      // Only process high-quality final transcripts
      if (finalTranscript.trim() && highestConfidence >= this.minConfidence) {
        const cleanTranscript = finalTranscript.trim();
        console.log('Processing high-quality transcript:', cleanTranscript, 'Confidence:', highestConfidence);
        
        // Stop auto-hide timer when actively processing
        this.stopAutoHideTimer();
        
        if (this.socket && this.socket.connected) {
          // Send to server for AI processing
          console.log('✅ Socket connected, sending to Together.ai...');
          this.socket.emit('transcription', {
            text: cleanTranscript,
            context: this.getInterviewContext(),
            timestamp: new Date().toISOString(),
            confidence: highestConfidence
          });
          
          // Show loading indicator
          this.displayAnswer('🤔 Generating AI response via Together.ai...');
          this.updateDebug('📤 Sent to Together.ai API (socket connected)');
        } else {
          // Fallback: Generate local response when server unavailable
          console.log('❌ Socket not connected, generating fallback response...');
          this.updateDebug('⚠️ Socket disconnected - using offline fallback');
          this.generateFallbackResponse(cleanTranscript);
        }
      }
    };

    this.recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      this.updateStatus('Error: ' + event.error, 'error');
    };

    this.recognition.onend = () => {
      if (this.isActive) {
        // Restart recognition if still active
        setTimeout(() => this.recognition.start(), 1000);
      } else {
        this.updateStatus('Stopped', 'stopped');
      }
    };
  }

  connectToServer() {
    console.log('Starting server connection...');
    this.updateStatus('Connecting...', 'info');
    
    this.getSettings().then(config => {
      console.log('Connecting with config:', config);
      
      // Try multiple Socket.IO CDN sources
      if (!window.io) {
        console.log('Loading Socket.IO library...');
        this.loadSocketIO()
          .then(() => {
            console.log('Socket.IO loaded successfully');
            this.initializeSocket(config);
          })
          .catch((error) => {
            console.error('Failed to load Socket.IO library:', error);
            this.updateStatus('Ready (No Socket.IO)', 'ready');
            this.updateDebug('❌ Socket.IO library failed to load');
          });
      } else {
        console.log('Socket.IO already available');
        this.initializeSocket(config);
      }
    }).catch(error => {
      console.error('Failed to get settings:', error);
      this.updateStatus('Ready (No Settings)', 'ready');
      this.updateDebug('❌ Settings load failed: ' + error.message);
    });
  }

  loadSocketIO() {
    return new Promise((resolve, reject) => {
      // Try primary CDN
      const script1 = document.createElement('script');
      script1.src = 'https://cdn.socket.io/4.7.2/socket.io.min.js';
      script1.onload = resolve;
      script1.onerror = () => {
        console.log('Primary CDN failed, trying backup...');
        // Try backup CDN
        const script2 = document.createElement('script');
        script2.src = 'https://cdnjs.cloudflare.com/ajax/libs/socket.io/4.7.2/socket.io.min.js';
        script2.onload = resolve;
        script2.onerror = () => {
          console.log('Backup CDN failed, trying unpkg...');
          // Try unpkg as last resort
          const script3 = document.createElement('script');
          script3.src = 'https://unpkg.com/socket.io-client@4.7.2/dist/socket.io.min.js';
          script3.onload = resolve;
          script3.onerror = reject;
          document.head.appendChild(script3);
        };
        document.head.appendChild(script2);
      };
      document.head.appendChild(script1);
    });
  }

  initializeSocket(config) {
    try {
      const serverUrl = config.serverUrl || 'http://localhost:3001';
      console.log('Initializing socket connection to:', serverUrl);
      this.updateStatus('Connecting to server...', 'info');
      this.updateDebug('🔗 Attempting connection to: ' + serverUrl);
      
      // Test server health first
      fetch(serverUrl + '/health')
        .then(response => response.json())
        .then(data => {
          console.log('✅ Server health check passed:', data);
          this.updateDebug('✅ Server health: ' + data.status);
        })
        .catch(error => {
          console.log('❌ Server health check failed:', error);
          this.updateDebug('❌ Server health failed: ' + error.message);
        });
      
      // Set connection timeout
      const connectionTimeout = setTimeout(() => {
        console.log('⚠️ Connection timeout - switching to offline mode');
        this.updateStatus('Ready (Offline)', 'ready');
        this.updateDebug('⚠️ Connection timeout - offline mode');
      }, 10000);
      
      this.socket = io(serverUrl, {
        transports: ['websocket', 'polling'],
        timeout: 5000,
        forceNew: true,
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 3,
        reconnectionDelay: 1000
      });
      
      this.socket.on('connect', () => {
        clearTimeout(connectionTimeout);
        console.log('✅ Connected to Together.ai server with ID:', this.socket.id);
        this.updateStatus('Connected & Ready (Together.ai)', 'connected');
        this.updateDebug('✅ Connected to Together.ai server: ' + this.socket.id);
        
        // Test the connection by sending a ping
        this.socket.emit('ping', { timestamp: Date.now() });
      });

      this.socket.on('answer', (data) => {
        console.log('📨 Received Together.ai answer:', data);
        this.displayAnswer('🤖 **[Together.ai]** ' + data.answer);
        this.answers.push(data);
        this.updateDebug('📨 Together.ai response: ' + data.answer.substring(0, 50) + '...');
      });

      this.socket.on('pong', (data) => {
        console.log('🏓 Pong received from server:', data);
        this.updateDebug('🏓 Server ping test successful');
      });

      this.socket.on('error', (error) => {
        clearTimeout(connectionTimeout);
        console.error('❌ Socket error:', error);
        this.updateStatus('Ready (Server Error)', 'ready');
        this.updateDebug('❌ Socket error: ' + JSON.stringify(error));
      });

      this.socket.on('disconnect', () => {
        console.log('⚠️ Disconnected from server');
        this.updateStatus('Ready (Disconnected)', 'ready');
        this.updateDebug('⚠️ Disconnected from Together.ai server');
      });

      this.socket.on('connect_error', (error) => {
        clearTimeout(connectionTimeout);
        console.error('❌ Connection error:', error);
        this.updateStatus('Ready (No Server)', 'ready');
        this.updateDebug('❌ Connection error: ' + error.message);
      });

    } catch (error) {
      console.error('❌ Socket initialization error:', error);
      this.updateStatus('Ready (Error)', 'ready');
      this.updateDebug('❌ Init error: ' + error.message);
    }
  }

  toggleListening() {
    if (this.isActive) {
      this.stopListening();
    } else {
      this.startListening();
    }
  }

  startListening() {
    if (this.recognition) {
      this.isActive = true;
      this.recognition.start();
      document.getElementById('toggle-listening').innerHTML = '🛑';
    }
  }

  stopListening() {
    if (this.recognition) {
      this.isActive = false;
      this.recognition.stop();
      document.getElementById('toggle-listening').innerHTML = '🎤';
    }
  }

  updateTranscript(text, confidence = 1.0) {
    this.currentTranscript = text;
    
    const transcriptEl = document.getElementById('live-transcript');
    if (transcriptEl) {
      if (text.trim()) {
        transcriptEl.innerHTML = `<div class="message-bubble transcript-bubble">${this.formatText(text)}</div>`;
      } else {
        transcriptEl.innerHTML = '<div class="placeholder-text">Listening for questions...</div>';
      }
      transcriptEl.scrollTop = transcriptEl.scrollHeight;
    }
    
    // Update confidence indicator
    this.updateConfidenceIndicator(confidence, 'transcript');
  }

  displayAnswer(answer) {
    // Store current question for context tagging
    this.currentQuestion = this.currentTranscript;
    
    // Update both compact and expanded views
    const compactElement = document.getElementById('ai-response-streaming');
    const fullElement = document.getElementById('ai-response-full');
    const legacyElement = document.getElementById('ai-response');
    
    // Add context tags if in expanded mode
    if (!this.overlay.classList.contains('compact-mode')) {
      this.addContextTags(this.currentQuestion || '');
    }
    
    // Format response
    const formattedAnswer = `<div class="message-bubble response-bubble">${this.formatText(answer)}</div>`;
    
    // Stream response if enabled, otherwise show immediately
    if (this.streamResponses && compactElement) {
      this.streamResponseText(answer, compactElement);
    } else if (compactElement) {
      compactElement.innerHTML = formattedAnswer;
    }
    
    if (fullElement) {
      if (this.streamResponses) {
        this.streamResponseText(answer, fullElement);
      } else {
        fullElement.innerHTML = formattedAnswer;
      }
    }
    
    // Legacy support
    if (legacyElement) {
      legacyElement.innerHTML = formattedAnswer;
      legacyElement.scrollTop = legacyElement.scrollHeight;
    }
    
    // Update response confidence indicator
    const isTogetherAI = answer.includes('**[Together.ai]**');
    const isOffline = answer.includes('**[OFFLINE MODE]**');
    
    const sourceElement = document.querySelector('.response-source');
    const confidenceElement = document.getElementById('response-confidence');
    
    if (sourceElement) {
      sourceElement.textContent = 
        isTogetherAI ? 'Together.ai' : isOffline ? 'Offline' : 'Processing...';
    }
    
    if (confidenceElement) {
      confidenceElement.innerHTML = 
        isTogetherAI ? '🟢' : isOffline ? '🔴' : '🟡';
    }
    
    // Add to conversation history
    this.addToHistory(this.currentTranscript, answer);
    
    // Add visual feedback for new answers
    const activeElement = compactElement || legacyElement;
    if (activeElement) {
      activeElement.style.background = 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)';
      setTimeout(() => {
        activeElement.style.background = '';
      }, 1000);
    }
  }

  addToHistory(question, answer) {
    if (!question || !answer) return;
    
    const historyEl = document.getElementById('conversation-list');
    if (historyEl) {
      const timestamp = new Date().toLocaleTimeString();
      const historyItem = document.createElement('div');
      historyItem.className = 'history-item';
      historyItem.innerHTML = `
        <div class="history-timestamp">${timestamp}</div>
        <div class="history-question">
          <strong>Q:</strong> ${this.formatText(question)}
        </div>
        <div class="history-answer">
          <strong>A:</strong> ${this.formatText(answer)}
        </div>
      `;
      historyEl.appendChild(historyItem);
      historyEl.scrollTop = historyEl.scrollHeight;
    }
  }

  formatText(text) {
    if (!text) return '';
    
    // Technical keywords to highlight
    const keywords = [
      'API', 'REST', 'JavaScript', 'Python', 'React', 'Node.js', 'SQL', 'database',
      'Selenium', 'automation', 'testing', 'Docker', 'Kubernetes', 'CI/CD',
      'algorithm', 'data structure', 'debugging', 'performance', 'security',
      'microservices', 'MongoDB', 'PostgreSQL', 'Redis', 'AWS', 'Azure',
      'Git', 'version control', 'agile', 'scrum', 'TypeScript', 'Vue.js'
    ];
    
    let formattedText = text
      .replace(/\n/g, '<br>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Highlight technical keywords
    keywords.forEach(keyword => {
      const regex = new RegExp(`\\b(${keyword})\\b`, 'gi');
      formattedText = formattedText.replace(regex, '<span class="tech-keyword">$1</span>');
    });
    
    return formattedText;
  }

  updateStatus(message, type) {
    const statusEl = document.getElementById('status-indicator');
    if (statusEl) {
      statusEl.textContent = message;
      statusEl.className = `status-${type}`;
    }
  }

  showError(message) {
    console.error('Interview Co-Pilot:', message);
    this.updateStatus(message, 'error');
    this.updateDebug('ERROR: ' + message);
  }

  updateDebug(message) {
    const debugEl = document.getElementById('debug-info');
    if (debugEl) {
      const timestamp = new Date().toLocaleTimeString();
      debugEl.innerHTML += `<div>[${timestamp}] ${message}</div>`;
      debugEl.scrollTop = debugEl.scrollHeight;
    }
  }

  generateFallbackResponse(question) {
    // Show loading indicator
    this.displayAnswer('🤔 Generating offline response...');
    
    // Simulate API delay
    setTimeout(() => {
      // Simple pattern-based responses for common interview questions
      const fallbackResponses = {
        'tell me about yourself': "I'm a passionate software developer with experience in multiple programming languages and frameworks. I enjoy solving complex problems and am always eager to learn new technologies. My background includes working on both frontend and backend development, with a focus on creating user-friendly and efficient solutions.",
        
        'greatest strength': "My greatest strength is my ability to break down complex problems into manageable components. I approach challenges methodically, research thoroughly, and I'm not afraid to ask questions when I need clarification. I also value collaboration and believe that the best solutions come from working together as a team.",
        
        'challenging project': "I recently worked on a project that involved integrating multiple APIs with different authentication methods and data formats. The challenge was ensuring data consistency and handling various edge cases. I solved this by creating a robust middleware layer that standardized the data flow and implemented comprehensive error handling.",
        
        'debugging': "When debugging, I start by reproducing the issue consistently, then use logging and debugging tools to trace the problem. I break down the code into smaller sections to isolate the issue. I also find it helpful to explain the problem to a colleague, as this often leads to new insights.",
        
        'programming languages': "I'm most comfortable with JavaScript, Python, and have experience with frameworks like React, Node.js, and Express. I'm also familiar with databases like MongoDB and PostgreSQL. I believe in choosing the right tool for the job and am always willing to learn new technologies as needed.",
        
        'five years': "In five years, I see myself in a senior development role where I can mentor junior developers and contribute to architectural decisions. I'd like to deepen my expertise in cloud technologies and possibly move into a tech lead position where I can guide project direction and help teams deliver high-quality solutions."
      };
      
      const questionLower = question.toLowerCase();
      let response = null;
      
      // Find matching response
      for (const [key, value] of Object.entries(fallbackResponses)) {
        if (questionLower.includes(key)) {
          response = value;
          break;
        }
      }
      
      // Default response if no match found
      if (!response) {
        response = "That's a great question. Let me think about this systematically. Based on my experience, I would approach this by first understanding the core requirements, then breaking down the problem into smaller, manageable pieces. I believe in taking a methodical approach and leveraging both technical skills and collaborative problem-solving to find the best solution.";
      }
      
      // Display the response with offline indicator
      this.displayAnswer(`🔴 **[OFFLINE MODE]** ${response}`);
      this.updateDebug('💡 Fallback response generated (server unavailable)');
    }, 1500);
  }

  getInterviewContext() {
    // Try to extract context from the page
    const title = document.title;
    const url = window.location.href;
    const meetingInfo = url.includes('meet.google.com') ? 'Google Meet' : 'Zoom';
    
    // Try to get meeting name or room info
    const meetingName = document.querySelector('[data-meeting-title]')?.textContent || 
                       document.querySelector('h1')?.textContent || 
                       'Interview Session';
    
    return `Platform: ${meetingInfo}, Meeting: ${meetingName}, Page: ${title}`;
  }

  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Emergency hide: Ctrl+Shift+H
      if (e.ctrlKey && e.shiftKey && e.key === 'H') {
        e.preventDefault();
        this.emergencyHide();
      }
      
      // Toggle listening: Ctrl+Shift+L
      if (e.ctrlKey && e.shiftKey && e.key === 'L') {
        e.preventDefault();
        this.toggleListening();
      }
      
      // Expand/Collapse: Ctrl+Shift+E
      if (e.ctrlKey && e.shiftKey && e.key === 'E') {
        e.preventDefault();
        this.toggleExpandMode();
      }
      
      // Legacy toggle overlay: Ctrl+Shift+C
      if (e.ctrlKey && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        if (this.overlay.style.display === 'none') {
          this.overlay.style.display = 'block';
        } else {
          this.overlay.style.display = 'none';
        }
      }
    });
  }
}

// Initialize when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOMContentLoaded - initializing Interview Co-Pilot');
    new InterviewCopilot();
  });
} else {
  console.log('📄 Document ready - initializing Interview Co-Pilot');
  new InterviewCopilot();
}

// Fallback initialization after 2 seconds if overlay is not found
setTimeout(() => {
  if (!document.getElementById('interview-copilot-overlay')) {
    console.log('🔄 Fallback initialization - Interview Co-Pilot not found, retrying...');
    new InterviewCopilot();
  }
}, 2000);

// Global function for manual initialization (for debugging)
window.initInterviewCopilot = () => {
  console.log('🔧 Manual initialization triggered');
  const existing = document.getElementById('interview-copilot-overlay');
  if (existing) {
    existing.remove();
  }
  new InterviewCopilot();
};
