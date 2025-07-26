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

Provide a concise, professional, and confident answer (2-3 sentences max). Focus on demonstrating knowledge and experience relevant to the question. Be specific and avoid generic responses.

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
