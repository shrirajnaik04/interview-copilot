// Alternative using Server-Sent Events for real-time responses
class InterviewCopilotSSE {
  constructor() {
    this.eventSource = null;
    this.sessionId = null;
    this.isActive = false;
    this.recognition = null;
    this.overlay = null;
    
    this.init();
  }

  async init() {
    console.log('🚀 Interview Co-Pilot starting (SSE mode)...');
    this.sessionId = 'session_' + Date.now();
    this.createOverlay();
    this.setupSpeechRecognition();
    this.connectSSE();
    
    // Expose for debugging
    window.interviewCopilot = this;
  }

  connectSSE() {
    try {
      console.log('🔗 Connecting to SSE endpoint...');
      this.eventSource = new EventSource(`http://localhost:3001/events?sessionId=${this.sessionId}`);

      this.eventSource.onopen = () => {
        console.log('✅ SSE connected');
        this.updateStatus('Connected (SSE)', 'connected');
      };

      this.eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📨 Received SSE message:', data);
          
          if (data.type === 'answer') {
            this.displayAnswer('🤖 **[Together.ai]** ' + data.answer);
          }
        } catch (error) {
          console.error('Failed to parse SSE message:', error);
        }
      };

      this.eventSource.onerror = (error) => {
        console.error('❌ SSE error:', error);
        this.updateStatus('Connection Error', 'error');
      };

    } catch (error) {
      console.error('❌ SSE connection failed:', error);
      this.updateStatus('Ready (Offline)', 'ready');
    }
  }

  async sendTranscription(transcript) {
    try {
      console.log('📤 Sending via HTTP + SSE:', transcript);
      
      const response = await fetch('http://localhost:3001/api/transcription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: this.sessionId,
          text: transcript,
          context: this.getInterviewContext(),
          timestamp: new Date().toISOString()
        })
      });

      if (response.ok) {
        this.displayAnswer('🤔 Generating AI response...');
        // Response will come via SSE
      } else {
        throw new Error('HTTP request failed');
      }
      
    } catch (error) {
      console.error('❌ Failed to send transcription:', error);
      this.generateFallbackResponse(transcript);
    }
  }

  // ... rest of the methods are similar
}
