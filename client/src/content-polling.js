// Alternative using polling for simple, reliable communication
class InterviewCopilotPolling {
  constructor() {
    this.pendingRequests = new Map();
    this.pollingInterval = null;
    this.isActive = false;
    this.recognition = null;
    this.overlay = null;
    
    this.init();
  }

  async init() {
    console.log('🚀 Interview Co-Pilot starting (Polling mode)...');
    this.createOverlay();
    this.setupSpeechRecognition();
    this.startPolling();
    
    // Expose for debugging
    window.interviewCopilot = this;
  }

  startPolling() {
    // Poll server every 2 seconds for responses
    this.pollingInterval = setInterval(() => {
      this.checkForResponses();
    }, 2000);
  }

  async checkForResponses() {
    if (this.pendingRequests.size === 0) return;

    try {
      const requestIds = Array.from(this.pendingRequests.keys());
      const response = await fetch('http://localhost:3001/api/check-responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestIds })
      });

      if (response.ok) {
        const data = await response.json();
        
        data.responses.forEach(resp => {
          if (this.pendingRequests.has(resp.requestId)) {
            this.displayAnswer('🤖 **[Together.ai]** ' + resp.answer);
            this.pendingRequests.delete(resp.requestId);
          }
        });
      }
    } catch (error) {
      console.error('Polling error:', error);
    }
  }

  async sendTranscription(transcript) {
    try {
      const requestId = 'req_' + Date.now();
      console.log('📤 Sending transcript (polling):', transcript);
      
      const response = await fetch('http://localhost:3001/api/submit-transcription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId,
          text: transcript,
          context: this.getInterviewContext(),
          timestamp: new Date().toISOString()
        })
      });

      if (response.ok) {
        this.pendingRequests.set(requestId, { transcript, timestamp: Date.now() });
        this.displayAnswer('🤔 Generating AI response...');
        
        // Clean up old requests after 30 seconds
        setTimeout(() => {
          this.pendingRequests.delete(requestId);
        }, 30000);
      } else {
        throw new Error('Failed to submit transcription');
      }
      
    } catch (error) {
      console.error('❌ Failed to send transcription:', error);
      this.generateFallbackResponse(transcript);
    }
  }

  // ... rest of the methods are similar
}
