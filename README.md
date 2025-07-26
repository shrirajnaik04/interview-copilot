# 🤖 Interview Co-Pilot

A real-time AI assistant for interviews that provides intelligent responses during live video calls on Google Meet and Zoom.

## 🌟 Features

### 🎯 **Core Functionality**

- **Real-time Speech Recognition**: Captures interviewer questions using Web Speech API
- **AI-Powered Responses**: Generates intelligent answers using Together.ai (Mixtral 8x7B)
- **Stealth Mode**: Minimal, professional overlay that won't distract or raise suspicion
- **Multi-Platform**: Works on Google Meet, Zoom, and custom test environments

### 🎨 **Advanced UI/UX**

- **Compact Mode**: Default minimal 380x160px overlay showing only AI response
- **Expand Mode**: Full interface with transcription, debug info, and history
- **Confidence Indicators**: Visual feedback on speech recognition quality (🟢🟡🔴)
- **Token Streaming**: Real-time word-by-word response generation
- **Drag & Dock**: Draggable panel with auto-docking to screen edges
- **Emergency Hide**: Instant hide with Ctrl+Shift+H hotkey

### 🛡️ **Reliability Features**

- **Fallback Responses**: Smart offline responses when server unavailable
- **Multiple CDN Support**: Socket.IO with primary + backup + unpkg fallbacks
- **Health Monitoring**: Server connectivity checks and error handling
- **Auto-hide**: Fades to 30% opacity during inactivity
- **Context Awareness**: Auto-detects question categories (#API, #Selenium, #Behavioral)

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ installed
- Chrome browser with Developer Mode enabled
- Together.ai API key

### 1. Clone and Setup

```bash
git clone https://github.com/shrirajnaik04/interview-copilot.git
cd interview-copilot

# Install server dependencies
npm install

# Install client dependencies
cd client
npm install
```

### 2. Configuration

Create a `.env` file in the root directory:

```bash
TOGETHER_API_KEY=your_together_ai_api_key_here
PORT=3001
```

### 3. Build Extension

```bash
cd client
npm run build
# Or use: build.bat on Windows
```

### 4. Install Chrome Extension

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (top right toggle)
3. Click "Load unpacked"
4. Select the `client/dist` directory

### 5. Start Server

```bash
cd ../
npm start
```

### 6. Test Setup

- Open the test page: `enhanced-test.html`
- Check that extension overlay appears
- Test speech recognition and AI responses

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

## 📁 Project Structure

```
interview-copilot/
├── server/                 # Node.js backend
│   └── index.js           # Express server with Socket.IO
├── client/                # Chrome extension
│   ├── src/
│   │   ├── content.js     # Main extension logic
│   │   ├── styles.css     # Enhanced UI styles
│   │   ├── popup.html     # Extension popup
│   │   └── background.js  # Service worker
│   ├── manifest.json      # Extension manifest
│   ├── dist/             # Built extension files
│   └── build.bat         # Build script
├── .env                  # Environment variables (API keys)
├── enhanced-test.html    # Testing environment
└── README.md            # This file
```

## 🎯 Usage

### During an Interview

1. **Join your video call** (Google Meet/Zoom)
2. **Extension overlay appears** in top-right corner (compact mode)
3. **Click 🎤 button** to start listening
4. **Speak naturally** - AI responds to interviewer questions
5. **Use Ctrl+Shift+H** for emergency hide if needed

### Key Controls

- **🎤 Toggle**: Start/stop listening
- **⇲ Expand**: Switch between compact/full mode
- **⚙️ Settings**: Configure API key, model, opacity
- **👁️ Emergency**: Quick hide button
- **Keyboard Shortcuts**:
  - `Ctrl+Shift+H`: Emergency hide/show
  - `Ctrl+Shift+L`: Toggle listening
  - `Ctrl+Shift+E`: Expand/collapse mode

## 🔧 Configuration

### API Settings

- **API Key**: Enter your Together.ai API key in settings
- **Model Selection**: Choose between Mixtral 8x7B or LLaMA 2 70B
- **Server URL**: Default `http://localhost:3001`

### UI Preferences

- **Opacity**: Adjust transparency (50-100%)
- **Confidence Indicators**: Show/hide speech recognition quality
- **Streaming**: Enable/disable real-time response generation
- **Auto-hide**: Fade overlay when inactive

## 🧪 Testing

### Test Environment

- Open `enhanced-test.html` in your browser
- Use test buttons to verify:
  - Server connection
  - Speech recognition
  - Socket.IO connectivity
  - AI response generation

## ⚠️ Disclaimer

This tool is for educational and practice purposes. Always follow your organization's policies and interview guidelines. Use responsibly and ethically.

---

**Built with ❤️ for interview success**
