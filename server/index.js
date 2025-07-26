const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3001;
const TOGETHER_API_KEY = process.env.TOGETHER_API_KEY || "52ba9a34834d11fc356bf0fa8f82383bfdde132a0b5af27706c1c49e32f54fba";

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// LLM API endpoint
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

✅ Always answer fast, clear, and as if you’ve already done this work.
✅ Keep it automation-focused.
✅ Don’t use fancy English. Simple and confident is best.

Answer:`;

    const response = await axios.post('https://api.together.xyz/v1/chat/completions', {
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
      }
    });

    const answer = response.data.choices[0].message.content.trim();
    res.json({ answer, question, timestamp: new Date().toISOString() });

  } catch (error) {
    console.error('Error generating answer:', error.message);
    res.status(500).json({ 
      error: 'Failed to generate answer',
      details: error.response?.data || error.message 
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
