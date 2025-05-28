import { GoogleGenerativeAI } from '@google/generative-ai';

// Q&A functionality for the side panel
let currentContent = '';
let apiKey = '';
let model = null;

function setApiKey(key) {
  apiKey = key;
  if (apiKey) {
    const genAI = new GoogleGenerativeAI(apiKey);
    model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash',
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
    });
  } else {
    model = null;
  }
}

// Function to initialize Q&A
async function initializeQA() {
  // Get the stored content
  const result = await chrome.storage.session.get(['pageContent']);
  if (result.pageContent) {
    currentContent = result.pageContent;
    console.log('QA initialized with content');
  }

  // Listen for content updates
  chrome.storage.session.onChanged.addListener((changes, areaName) => {
    if (areaName === 'session' && changes.pageContent) {
      currentContent = changes.pageContent.newValue;
      console.log('QA content updated');
    }
  });
}

// Function to generate a prompt
function generatePrompt(question) {
  return `You are a helpful AI assistant that answers questions based on the provided content.
The content may include code snippets, which should be preserved and referenced accurately.

Content:
${currentContent}

Question: ${question}

Please provide a clear and concise answer. If the answer involves code, make sure to:
1. Reference the specific code snippet
2. Explain what the code does
4. Make it short and concise
5. Make sure the questions are answered in the context of the page

Answer:`;
}

// Function to ask a question
async function askQuestion(question) {
  if (!currentContent) {
    return "I don't have any content to analyze. Please make sure the page content has been extracted.";
  }
  if (!model) {
    return "API key is not set. Please enter your Gemini API key above.";
  }
  try {
    const prompt = generatePrompt(question);
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error asking question:', error);
    if (error.message.includes('API key')) {
      return "Error: Invalid API key. Please check your API key and try again.";
    }
    return `Error: ${error.message}`;
  }
}

// Export the functions
export { initializeQA, askQuestion, setApiKey }; 