# 🤖 Interview Co-Pilot

A real-time AI assistant for interviews that provides intelligent responses during live video calls on Google Meet and Zoom. Specifically optimized for **QA automation testing** interviews with personalized context for software testing professionals.

## 🌟 Features

### 🎯 **Core Functionality**

- **Real-time Speech Recognition**: Captures interviewer questions using Web Speech API
- **AI-Powered Responses**: Generates intelligent answers using Together.ai (Mixtral 8x7B)
- **QA-Focused Context**: Specialized prompts for automation testing, Selenium, Cypress, API testing
- **Stealth Mode**: Professional overlay that won't distract or raise suspicion
- **Multi-Platform**: Works on Google Meet, Zoom, and custom test environments

### 🎨 **Advanced UI/UX**

- **Minimize Button**: Collapse panel to header-only view (60px height)
- **Multi-Directional Resize**: Drag from 5 handles (bottom, left, right, corners)
- **Smooth Drag & Resize**: Professional animations with viewport constraints
- **Compact/Expand Modes**: Toggle between minimal (380x160px) and full interface
- **Confidence Indicators**: Visual feedback on speech recognition quality (🟢🟡🔴)
- **Token Streaming**: Real-time word-by-word response generation
- **Auto-Docking**: Snaps to screen edges for convenience
- **Emergency Hide**: Instant hide with Ctrl+Shift+H hotkey

### � **Enhanced Resize System**

- **Bottom Handle**: Vertical resize (height adjustment)
- **Right/Left Handles**: Horizontal resize (width adjustment)
- **Corner Handles**: Diagonal resize (both dimensions)
- **Visual Feedback**: Hover effects with blue accent colors
- **Smooth Constraints**: Prevents panel from leaving viewport
- **State Persistence**: Remembers size and position across sessions

### 🛡️ **Reliability Features**

- **Fallback Responses**: Smart offline responses when server unavailable
- **Health Monitoring**: Server connectivity checks and error handling
- **Auto-hide**: Fades to 30% opacity during inactivity
- **Context Awareness**: Auto-detects question categories (#API, #Selenium, #Behavioral)
- **Error Recovery**: Robust handling of API failures and network issues

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ installed
- Chrome browser with Developer Mode enabled
- Together.ai API key

### 1. Clone and Setup

```bash
git clone https://github.com/shrirajnaik04/interview-copilot.git
cd interview-copilot

# Install all dependencies
npm run install:all
```

### 2. Configuration

Create a `.env` file in the root directory:

```bash
TOGETHER_API_KEY=your_together_ai_api_key_here
PORT=3001
```

### 3. Build Extension

```bash
npm run build:extension
```

### 4. Install Chrome Extension

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (top right toggle)
3. Click "Load unpacked"
4. Select the `client/dist` directory

### 5. Start Server

```bash
npm start
```

### 6. Test & Use

1. **Test Setup**: Open `enhanced-test.html` to verify:
   - Server connection health
   - Speech recognition functionality
   - AI response generation
   - Extension overlay appearance
2. **Live Use**: Join a Google Meet or Zoom call
3. The floating overlay appears automatically
4. Click the 🎤 button to start listening
5. AI responses appear in real-time as the interviewer speaks

## 🔧 QA Automation Context [Contecxt can be changed from index.js file inside server folder, else it will provide responses related to software testing by default.]

This AI assistant is optimized to support **software testing interviews**, especially with a focus on **automation**.

### 💡 Purpose

- Designed to assist in **live QA interviews** by listening to questions in real time and generating context-aware answers.
- Tailored for roles involving **test automation**, **API testing**, **CI/CD integration**, and **modern QA practices**.

### 📋 Response Guidelines

- Answers are **short and to the point** (2–4 sentences).
- Uses **simple English** with correct **software testing terminology**.
- Provides **real-world examples** when necessary (e.g., handling flaky tests, automation frameworks).
- Focus is on **automation tools** like Selenium, Cypress, Playwright, Postman, JMeter, and integration with CI/CD.

### 💬 Sample QA Responses

**Q: How do you handle flaky tests?**  
A: I check the cause — mostly unstable selectors or timing issues. I fix waits, add retry logic, and improve element locators.

**Q: How do you use AI in testing?**  
A: I use AI tools like ChatGPT to convert user stories into test cases. It helps save time and covers edge cases.

**Q: How do you test an API?**  
A: I use Postman to test all request types, status codes, and data validation. For performance, I use JMeter.

---

You can customize this context further based on the job role or domain you are preparing for (e.g., security testing, mobile automation, performance engineering, etc.).

npm install

````

### 2. Configuration

Create a `.env` file in the root directory:

```bash
TOGETHER_API_KEY=your_together_ai_api_key_here
PORT=3001
````

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

### 🔑 **Environment Variables (.env)**

```bash
TOGETHER_API_KEY=your_together_ai_api_key_here
PORT=3001
```

### 🎛️ **Extension Settings** (Access via popup)

- **API Key**: Together.ai API key (optional if set in .env)
- **Model Selection**: Choose between Mixtral 8x7B or LLaMA 2 70B
- **Server URL**: Backend server address (default: http://localhost:3001)
- **Opacity**: Adjust transparency (50-100%)
- **Confidence Indicators**: Show/hide speech recognition quality
- **Streaming**: Enable/disable real-time response generation
- **Auto-hide**: Fade overlay when inactive

## 🎮 Controls & Usage

### ⌨️ **Keyboard Shortcuts**

- `Ctrl+Shift+H`: Emergency hide/show overlay
- `Ctrl+Shift+L`: Toggle listening/recording
- `Ctrl+Shift+E`: Toggle compact/expand mode

### 🎛️ **Panel Controls**

- **🎤 Toggle**: Start/stop listening
- **🗕 Minimize**: Collapse to header-only view
- **⇲ Expand**: Switch between compact/full mode
- **⚙️ Settings**: Configure API key, model, opacity
- **👁️ Emergency**: Quick hide button
- **× Close**: Hide overlay completely

### 🔄 **Resize Handles**

- **Bottom Edge**: Drag to adjust height
- **Left/Right Edges**: Drag to adjust width
- **Corners**: Drag to resize both dimensions
- **Header**: Drag to move panel position

### 🎯 **During an Interview**

1. **Join your video call** (Google Meet/Zoom)
2. **Extension overlay appears** in top-right corner
3. **Click 🎤 button** to start listening
4. **Speak naturally** - AI responds to interviewer questions
5. **Use minimize/resize** as needed for screen management
6. **Emergency hide** if interviewer looks at screen

## 🔧 Technical Details

### 🗣️ **Speech Recognition**

- Uses browser's Web Speech API
- Continuous listening with interim results
- Automatic restart on interruption
- Filters final transcripts for AI processing

### 🤖 **AI Integration**

- **Model**: `mistralai/Mixtral-8x7B-Instruct-v0.1`
- **API**: Together.ai (OpenAI-compatible)
- **Specialized Prompts**: Optimized for QA automation interviews
- **Rate Limiting**: Built-in to prevent API overuse

### 📡 **Communication Flow**

1. Browser captures audio → Web Speech API
2. Extension transcribes → HTTP/Fetch to server
3. Server sends to Together.ai → AI generates response
4. Response streams back → Extension displays in overlay

### 🛠️ **Project Structure**

```
interview-copilot/
├── server/                 # Node.js backend
│   └── index.js           # Express server with QA context
├── client/                # Chrome extension
│   ├── src/
│   │   ├── content.js     # Main extension logic with resize system
│   │   ├── background.js  # Service worker
│   │   ├── popup.html     # Settings popup
│   │   └── popup.js       # Settings logic
│   ├── manifest.json      # Extension manifest
│   └── dist/             # Built extension files
├── .env                  # Environment variables
└── package.json          # Project dependencies
```

## 🛡️ Privacy & Security

- **Local Processing**: Audio stays in browser, only text sent to server
- **No Recording**: No audio files stored or transmitted
- **Minimal Data**: Only transcribed text and responses processed
- **Secure Communication**: HTTPS/WSS in production

## � Troubleshooting

### **Extension Issues**

- **Not loading**: Enable Chrome Developer mode, check manifest.json validity
- **Speech not working**: Grant microphone permissions, verify HTTPS site
- **Server connection failed**: Check server is running, verify port 3001, disable firewall

### **AI Response Issues**

- **No responses**: Verify Together.ai API key, check server logs, ensure API credits
- **Poor quality**: Adjust confidence threshold, improve microphone setup

### **Debug Mode**

1. Open Chrome DevTools (F12)
2. Check Console tab for errors
3. Network tab shows API requests
4. Storage tab shows extension settings

## � Production Deployment

### **Server Deployment**

```bash
# Set production environment
export NODE_ENV=production
export TOGETHER_API_KEY=your_api_key

# Start with PM2 or similar
npm start
```

### **Extension Distribution**

1. Build for production: `npm run build:extension`
2. Package as .crx file for distribution
3. Submit to Chrome Web Store (optional)

## 📝 API Reference

### **POST /api/generate-answer**

```json
{
  "question": "How do you handle flaky tests?",
  "context": "Google Meet interview"
}
```

### **GET /health**

```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 🔮 Future Enhancements

- [ ] Multi-language support for international interviews
- [ ] Custom prompt templates for different roles (Frontend, Backend, DevOps)
- [ ] Interview analytics and performance tracking
- [ ] Offline mode with local AI models
- [ ] Voice synthesis for audio responses
- [ ] Integration with popular job boards

## ⚠️ Disclaimer

This tool is for educational and practice purposes. Always follow your organization's policies and interview guidelines. Use responsibly and ethically.

## 📄 License

MIT License - feel free to modify and distribute.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

**Built with ❤️ for QA automation interview success**
