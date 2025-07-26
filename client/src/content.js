// Advanced Interview Co-Pilot with enhanced UI/UX
class InterviewCopilotFetch {
  constructor() {
    this.isActive = false;
    this.recognition = null;
    this.overlay = null;
    this.currentTranscript = '';
    this.answers = [];
    this.status = 'initializing';
    this.minConfidence = 0.7;
    this.serverUrl = 'http://localhost:3001';
    this.isExpanded = true; // Default to expanded (full view)
    this.isDragging = false;
    this.isResizing = false;
    this.dragOffset = { x: 0, y: 0 };
    this.currentPosition = { top: 20, right: 20 };
    this.streamResponses = true;
    this.opacity = 0.98;
    this.autoHideTimer = null;
    this.isHidden = false;
    
    // Initialize enhanced features
    this.init();
  }

  async init() {
    console.log('🚀 Interview Co-Pilot starting (Enhanced UI/UX mode)...');
    
    // Load user preferences
    this.loadUserPreferences();
    
    // Test server connection first
    const serverAvailable = await this.testServerConnection();
    
    if (serverAvailable) {
      console.log('✅ Server available - using Together.ai API');
      this.updateStatus('Ready (Together.ai)', 'connected');
    } else {
      console.log('❌ Server unavailable - offline mode only');
      this.updateStatus('Ready (Offline)', 'ready');
    }
    
    this.createAdvancedOverlay();
    this.setupSpeechRecognition();
    this.setupKeyboardShortcuts();
    this.setupAutoHide();
    this.updateStatus('Ready', 'ready');
    
    // Expose for debugging
    window.interviewCopilot = this;
  }

  async testServerConnection() {
    try {
      const response = await fetch(`${this.serverUrl}/health`, {
        method: 'GET',
        timeout: 5000
      });
      return response.ok;
    } catch (error) {
      console.log('Server connection test failed:', error);
      return false;
    }
  }

  async sendToAI(transcript) {
    console.log('📤 Sending to Together.ai via HTTP:', transcript);
    
    try {
      // Show loading
      this.displayAnswer('🤔 Generating AI response via Together.ai...');
      
      const response = await fetch(`${this.serverUrl}/api/generate-answer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: transcript,
          context: this.getInterviewContext(),
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Received AI response:', data);
      
      // Display the response
      this.displayAnswer('🤖 **[Together.ai]** ' + data.answer);
      this.answers.push(data);
      
      return data.answer;
      
    } catch (error) {
      console.error('❌ AI request failed:', error);
      console.log('🔄 Falling back to offline response...');
      this.generateFallbackResponse(transcript);
      return null;
    }
  }

  createAdvancedOverlay() {
    // Remove any existing overlay
    const existingOverlay = document.getElementById('interview-copilot-overlay');
    if (existingOverlay) {
      existingOverlay.remove();
    }

    this.overlay = document.createElement('div');
    this.overlay.id = 'interview-copilot-overlay';
    this.overlay.className = 'expanded-mode'; // Start in expanded mode (default)
    
    // Enhanced styling with React Portal approach - DEFAULT TO EXPANDED SIZE
    this.overlay.style.cssText = `
      position: fixed !important;
      top: ${this.currentPosition.top}px !important;
      right: ${this.currentPosition.right}px !important;
      width: 640px !important;
      min-height: 420px !important;
      max-height: 700px !important;
      background: linear-gradient(135deg, rgba(0, 30, 60, 0.95), rgba(0, 50, 80, 0.95)) !important;
      color: white !important;
      border-radius: 20px !important;
      padding: 0 !important;
      z-index: 2147483647 !important;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif !important;
      font-size: 15px !important;
      box-shadow: 0 16px 60px rgba(0, 0, 0, 0.4), 0 0 0 2px rgba(100, 200, 255, 0.3) !important;
      backdrop-filter: blur(25px) !important;
      border: 2px solid rgba(100, 200, 255, 0.4) !important;
      opacity: ${this.opacity} !important;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
      cursor: move !important;
      overflow-y: auto !important;
      overflow-x: hidden !important;
    `;
    
    this.overlay.innerHTML = `
      <!-- Enhanced Header - Larger and More Prominent -->
      <div class="copilot-header" style="display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; background: rgba(0, 0, 0, 0.3); border-bottom: 2px solid rgba(100, 181, 246, 0.3);">
        <span style="font-weight: 700; font-size: 18px; color: #64B5F6; text-shadow: 0 1px 2px rgba(0,0,0,0.3);">🤖 Interview Co-Pilot Enhanced</span>
        <div class="controls" style="display: flex; gap: 8px;">
          <button id="toggle-listening" class="btn-control" title="Toggle Listening" style="width: 36px; height: 36px; font-size: 16px;">🎤</button>
          <button id="expand-toggle" class="btn-control" title="Collapse to Compact" style="width: 36px; height: 36px; font-size: 16px;">⇱</button>
          <button id="settings-toggle" class="btn-control" title="Settings" style="width: 36px; height: 36px; font-size: 16px;">⚙️</button>
          <button id="emergency-hide" class="btn-control" title="Emergency Hide (Ctrl+Shift+H)" style="width: 36px; height: 36px; font-size: 16px;">👁️</button>
          <button id="close-overlay" class="btn-control" style="width: 36px; height: 36px; font-size: 18px;">×</button>
        </div>
      </div>
      
      <!-- Enhanced Compact Content: Larger AI Response (Hidden by default) -->
      <div class="compact-section" style="display: none; padding: 16px 20px;">
        <div class="ai-response-compact">
          <div class="response-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <span style="font-size: 14px; color: #90CAF9; font-weight: 600;">🤖 AI Response</span>
            <div class="response-indicators" style="display: flex; align-items: center; gap: 8px;">
              <span id="response-confidence" class="confidence-indicator" style="font-size: 16px;">🟢</span>
              <span class="response-source" style="font-size: 12px; color: #B0BEC5; font-weight: 500;">Together.ai</span>
            </div>
          </div>
          <div id="ai-response-streaming" class="response-text-streaming" style="
            background: rgba(100, 181, 246, 0.15); 
            padding: 16px; 
            border-radius: 12px; 
            min-height: 120px; 
            max-height: 320px; 
            overflow-y: auto; 
            font-size: 15px; 
            line-height: 1.5;
            border: 2px solid rgba(100, 181, 246, 0.3);
            scrollbar-width: thin;
            color: #E8F4FD;
            font-weight: 400;
          ">Ready to assist with your interview questions...</div>
        </div>
      </div>
      
      <!-- Enhanced Expanded Mode: Full Interface (Shown by default) -->
      <div class="expanded-section" style="display: block; padding: 20px; overflow-y: auto; max-height: calc(100vh - 200px);">
        <div class="chat-container" style="overflow-y: auto;">
          <!-- Live Transcription Section -->
          <div class="transcript-section" style="margin-bottom: 20px;">
            <div class="section-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
              <h4 style="margin: 0; font-size: 15px; color: #90CAF9; font-weight: 600;">🎤 Live Transcript</h4>
              <div class="transcript-confidence" style="display: flex; align-items: center; gap: 6px;">
                <span id="transcript-confidence" class="confidence-indicator" style="font-size: 16px;">🟢</span>
                <span class="confidence-text" style="font-size: 13px; color: #B0BEC5; font-weight: 500;">High</span>
              </div>
            </div>
            <div id="live-transcript" class="transcript-text" style="
              background: rgba(255, 255, 255, 0.1); 
              padding: 16px; 
              border-radius: 10px; 
              min-height: 100px; 
              max-height: 200px;
              overflow-y: auto;
              font-family: 'SF Mono', 'Monaco', 'Consolas', monospace; 
              font-size: 14px; 
              color: #E3F2FD;
              border: 2px solid rgba(255, 255, 255, 0.2);
              line-height: 1.4;
              scrollbar-width: thin;
            ">Listening for interview questions...</div>
          </div>
          
          <!-- AI Response Section -->
          <div class="answer-section">
            <div class="section-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
              <h4 style="margin: 0; font-size: 15px; color: #90CAF9; font-weight: 600;">🤖 AI Response</h4>
              <div class="context-tags" id="context-tags" style="display: flex; gap: 6px; flex-wrap: wrap;"></div>
            </div>
            <div id="ai-response-full" class="response-text" style="
              background: rgba(100, 181, 246, 0.15); 
              padding: 18px; 
              border-radius: 12px; 
              min-height: 150px; 
              max-height: 500px; 
              overflow-y: auto; 
              font-size: 15px; 
              line-height: 1.6;
              border: 2px solid rgba(100, 181, 246, 0.3);
              color: #E8F4FD;
              font-weight: 400;
            ">Ready to assist with your interview questions...</div>
            
            <!-- Suggested Follow-ups -->
            <div class="suggested-followups" id="suggested-followups" style="display: none; margin-top: 16px;">
              <h5 style="margin: 0 0 10px 0; font-size: 14px; color: #90CAF9; font-weight: 600;">💡 Suggested Follow-ups:</h5>
              <div class="followup-chips" style="display: flex; gap: 8px; flex-wrap: wrap;"></div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Settings Panel -->
      <div class="settings-panel" style="display: none; position: absolute; top: 100%; right: 0; width: 320px; background: rgba(0, 20, 40, 0.98); border-radius: 12px; padding: 16px; margin-top: 8px; border: 1px solid rgba(100, 181, 246, 0.3); box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);">
        <h4 style="margin: 0 0 16px 0; color: #64B5F6; font-size: 16px;">⚙️ Settings</h4>
        
        <div class="setting-item" style="margin-bottom: 12px;">
          <label style="display: block; margin-bottom: 4px; font-size: 12px; color: #90CAF9;">API Key:</label>
          <input type="password" id="api-key-input" placeholder="Enter Together.ai API key" style="width: 100%; padding: 8px; border-radius: 4px; border: 1px solid rgba(255, 255, 255, 0.2); background: rgba(255, 255, 255, 0.1); color: white; font-size: 12px;">
        </div>
        
        <div class="setting-item" style="margin-bottom: 12px;">
          <label style="display: block; margin-bottom: 4px; font-size: 12px; color: #90CAF9;">Model:</label>
          <select id="model-select" style="width: 100%; padding: 8px; border-radius: 4px; border: 1px solid rgba(255, 255, 255, 0.2); background: rgba(255, 255, 255, 0.1); color: white; font-size: 12px;">
            <option value="mistralai/Mixtral-8x7B-Instruct-v0.1">Mixtral 8x7B</option>
            <option value="meta-llama/Llama-2-70b-chat-hf">LLaMA 2 70B</option>
          </select>
        </div>
        
        <div class="setting-item" style="margin-bottom: 12px;">
          <label style="display: block; margin-bottom: 4px; font-size: 12px; color: #90CAF9;">Opacity:</label>
          <div style="display: flex; align-items: center; gap: 8px;">
            <input type="range" id="opacity-slider" min="50" max="100" value="98" style="flex: 1;">
            <span id="opacity-value" style="font-size: 12px; color: #B0BEC5; min-width: 35px;">98%</span>
          </div>
        </div>
        
        <div class="setting-checkboxes" style="display: flex; flex-direction: column; gap: 8px;">
          <label style="display: flex; align-items: center; gap: 8px; font-size: 12px; color: #90CAF9; cursor: pointer;">
            <input type="checkbox" id="show-confidence" checked style="margin: 0;">
            Show Confidence Indicators
          </label>
          <label style="display: flex; align-items: center; gap: 8px; font-size: 12px; color: #90CAF9; cursor: pointer;">
            <input type="checkbox" id="stream-responses" checked style="margin: 0;">
            Stream Responses
          </label>
          <label style="display: flex; align-items: center; gap: 8px; font-size: 12px; color: #90CAF9; cursor: pointer;">
            <input type="checkbox" id="auto-hide-mode" style="margin: 0;">
            Auto-hide when inactive
          </label>
        </div>
      </div>
      
      <!-- Status Bar -->
      <div class="status-section" style="padding: 8px 16px; background: rgba(0, 0, 0, 0.3); border-top: 1px solid rgba(255, 255, 255, 0.1); display: flex; justify-content: space-between; align-items: center;">
        <span id="status-indicator" class="status-text" style="font-size: 11px; color: #B0BEC5;">Ready</span>
        <div class="position-controls" style="display: flex; gap: 4px;">
          <button id="dock-left" class="btn-dock" title="Dock Left">◐</button>
          <button id="dock-right" class="btn-dock" title="Dock Right">◑</button>
        </div>
      </div>
      
      <!-- Resize Handle at Bottom -->
      <div id="resize-handle" class="resize-handle" style="
        position: absolute; 
        bottom: 0; 
        left: 0; 
        right: 0; 
        height: 8px; 
        background: linear-gradient(to bottom, transparent, rgba(100, 181, 246, 0.3));
        cursor: ns-resize; 
        border-radius: 0 0 20px 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
      " title="Drag to resize height">
        <div style="
          width: 30px; 
          height: 3px; 
          background: rgba(100, 181, 246, 0.5); 
          border-radius: 2px;
          box-shadow: 0 1px 2px rgba(0,0,0,0.2);
        "></div>
      </div>
    `;

    // Use React Portal-style rendering
    document.body.appendChild(this.overlay);
    
    // Restore saved height if available
    if (this.savedHeight && this.savedHeight > (this.isExpanded ? 420 : 280)) {
      this.overlay.style.height = this.savedHeight + 'px';
      this.overlay.style.maxHeight = this.savedHeight + 'px';
    }
    
    // Setup all event handlers
    this.setupOverlayEvents();
    this.setupDragAndDrop();
    this.applyButtonStyles();
  }

  setupOverlayEvents() {
    // Toggle listening
    document.getElementById('toggle-listening').addEventListener('click', () => {
      this.toggleListening();
    });

    // Expand/collapse toggle
    document.getElementById('expand-toggle').addEventListener('click', () => {
      this.toggleExpandMode();
    });

    // Settings panel toggle
    document.getElementById('settings-toggle').addEventListener('click', () => {
      this.toggleSettings();
    });

    // Emergency hide
    document.getElementById('emergency-hide').addEventListener('click', () => {
      this.emergencyHide();
    });

    // Close overlay
    document.getElementById('close-overlay').addEventListener('click', () => {
      this.overlay.style.display = 'none';
    });

    // Settings controls
    document.getElementById('opacity-slider').addEventListener('input', (e) => {
      this.opacity = e.target.value / 100;
      this.overlay.style.opacity = this.opacity;
      document.getElementById('opacity-value').textContent = e.target.value + '%';
      this.saveUserPreferences();
    });

    document.getElementById('show-confidence').addEventListener('change', (e) => {
      this.showConfidence = e.target.checked;
      this.saveUserPreferences();
    });

    document.getElementById('stream-responses').addEventListener('change', (e) => {
      this.streamResponses = e.target.checked;
      this.saveUserPreferences();
    });

    document.getElementById('auto-hide-mode').addEventListener('change', (e) => {
      this.autoHideEnabled = e.target.checked;
      this.saveUserPreferences();
      if (e.target.checked) {
        this.setupAutoHide();
      } else {
        this.clearAutoHideTimer();
      }
    });

    // Dock controls
    document.getElementById('dock-left').addEventListener('click', () => {
      this.dockToSide('left');
    });

    document.getElementById('dock-right').addEventListener('click', () => {
      this.dockToSide('right');
    });

    // Hover effects for auto-hide
    this.overlay.addEventListener('mouseenter', () => {
      this.clearAutoHideTimer();
      this.overlay.style.opacity = this.opacity;
    });

    this.overlay.addEventListener('mouseleave', () => {
      if (this.autoHideEnabled) {
        this.startAutoHideTimer();
      }
    });
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
      
      // Expand mode: Ctrl+Shift+E
      if (e.ctrlKey && e.shiftKey && e.key === 'E') {
        e.preventDefault();
        this.toggleExpandMode();
      }
    });
  }

  setupDragAndDrop() {
    const header = this.overlay.querySelector('.copilot-header');
    const resizeHandle = this.overlay.querySelector('#resize-handle');
    
    // Setup header dragging
    header.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this.dragOffset.x = e.clientX - this.overlay.offsetLeft;
      this.dragOffset.y = e.clientY - this.overlay.offsetTop;
      
      document.addEventListener('mousemove', this.handleDrag.bind(this));
      document.addEventListener('mouseup', this.handleDragEnd.bind(this));
      
      e.preventDefault();
    });
    
    // Setup resize handle
    resizeHandle.addEventListener('mousedown', (e) => {
      this.isResizing = true;
      this.initialHeight = this.overlay.offsetHeight;
      this.initialMouseY = e.clientY;
      
      document.addEventListener('mousemove', this.handleResize.bind(this));
      document.addEventListener('mouseup', this.handleResizeEnd.bind(this));
      
      e.preventDefault();
      e.stopPropagation(); // Prevent header drag
    });
    
    // Enhanced resize handle visual feedback
    resizeHandle.addEventListener('mouseenter', () => {
      resizeHandle.style.background = 'linear-gradient(to bottom, transparent, rgba(100, 181, 246, 0.5))';
      resizeHandle.querySelector('div').style.background = 'rgba(100, 181, 246, 0.8)';
    });
    
    resizeHandle.addEventListener('mouseleave', () => {
      if (!this.isResizing) {
        resizeHandle.style.background = 'linear-gradient(to bottom, transparent, rgba(100, 181, 246, 0.3))';
        resizeHandle.querySelector('div').style.background = 'rgba(100, 181, 246, 0.5)';
      }
    });
  }

  handleDrag(e) {
    if (!this.isDragging) return;
    
    const newX = e.clientX - this.dragOffset.x;
    const newY = e.clientY - this.dragOffset.y;
    
    // Keep within viewport bounds
    const maxX = window.innerWidth - this.overlay.offsetWidth;
    const maxY = window.innerHeight - this.overlay.offsetHeight;
    
    const boundedX = Math.max(0, Math.min(newX, maxX));
    const boundedY = Math.max(0, Math.min(newY, maxY));
    
    this.overlay.style.left = boundedX + 'px';
    this.overlay.style.top = boundedY + 'px';
    this.overlay.style.right = 'auto';
    
    this.currentPosition = { top: boundedY, left: boundedX };
  }

  handleDragEnd() {
    this.isDragging = false;
    document.removeEventListener('mousemove', this.handleDrag);
    document.removeEventListener('mouseup', this.handleDragEnd);
    
    // Auto-dock to edges if close enough
    this.autoDockToEdges();
    this.saveUserPreferences();
  }

  handleResize(e) {
    if (!this.isResizing) return;
    
    const deltaY = e.clientY - this.initialMouseY;
    const newHeight = this.initialHeight + deltaY;
    
    // Set minimum and maximum height constraints
    const minHeight = this.isExpanded ? 420 : 280;
    const maxHeight = window.innerHeight - 100; // Leave some space from screen edges
    
    const boundedHeight = Math.max(minHeight, Math.min(newHeight, maxHeight));
    
    // Update overlay height
    this.overlay.style.height = boundedHeight + 'px';
    this.overlay.style.maxHeight = boundedHeight + 'px';
    
    // Update container heights for better content flow
    const compactSection = this.overlay.querySelector('.compact-section');
    const expandedSection = this.overlay.querySelector('.expanded-section');
    
    if (this.isExpanded && expandedSection.style.display !== 'none') {
      // In expanded mode, adjust content areas
      const headerHeight = 70; // Approximate header height
      const statusHeight = 40; // Approximate status bar height
      const availableHeight = boundedHeight - headerHeight - statusHeight - 40; // Padding
      
      expandedSection.style.maxHeight = availableHeight + 'px';
      expandedSection.style.overflowY = 'auto';
    } else {
      // In compact mode, adjust AI response area
      const headerHeight = 70;
      const statusHeight = 40;
      const availableHeight = boundedHeight - headerHeight - statusHeight - 40;
      
      const responseArea = compactSection.querySelector('#ai-response-streaming');
      if (responseArea) {
        responseArea.style.maxHeight = Math.max(120, availableHeight - 60) + 'px';
      }
    }
  }

  handleResizeEnd() {
    this.isResizing = false;
    document.removeEventListener('mousemove', this.handleResize);
    document.removeEventListener('mouseup', this.handleResizeEnd);
    
    // Reset resize handle appearance
    const resizeHandle = this.overlay.querySelector('#resize-handle');
    resizeHandle.style.background = 'linear-gradient(to bottom, transparent, rgba(100, 181, 246, 0.3))';
    resizeHandle.querySelector('div').style.background = 'rgba(100, 181, 246, 0.5)';
    
    this.saveUserPreferences();
  }

  autoDockToEdges() {
    const rect = this.overlay.getBoundingClientRect();
    const snapDistance = 50;
    
    // Dock to left edge
    if (rect.left < snapDistance) {
      this.dockToSide('left');
    }
    // Dock to right edge
    else if (window.innerWidth - rect.right < snapDistance) {
      this.dockToSide('right');
    }
  }

  dockToSide(side) {
    if (side === 'left') {
      this.overlay.style.left = '20px';
      this.overlay.style.right = 'auto';
      this.currentPosition = { top: this.currentPosition.top || 20, left: 20 };
    } else {
      this.overlay.style.right = '20px';
      this.overlay.style.left = 'auto';
      this.currentPosition = { top: this.currentPosition.top || 20, right: 20 };
    }
    this.saveUserPreferences();
  }

  toggleExpandMode() {
    this.isExpanded = !this.isExpanded;
    
    const compactSection = this.overlay.querySelector('.compact-section');
    const expandedSection = this.overlay.querySelector('.expanded-section');
    const expandButton = document.getElementById('expand-toggle');
    
    if (this.isExpanded) {
      compactSection.style.display = 'none';
      expandedSection.style.display = 'block';
      this.overlay.style.minHeight = '400px';
      this.overlay.style.width = '450px';
      expandButton.textContent = '⇱';
      expandButton.title = 'Collapse to compact mode';
    } else {
      compactSection.style.display = 'block';
      expandedSection.style.display = 'none';
      this.overlay.style.minHeight = '160px';
      this.overlay.style.width = '380px';
      expandButton.textContent = '⇲';
      expandButton.title = 'Expand to full mode';
    }
    
    this.saveUserPreferences();
  }

  toggleSettings() {
    const settingsPanel = this.overlay.querySelector('.settings-panel');
    const isVisible = settingsPanel.style.display !== 'none';
    settingsPanel.style.display = isVisible ? 'none' : 'block';
  }

  emergencyHide() {
    this.isHidden = !this.isHidden;
    this.overlay.style.display = this.isHidden ? 'none' : 'block';
    
    if (!this.isHidden) {
      // Flash briefly to confirm it's back
      this.overlay.style.opacity = '1';
      setTimeout(() => {
        this.overlay.style.opacity = this.opacity;
      }, 200);
    }
  }

  setupAutoHide() {
    this.autoHideEnabled = true;
    this.startAutoHideTimer();
  }

  startAutoHideTimer() {
    this.clearAutoHideTimer();
    this.autoHideTimer = setTimeout(() => {
      if (!this.isActive && this.autoHideEnabled) {
        this.overlay.style.opacity = '0.3';
      }
    }, 5000); // Hide after 5 seconds of inactivity
  }

  clearAutoHideTimer() {
    if (this.autoHideTimer) {
      clearTimeout(this.autoHideTimer);
      this.autoHideTimer = null;
    }
  }

  applyButtonStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .btn-control {
        background: rgba(255, 255, 255, 0.15) !important;
        border: 2px solid rgba(255, 255, 255, 0.3) !important;
        color: white !important;
        padding: 8px 12px !important;
        border-radius: 10px !important;
        cursor: pointer !important;
        font-size: 16px !important;
        transition: all 0.3s ease !important;
        min-width: 40px !important;
        height: 40px !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        font-weight: 600 !important;
        text-shadow: 0 1px 2px rgba(0,0,0,0.3) !important;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2) !important;
      }
      
      .btn-control:hover {
        background: rgba(100, 181, 246, 0.4) !important;
        transform: translateY(-2px) scale(1.05) !important;
        box-shadow: 0 4px 16px rgba(100, 181, 246, 0.3) !important;
        border-color: rgba(100, 181, 246, 0.6) !important;
      }
      
      .btn-control:active {
        transform: translateY(-1px) scale(1.02) !important;
        box-shadow: 0 2px 8px rgba(100, 181, 246, 0.4) !important;
      }
      
      .btn-dock {
        background: rgba(255, 255, 255, 0.15) !important;
        border: 1px solid rgba(255, 255, 255, 0.2) !important;
        color: #90CAF9 !important;
        padding: 6px 12px !important;
        border-radius: 6px !important;
        cursor: pointer !important;
        font-size: 12px !important;
        transition: all 0.2s ease !important;
        font-weight: 600 !important;
      }
      
      .btn-dock:hover {
        background: rgba(100, 181, 246, 0.3) !important;
        transform: translateY(-1px) !important;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2) !important;
      }
      
      .confidence-indicator {
        font-size: 16px !important;
        margin-right: 6px !important;
        filter: drop-shadow(0 1px 2px rgba(0,0,0,0.3)) !important;
      }
      
      .context-tag {
        background: rgba(100, 181, 246, 0.25) !important;
        color: #64B5F6 !important;
        padding: 4px 10px !important;
        border-radius: 16px !important;
        font-size: 12px !important;
        font-weight: 600 !important;
        border: 1px solid rgba(100, 181, 246, 0.4) !important;
        text-shadow: 0 1px 2px rgba(0,0,0,0.2) !important;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1) !important;
      }
      
      /* Scrollbar Styling */
      .response-text-streaming::-webkit-scrollbar,
      .response-text::-webkit-scrollbar,
      .transcript-text::-webkit-scrollbar {
        width: 8px !important;
      }
      
      .response-text-streaming::-webkit-scrollbar-track,
      .response-text::-webkit-scrollbar-track,
      .transcript-text::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.1) !important;
        border-radius: 4px !important;
      }
      
      .response-text-streaming::-webkit-scrollbar-thumb,
      .response-text::-webkit-scrollbar-thumb,
      .transcript-text::-webkit-scrollbar-thumb {
        background: rgba(100, 181, 246, 0.5) !important;
        border-radius: 4px !important;
      }
      
      .response-text-streaming::-webkit-scrollbar-thumb:hover,
      .response-text::-webkit-scrollbar-thumb:hover,
      .transcript-text::-webkit-scrollbar-thumb:hover {
        background: rgba(100, 181, 246, 0.7) !important;
      }
      
      /* Resize Handle Styling */
      .resize-handle {
        user-select: none !important;
        z-index: 10 !important;
      }
      
      .resize-handle:hover {
        background: linear-gradient(to bottom, transparent, rgba(100, 181, 246, 0.5)) !important;
      }
      
      .resize-handle:active {
        background: linear-gradient(to bottom, transparent, rgba(100, 181, 246, 0.7)) !important;
      }
      
      /* Overlay positioning for resize */
      #interview-copilot-overlay {
        position: relative !important;
      }
    `;
    document.head.appendChild(style);
  }

  toggleExpandMode() {
    const compactSection = this.overlay.querySelector('.compact-section');
    const expandedSection = this.overlay.querySelector('.expanded-section');
    const expandButton = document.getElementById('expand-toggle');
    
    this.isExpanded = !this.isExpanded;
    
    if (this.isExpanded) {
      // Switch to expanded mode - show full interface
      compactSection.style.display = 'none';
      expandedSection.style.display = 'block';
      this.overlay.style.width = '640px';
      this.overlay.style.minHeight = '420px';
      this.overlay.style.maxHeight = '700px';
      expandButton.textContent = '⇱';
      expandButton.title = 'Collapse to Compact';
      
      // Copy AI response to expanded view
      const compactResponse = document.getElementById('ai-response-streaming').innerHTML;
      document.getElementById('ai-response-full').innerHTML = compactResponse;
      
    } else {
      // Switch to compact mode - minimal interface
      compactSection.style.display = 'block';
      expandedSection.style.display = 'none';
      this.overlay.style.width = '520px';
      this.overlay.style.minHeight = '280px';
      this.overlay.style.maxHeight = '600px';
      expandButton.textContent = '⇲';
      expandButton.title = 'Expand to Full';
      
      // Copy AI response back to compact view
      const expandedResponse = document.getElementById('ai-response-full').innerHTML;
      document.getElementById('ai-response-streaming').innerHTML = expandedResponse;
    }
    
    this.saveUserPreferences();
  }

  setupSpeechRecognition() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.error('Speech recognition not supported');
      this.updateStatus('Speech recognition not supported', 'error');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';

    this.recognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';
      let highestConfidence = 0;

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;
        const confidence = result[0].confidence || 0.8;

        if (result.isFinal) {
          finalTranscript += transcript + ' ';
          highestConfidence = Math.max(highestConfidence, confidence);
        } else {
          interimTranscript += transcript;
        }
      }

      // Update transcript display with confidence
      const displayTranscript = finalTranscript || interimTranscript;
      this.currentTranscript = displayTranscript;
      this.updateTranscript(displayTranscript, highestConfidence);

      // Process high-quality final transcripts
      if (finalTranscript.trim() && highestConfidence >= this.minConfidence) {
        const cleanTranscript = finalTranscript.trim();
        console.log('Processing transcript:', cleanTranscript, 'Confidence:', highestConfidence);
        this.sendToAI(cleanTranscript);
      } else if (finalTranscript.trim() && highestConfidence < this.minConfidence) {
        // Show warning for low confidence
        this.displayAnswer('⚠️ Low audio quality detected. Please repeat your question clearly.');
      }
    };

    this.recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      this.updateStatus('Error: ' + event.error, 'error');
    };

    this.recognition.onend = () => {
      if (this.isActive) {
        setTimeout(() => this.recognition.start(), 1000);
      }
    };
  }

  toggleListening() {
    if (this.isActive) {
      this.stopListening();
    } else {
      this.startListening();
    }
  }

  startListening() {
    console.log('🎤 Starting speech recognition...');
    this.isActive = true;
    this.recognition.start();
    this.updateStatus('Listening...', 'listening');
    
    const button = document.getElementById('toggle-listening');
    button.style.background = '#f44336';
    button.textContent = '🛑';
  }

  stopListening() {
    console.log('🛑 Stopping speech recognition...');
    this.isActive = false;
    this.recognition.stop();
    this.updateStatus('Ready', 'ready');
    
    const button = document.getElementById('toggle-listening');
    button.style.background = '#4CAF50';
    button.textContent = '🎤';
  }

  updateTranscript(transcript, confidence = 0.8) {
    const element = document.getElementById('live-transcript');
    if (element) {
      element.textContent = transcript || 'Listening for questions...';
      
      // Update confidence indicator
      this.updateConfidenceIndicator(confidence, 'transcript');
      
      // Add visual feedback for confidence
      if (confidence < 0.6) {
        element.style.borderLeft = '3px solid #f44336';
      } else if (confidence < 0.8) {
        element.style.borderLeft = '3px solid #ff9800';
      } else {
        element.style.borderLeft = '3px solid #4CAF50';
      }
    }
  }

  displayAnswer(answer) {
    console.log('📝 Displaying answer with streaming:', answer);
    
    // Update both compact and expanded views
    const compactElement = document.getElementById('ai-response-streaming');
    const fullElement = document.getElementById('ai-response-full');
    
    // Add context tags
    this.addContextTags(this.currentTranscript || '');
    
    // Format response with enhanced styling
    const formattedAnswer = this.formatTextWithHighlighting(answer);
    
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
    
    // Update response confidence indicator
    const isTogetherAI = answer.includes('**[Together.ai]**');
    const isOffline = answer.includes('**[OFFLINE MODE]**');
    
    this.updateConfidenceIndicator(
      isTogetherAI ? 1.0 : isOffline ? 0.5 : 0.8, 
      'response'
    );
    
    // Auto-hide timer reset
    this.clearAutoHideTimer();
    if (this.autoHideEnabled) {
      this.startAutoHideTimer();
    }
  }

  streamResponseText(text, element) {
    // Clear existing content
    element.innerHTML = '';
    
    // Remove formatting markers for streaming
    const cleanText = text.replace(/\*\*(.*?)\*\*/g, '$1');
    const words = cleanText.split(' ');
    let currentIndex = 0;
    
    const streamInterval = setInterval(() => {
      if (currentIndex < words.length) {
        const currentText = words.slice(0, currentIndex + 1).join(' ');
        element.innerHTML = this.formatTextWithHighlighting(currentText);
        element.scrollTop = element.scrollHeight;
        currentIndex++;
      } else {
        clearInterval(streamInterval);
        // Final formatting pass
        element.innerHTML = this.formatTextWithHighlighting(text);
      }
    }, 100); // Stream at ~10 words per second
  }

  formatTextWithHighlighting(text) {
    // Enhanced text formatting with syntax highlighting
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong style="color: #64B5F6;">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em style="color: #90CAF9;">$1</em>')
      .replace(/`(.*?)`/g, '<code style="background: rgba(255,255,255,0.15); color: #A5D6A7; padding: 2px 6px; border-radius: 4px; font-family: \'SF Mono\', monospace;">$1</code>')
      .replace(/\n/g, '<br>')
      // Highlight technical keywords
      .replace(/\b(JavaScript|Python|React|API|SQL|HTML|CSS|Node\.js|REST|GraphQL|MongoDB|PostgreSQL|Docker|Kubernetes|AWS|Git|CI\/CD|Agile|Scrum)\b/gi, 
        '<span style="background: rgba(100, 181, 246, 0.2); color: #64B5F6; padding: 1px 4px; border-radius: 3px; font-weight: 500;">$1</span>')
      // Highlight Selenium-specific terms
      .replace(/\b(Selenium|WebDriver|TestNG|JUnit|Maven|Gradle|Page Object|automation|testing|framework)\b/gi, 
        '<span style="background: rgba(129, 199, 132, 0.2); color: #81C784; padding: 1px 4px; border-radius: 3px; font-weight: 500;">$1</span>');
  }

  addContextTags(transcript) {
    const contextContainer = document.getElementById('context-tags');
    if (!contextContainer) return;
    
    contextContainer.innerHTML = '';
    
    const tags = this.detectContextTags(transcript);
    tags.forEach(tag => {
      const tagElement = document.createElement('span');
      tagElement.className = 'context-tag';
      tagElement.textContent = tag;
      contextContainer.appendChild(tagElement);
    });
  }

  detectContextTags(text) {
    const tags = [];
    const lowerText = text.toLowerCase();
    
    // Technical categories
    if (lowerText.includes('api') || lowerText.includes('endpoint') || lowerText.includes('rest')) {
      tags.push('#API');
    }
    if (lowerText.includes('selenium') || lowerText.includes('automation') || lowerText.includes('testing')) {
      tags.push('#Selenium');
    }
    if (lowerText.includes('javascript') || lowerText.includes('react') || lowerText.includes('frontend')) {
      tags.push('#Frontend');
    }
    if (lowerText.includes('database') || lowerText.includes('sql') || lowerText.includes('query')) {
      tags.push('#Database');
    }
    if (lowerText.includes('experience') || lowerText.includes('background') || lowerText.includes('yourself')) {
      tags.push('#Behavioral');
    }
    if (lowerText.includes('challenge') || lowerText.includes('difficult') || lowerText.includes('problem')) {
      tags.push('#Problem-Solving');
    }
    if (lowerText.includes('edge case') || lowerText.includes('error') || lowerText.includes('exception')) {
      tags.push('#EdgeCase');
    }
    
    return tags.slice(0, 3); // Limit to 3 tags
  }

  updateConfidenceIndicator(confidence, type = 'transcript') {
    const indicatorId = type === 'transcript' ? 'transcript-confidence' : 'response-confidence';
    const indicator = document.getElementById(indicatorId);
    
    if (!indicator) return;
    
    if (confidence >= 0.8) {
      indicator.textContent = '🟢';
      if (type === 'transcript') {
        document.querySelector('.confidence-text').textContent = 'High';
      }
    } else if (confidence >= 0.6) {
      indicator.textContent = '🟡';
      if (type === 'transcript') {
        document.querySelector('.confidence-text').textContent = 'Medium';
      }
    } else {
      indicator.textContent = '🔴';
      if (type === 'transcript') {
        document.querySelector('.confidence-text').textContent = 'Low';
      }
    }
  }

  loadUserPreferences() {
    try {
      const saved = localStorage.getItem('interview-copilot-preferences');
      if (saved) {
        const prefs = JSON.parse(saved);
        this.opacity = prefs.opacity || 0.98;
        this.isExpanded = prefs.isExpanded !== undefined ? prefs.isExpanded : true; // Default to expanded
        this.streamResponses = prefs.streamResponses !== false;
        this.autoHideEnabled = prefs.autoHideEnabled || false;
        this.currentPosition = prefs.position || { top: 20, right: 20 };
        this.showConfidence = prefs.showConfidence !== false;
        this.savedHeight = prefs.overlayHeight;
      }
    } catch (error) {
      console.log('Could not load preferences:', error);
    }
  }

  saveUserPreferences() {
    try {
      const prefs = {
        opacity: this.opacity,
        isExpanded: this.isExpanded,
        streamResponses: this.streamResponses,
        autoHideEnabled: this.autoHideEnabled,
        position: this.currentPosition,
        showConfidence: this.showConfidence,
        overlayHeight: this.overlay ? this.overlay.offsetHeight : null
      };
      localStorage.setItem('interview-copilot-preferences', JSON.stringify(prefs));
    } catch (error) {
      console.log('Could not save preferences:', error);
    }
  }

  updateStatus(status, type = 'info') {
    this.status = status;
    const element = document.getElementById('status-text');
    if (element) {
      element.textContent = status;
      element.style.color = type === 'error' ? '#f44336' : 
                           type === 'listening' ? '#4CAF50' : 
                           type === 'connected' ? '#2196F3' : '#888';
    }
  }

  formatText(text) {
    // Basic formatting for markdown-like text
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code style="background: rgba(255,255,255,0.1); padding: 2px 4px; border-radius: 3px;">$1</code>')
      .replace(/\n/g, '<br>');
  }

  getInterviewContext() {
    const url = window.location.href;
    if (url.includes('meet.google.com')) return 'Google Meet interview';
    if (url.includes('zoom.us')) return 'Zoom interview';
    return 'General interview';
  }

  generateFallbackResponse(transcript) {
    this.displayAnswer('🔴 **[OFFLINE MODE]** I understand you\'re asking about "' + transcript + '". Please check your server connection for AI responses.');
  }
}

// Initialize when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new InterviewCopilotFetch();
  });
} else {
  new InterviewCopilotFetch();
}
