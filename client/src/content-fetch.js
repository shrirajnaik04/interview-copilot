// Alternative content script using Fetch API instead of Socket.IO
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
    
    // Initialize without Socket.IO
    this.init();
  }

  async init() {
    console.log('🚀 Interview Co-Pilot starting (Fetch API mode)...');
    
    // Test server connection first
    const serverAvailable = await this.testServerConnection();
    
    if (serverAvailable) {
      console.log('✅ Server available - using Together.ai API');
      this.updateStatus('Ready (Together.ai)', 'connected');
    } else {
      console.log('❌ Server unavailable - offline mode only');
      this.updateStatus('Ready (Offline)', 'ready');
    }
    
    this.createOverlay();
    this.setupSpeechRecognition();
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

  createOverlay() {
    // Remove any existing overlay
    const existingOverlay = document.getElementById('interview-copilot-overlay');
    if (existingOverlay) {
      existingOverlay.remove();
    }

    this.overlay = document.createElement('div');
    this.overlay.id = 'interview-copilot-overlay';
    this.overlay.className = 'compact-mode';
    
    // Ensure it appears on top
    this.overlay.style.cssText = `
      position: fixed !important;
      top: 20px !important;
      right: 20px !important;
      width: 380px !important;
      min-height: 160px !important;
      background: rgba(0, 0, 0, 0.95) !important;
      color: white !important;
      border-radius: 12px !important;
      padding: 15px !important;
      z-index: 2147483647 !important;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
      font-size: 14px !important;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3) !important;
      backdrop-filter: blur(10px) !important;
      border: 1px solid rgba(255, 255, 255, 0.1) !important;
    `;
    
    this.overlay.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
        <span style="font-weight: bold;">🤖 Interview Co-Pilot</span>
        <div>
          <button id="toggle-listening" style="background: #4CAF50; border: none; color: white; padding: 8px 12px; border-radius: 6px; cursor: pointer; margin-right: 5px;">🎤</button>
          <button id="expand-toggle" style="background: #2196F3; border: none; color: white; padding: 8px 12px; border-radius: 6px; cursor: pointer;">⇲</button>
        </div>
      </div>
      
      <div id="transcript-section" style="margin-bottom: 10px; display: none;">
        <div style="font-size: 12px; color: #ccc; margin-bottom: 5px;">🎤 Transcript:</div>
        <div id="live-transcript" style="background: rgba(255, 255, 255, 0.1); padding: 8px; border-radius: 6px; min-height: 30px;">Listening...</div>
      </div>
      
      <div id="response-section">
        <div style="font-size: 12px; color: #ccc; margin-bottom: 5px;">🤖 AI Response:</div>
        <div id="ai-response" style="background: rgba(0, 150, 255, 0.1); padding: 10px; border-radius: 6px; min-height: 60px; max-height: 200px; overflow-y: auto;">Ready to assist with your interview...</div>
      </div>
      
      <div id="status-section" style="margin-top: 10px; font-size: 12px; color: #888; text-align: center;">
        <span id="status-text">Ready</span>
      </div>
    `;

    document.body.appendChild(this.overlay);
    this.setupOverlayEvents();
  }

  setupOverlayEvents() {
    document.getElementById('toggle-listening').addEventListener('click', () => {
      this.toggleListening();
    });

    document.getElementById('expand-toggle').addEventListener('click', () => {
      this.toggleExpandMode();
    });
  }

  toggleExpandMode() {
    const transcriptSection = document.getElementById('transcript-section');
    const isExpanded = transcriptSection.style.display !== 'none';
    
    transcriptSection.style.display = isExpanded ? 'none' : 'block';
    
    if (isExpanded) {
      this.overlay.style.minHeight = '160px';
    } else {
      this.overlay.style.minHeight = '280px';
    }
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

      // Update transcript display
      const displayTranscript = finalTranscript || interimTranscript;
      this.currentTranscript = displayTranscript;
      this.updateTranscript(displayTranscript);

      // Process high-quality final transcripts
      if (finalTranscript.trim() && highestConfidence >= this.minConfidence) {
        const cleanTranscript = finalTranscript.trim();
        console.log('Processing transcript:', cleanTranscript);
        this.sendToAI(cleanTranscript);
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

  updateTranscript(transcript) {
    const element = document.getElementById('live-transcript');
    if (element) {
      element.textContent = transcript || 'Listening...';
    }
  }

  displayAnswer(answer) {
    console.log('📝 Displaying answer:', answer);
    const element = document.getElementById('ai-response');
    if (element) {
      element.innerHTML = this.formatText(answer);
      element.scrollTop = element.scrollHeight;
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
