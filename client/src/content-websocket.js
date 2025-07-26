// Alternative using native WebSocket instead of Socket.IO
class InterviewCopilotWebSocket {
  constructor() {
    this.ws = null;
    this.isActive = false;
    this.recognition = null;
    this.overlay = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 3;
    
    this.init();
  }

  async init() {
    console.log('🚀 Interview Co-Pilot starting (WebSocket mode)...');
    this.createOverlay();
    this.setupSpeechRecognition();
    this.connectWebSocket();
    
    // Expose for debugging
    window.interviewCopilot = this;
  }

  connectWebSocket() {
    try {
      console.log('🔗 Connecting to WebSocket server...');
      this.ws = new WebSocket('ws://localhost:3001');

      this.ws.onopen = () => {
        console.log('✅ WebSocket connected');
        this.updateStatus('Connected (WebSocket)', 'connected');
        this.reconnectAttempts = 0;
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📨 Received message:', data);
          
          if (data.type === 'answer') {
            this.displayAnswer('🤖 **[Together.ai]** ' + data.answer);
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        this.updateStatus('Connection Error', 'error');
      };

      this.ws.onclose = () => {
        console.log('⚠️ WebSocket disconnected');
        this.updateStatus('Disconnected', 'ready');
        
        // Auto-reconnect
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          setTimeout(() => this.connectWebSocket(), 2000);
        }
      };

    } catch (error) {
      console.error('❌ WebSocket connection failed:', error);
      this.updateStatus('Ready (Offline)', 'ready');
    }
  }

  sendTranscription(transcript) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('📤 Sending via WebSocket:', transcript);
      
      this.ws.send(JSON.stringify({
        type: 'transcription',
        text: transcript,
        context: this.getInterviewContext(),
        timestamp: new Date().toISOString()
      }));
      
      this.displayAnswer('🤔 Generating AI response...');
    } else {
      console.log('❌ WebSocket not connected, using fallback');
      this.generateFallbackResponse(transcript);
    }
  }

  // ... rest of the methods are similar to the Fetch version
}
