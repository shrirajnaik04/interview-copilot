const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

// Load environment variables from the root directory
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3001;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const TOGETHER_API_KEY = process.env.TOGETHER_API_KEY;

// Validate API keys
if (!GEMINI_API_KEY) {
  console.warn('⚠️  GEMINI_API_KEY not found in environment variables');
}
if (!TOGETHER_API_KEY) {
  console.warn('⚠️  TOGETHER_API_KEY not found in environment variables');
}

// Choose which API to use (can be toggled)
let USE_GEMINI = true; // Set to false to use Together.ai

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    apiInUse: USE_GEMINI ? 'Google Gemini' : 'Together.ai'
  });
});

// Function to try Gemini API
async function tryGeminiAPI(prompt) {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key not configured');
  }
  
  console.log('🔮 Trying Google Gemini API...');
  const geminiResponse = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
    contents: [{
      parts: [{
        text: prompt
      }]
    }],
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 150,
    }
  }, {
    headers: {
      'Content-Type': 'application/json'
    },
    timeout: 10000 // 10 second timeout
  });

  return {
    answer: geminiResponse.data.candidates[0].content.parts[0].text.trim(),
    apiUsed: 'Google Gemini'
  };
}

// Function to try Together.ai API
async function tryTogetherAPI(prompt) {
  if (!TOGETHER_API_KEY) {
    throw new Error('Together.ai API key not configured');
  }
  
  console.log('🤖 Trying Together.ai API...');
  const togetherResponse = await axios.post('https://api.together.xyz/v1/chat/completions', {
    model: 'mistralai/Mixtral-8x7B-Instruct-v0.1',
    messages: [
      {
        role: 'user',
        content: prompt
      }
    ],
    max_tokens: 150,
    temperature: 0.7,
    stream: false
  }, {
    headers: {
      'Authorization': `Bearer ${TOGETHER_API_KEY}`,
      'Content-Type': 'application/json'
    },
    timeout: 10000 // 10 second timeout
  });

  return {
    answer: togetherResponse.data.choices[0].message.content.trim(),
    apiUsed: 'Together.ai (Mixtral)'
  };
}

// API toggle endpoint
app.get('/toggle-api', (req, res) => {
  USE_GEMINI = !USE_GEMINI;
  res.json({ 
    apiInUse: USE_GEMINI ? 'Google Gemini' : 'Together.ai',
    message: `Switched to ${USE_GEMINI ? 'Google Gemini' : 'Together.ai'}`
  });
});

// LLM API endpoint with automatic fallback
app.post('/api/generate-answer', async (req, res) => {
  try {
    const { question, context = '' } = req.body;
    
    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

    const prompt = `You are an expert interview assistant. An interviewer just asked: "${question}"

Context: ${context}

You are an AI QA interview co-pilot. 
Your job is to help the candidate (Shriraj) give short, confident answers in a live software testing interview at Creative Capsule.

🎯 Candidate background:
- Strong in automation using Selenium, Cypress, Playwright
- Uses AI (LLMs) to generate test cases from user stories
- Has tested MCP servers, APIs, and backend systems
- Uses Git, CI/CD, Postman, JMeter, Shell scripting
- Experience leading automation at Codemax, built smart test pipelines

📌 Guidelines:
- Always give answers that are straight to the point
- Use **simple English**, but use correct software testing terms
- Do **not add any extra explanation unless the question needs it**
- If the question needs an example, give **one clear real-world example**
- Focus mainly on **automation testing topics** (Selenium, Cypress, frameworks, APIs, CI/CD, etc.)

🎯 Example Answers:

Q: How do you handle flaky tests?
A: I find the cause — mostly it's bad selectors or timing issues. I fix waits, use retry logic, and improve selectors.

Q: How do you use AI in testing?
A: I use LLMs like ChatGPT to convert user stories into test cases. At Codemax, this saved us 40% of manual effort.

Q: How do you test an API?
A: I check all methods using Postman — status codes, response data, negative cases. I also use JMeter for load testing.

Q: What is your CI/CD experience?
A: I integrated test scripts into Jenkins. Tests run automatically after every code push and show pass/fail status.

Q: How do you test a login page?
A: I check with valid and invalid inputs, blank fields, password rules, and session handling. I automate it using Selenium.

Q: Can you explain your test framework?
A: I used TestNG with Selenium. It supports groups, parallel runs, and reports. I added reusable functions and hooks.

✅ Always answer fast, clear, and as if you've already done this work.
✅ Keep it automation-focused.
✅ Don't use fancy English. Simple and confident is best.

Answer:`;

    let result;
    let fallbackUsed = false;

    try {
      // Try primary API first (based on USE_GEMINI setting)
      if (USE_GEMINI) {
        result = await tryGeminiAPI(prompt);
      } else {
        result = await tryTogetherAPI(prompt);
      }
    } catch (primaryError) {
      console.warn(`⚠️ Primary API failed: ${primaryError.message}`);
      console.log('🔄 Attempting fallback to alternate API...');
      
      try {
        // Try fallback API
        if (USE_GEMINI) {
          // Primary was Gemini, fallback to Together.ai
          result = await tryTogetherAPI(prompt);
          result.apiUsed += ' (Fallback)';
        } else {
          // Primary was Together.ai, fallback to Gemini
          result = await tryGeminiAPI(prompt);
          result.apiUsed += ' (Fallback)';
        }
        fallbackUsed = true;
        console.log('✅ Fallback API succeeded!');
      } catch (fallbackError) {
        console.error('❌ Both APIs failed:');
        console.error('Primary error:', primaryError.message);
        console.error('Fallback error:', fallbackError.message);
        
        return res.status(500).json({ 
          error: 'All APIs failed',
          details: {
            primary: primaryError.message,
            fallback: fallbackError.message
          }
        });
      }
    }

    res.json({ 
      answer: result.answer, 
      question, 
      apiUsed: result.apiUsed,
      fallbackUsed,
      timestamp: new Date().toISOString() 
    });

  } catch (error) {
    console.error('Unexpected error:', error.message);
    res.status(500).json({ 
      error: 'Unexpected server error',
      details: error.message 
    });
  }
});

// Socket.IO for real-time communication
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Handle ping for connection testing
  socket.on('ping', (data) => {
    console.log('Ping received from client:', data);
    socket.emit('pong', { timestamp: Date.now(), receivedAt: data.timestamp });
  });

  socket.on('transcription', async (data) => {
    try {
      const { text, context, timestamp } = data;
      console.log('Received transcription:', text);
      console.log('Context:', context);
      console.log('Timestamp:', timestamp);

      if (!text || text.trim().length < 3) {
        console.log('Skipping short transcript:', text);
        return;
      }

      // Generate answer using LLM
      console.log('Calling LLM API...');
      const response = await axios.post(`http://localhost:${PORT}/api/generate-answer`, {
        question: text,
        context: context
      });

      console.log('LLM Response received:', response.data);

      // Send answer back to client
      const answerData = {
        question: text,
        answer: response.data.answer,
        timestamp: new Date().toISOString()
      };
      
      console.log('Sending answer to client:', answerData);
      socket.emit('answer', answerData);

    } catch (error) {
      console.error('Error processing transcription:', error.message);
      console.error('Full error:', error);
      socket.emit('error', { 
        message: 'Failed to process transcription',
        details: error.message 
      });
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Interview Co-Pilot server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});
