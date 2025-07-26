# Interview Co-Pilot MVP

🤖 **Real-time AI assistant for interviews** - Helps candidates during live interviews on Google Meet and Zoom with AI-generated responses.

## 🎯 Features

- **Real-time Speech Recognition**: Captures and transcribes interviewer questions using Web Speech API
- **AI-Powered Responses**: Uses Together.ai (Mixtral-8x7B) to generate contextual interview answers
- **Chrome Extension**: Floating UI overlay that doesn't interfere with video calls
- **WebSocket Communication**: Real-time streaming between extension and backend
- **Privacy-Focused**: Processes audio locally in browser, only sends text to AI

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ installed
- Chrome browser
- Together.ai API key (provided: `52ba9a34834d11fc356bf0fa8f82383bfdde132a0b5af27706c1c49e32f54fba`)

### 1. Install Dependencies

```bash
# Install server dependencies
npm install

# Install client dependencies
cd client
npm install
cd ..
```

### 2. Start the Backend Server

```bash
npm start
```

The server will run on `http://localhost:3001`

### 3. Build and Install Chrome Extension

```bash
# Build the extension
cd client
npm run build
# or use the batch file on Windows
build.bat
```

### 4. Load Extension in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (top right toggle)
3. Click "Load unpacked" and select the `client/dist` directory
4. The extension icon should appear in your toolbar

### 5. Use During Interview

1. Join a Google Meet or Zoom call
2. Click the extension icon to open settings (if needed)
3. The floating overlay will appear automatically
4. Click the 🎤 button to start listening
5. AI responses will appear in real-time as the interviewer speaks

## 🛠️ Project Structure

```
interview-copilot/
├── server/                 # Node.js backend
│   └── index.js           # Express server with Socket.IO
├── client/                # Chrome extension
│   ├── src/
│   │   ├── content.js     # Main extension logic
│   │   ├── background.js  # Service worker
│   │   ├── popup.html     # Settings popup
│   │   ├── popup.js       # Settings logic
│   │   └── styles.css     # UI styles
│   ├── manifest.json      # Extension manifest
│   └── dist/             # Built extension files
├── .env                  # Environment variables
└── package.json          # Project dependencies
```

## ⚙️ Configuration

### Environment Variables (.env)

```bash
TOGETHER_API_KEY=52ba9a34834d11fc356bf0fa8f82383bfdde132a0b5af27706c1c49e32f54fba
PORT=3001
```

### Extension Settings

Access via extension popup:

- **Enable/Disable**: Toggle the assistant
- **Server URL**: Backend server address (default: http://localhost:3001)
- **API Key**: Together.ai API key (optional if set in .env)

## 🎮 Keyboard Shortcuts

- `Ctrl+Shift+C`: Toggle overlay visibility
- `Ctrl+Shift+L`: Toggle listening/recording

## 🔧 Technical Details

### Speech Recognition

- Uses browser's Web Speech API
- Continuous listening with interim results
- Automatic restart on interruption
- Filters final transcripts for AI processing

### AI Integration

- **Model**: `mistralai/Mixtral-8x7B-Instruct-v0.1`
- **API**: Together.ai (OpenAI-compatible)
- **Prompt Engineering**: Optimized for concise, professional interview responses
- **Rate Limiting**: Built-in to prevent API overuse

### Communication Flow

1. Browser captures audio → Web Speech API
2. Extension transcribes → WebSocket to server
3. Server sends to Together.ai → AI generates response
4. Response streams back → Extension displays in overlay

## 🛡️ Privacy & Security

- **Local Processing**: Audio stays in browser, only text sent to server
- **No Recording**: No audio files stored or transmitted
- **Minimal Data**: Only transcribed text and responses processed
- **Secure Communication**: HTTPS/WSS in production

## 🚀 Production Deployment

### Backend (Server)

```bash
# Set production environment
export NODE_ENV=production
export TOGETHER_API_KEY=your_api_key

# Start with PM2 or similar
npm start
```

### Extension

1. Build for production: `npm run build`
2. Package as .crx file for distribution
3. Submit to Chrome Web Store (optional)

## 🐛 Troubleshooting

### Common Issues

**Extension not loading:**

- Check Chrome Developer mode is enabled
- Verify manifest.json is valid
- Check browser console for errors

**Speech recognition not working:**

- Ensure microphone permissions granted
- Check if browser supports Web Speech API
- Verify you're on HTTPS site (required for speech API)

**Server connection failed:**

- Verify server is running on correct port
- Check firewall/antivirus blocking connections
- Ensure CORS is properly configured

**AI responses not generating:**

- Verify Together.ai API key is valid
- Check server logs for API errors
- Ensure sufficient API credits

### Debug Mode

1. Open Chrome DevTools (F12)
2. Check Console tab for errors
3. Network tab shows WebSocket connections
4. Storage tab shows extension settings

## 📝 API Reference

### Server Endpoints

**POST /api/generate-answer**

```json
{
  "question": "Tell me about yourself",
  "context": "Software engineering interview"
}
```

**GET /health**

```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### WebSocket Events

**Client → Server:**

- `transcription`: Send transcribed text for AI processing

**Server → Client:**

- `answer`: AI-generated response
- `error`: Error messages

## 🔮 Future Enhancements

- [ ] **Multi-language support** for international interviews
- [ ] **Custom prompt templates** for different interview types
- [ ] **Interview analytics** and performance tracking
- [ ] **Offline mode** with local AI models
- [ ] **Voice synthesis** for audio responses
- [ ] **Integration** with popular job boards
- [ ] **Team collaboration** features for interview preparation

## 📄 License

MIT License - feel free to modify and distribute.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

**Disclaimer**: This tool is for educational and practice purposes. Always follow your organization's policies and interview guidelines. Use responsibly and ethically.
