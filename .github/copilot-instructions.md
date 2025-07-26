<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# Interview Co-Pilot MVP Instructions

This project is a real-time AI assistant for interviews that consists of:

## Architecture

- **Chrome Extension** (client/): React-based UI overlay for Google Meet/Zoom
- **Node.js Backend** (server/): Express server with Socket.IO for real-time communication
- **Speech Recognition**: Web Speech API for browser-based transcription
- **LLM Integration**: Together.ai API for generating interview responses

## Key Components

- Real-time audio capture and transcription
- WebSocket communication between extension and backend
- Together.ai API integration for answer generation
- Floating UI overlay that doesn't interfere with video calls
- Settings panel for API key configuration

## Development Guidelines

- Use modern JavaScript/ES6+ syntax
- Implement proper error handling for API calls
- Ensure minimal UI interference during video calls
- Optimize for real-time performance
- Follow Chrome extension security best practices
- Use Socket.IO for bidirectional real-time communication

## API Integration

- Together.ai compatible with OpenAI API format
- Use model: mistralai/Mixtral-8x7B-Instruct-v0.1
- Implement proper rate limiting and error handling
