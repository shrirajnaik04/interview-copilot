// Test script for debugging the API
async function testAPI() {
  try {
    console.log('Testing Interview Co-Pilot API...');
    
    // Test health endpoint
    const healthResponse = await fetch('http://localhost:3001/health');
    const healthData = await healthResponse.json();
    console.log('Health check:', healthData);
    
    // Test answer generation
    const testQuestion = "What is your greatest strength?";
    const response = await fetch('http://localhost:3001/api/generate-answer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        question: testQuestion,
        context: 'Software engineering interview practice'
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('API Test Success:');
      console.log('Question:', data.question);
      console.log('Answer:', data.answer);
    } else {
      console.error('API Test Failed:', response.status, response.statusText);
      const errorData = await response.text();
      console.error('Error details:', errorData);
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// For browser console testing
if (typeof window !== 'undefined') {
  window.testInterviewAPI = testAPI;
  console.log('Use window.testInterviewAPI() to test the API');
}

// For Node.js testing
if (typeof module !== 'undefined') {
  module.exports = testAPI;
}

testAPI();
