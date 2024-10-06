import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Construct the path to the .env file
const envPath = join(__dirname, '..', '..', '.env');

// Load environment variables from the specified path
dotenv.config({ path: envPath });

let pageContent = '';

const summaryElement = document.body.querySelector('#summary');
const warningElement = document.body.querySelector('#warning');
const userInputElement = document.body.querySelector('#userInput');
const summarizeButton = document.body.querySelector('#summarizeButton');
const loadingElement = document.body.querySelector('#loading');
import { GoogleGenerativeAI } from "@google/generative-ai";


// Show loading animation immediately
loadingElement.style.display = 'flex';


chrome.storage.session.get('pageContent', ({ pageContent }) => {
  onContentChange(pageContent);
});

chrome.storage.session.onChanged.addListener((changes) => {
  const pageContent = changes['pageContent'];
  onContentChange(pageContent.newValue);
});

async function onContentChange(newContent) {
    // Hide loading animation as soon as we have content
    loadingElement.style.display = 'none';

    if (newContent) {
      if (newContent.length > MAX_MODEL_CHARS) {
        updateWarning(
          `Text is too long for summarization with ${newContent.length} characters (maximum supported content length is ~4000 characters).`
        );
      } else {
        updateWarning('');
      }
      showSummary('Ready to summarize. Click the button to start!');
    } 
}


async function generateSummary(text) {
  // Show loading animation when starting to generate summary
  loadingElement.style.display = 'flex';

  try {
    const genAI = new GoogleGenerativeAI(process.env.API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const userPrompt = userInputElement.value;
    const prompt = `Based on the following web page content:\n\n${text}\n\nUser request: ${userPrompt}`;

    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (e) {
    console.log('Summary generation failed');
    console.error(e);
    return 'Error: ' + e.message;
  } finally {
    // Hide loading animation when summary generation is complete (success or failure)
    loadingElement.style.display = 'none';
  }
}


summarizeButton.addEventListener('click', async () => {
  const userContent = pageContent; // Use the current page content
  if (userContent) {
    const summary = await generateSummary(userContent);
    showSummary(summary);
  }
});



// async function generateSummary(text) {
//   // Show loading animation when starting to generate summary
//   loadingElement.style.display = 'flex';

//   try {
//     let session = await createSummarizationSession((message, progress) => {
//       console.log(`${message} (${progress.loaded}/${progress.total})`);
//     });
//     let summary = await session.summarize(text);
//     session.destroy();
//     return summary;
//   } catch (e) {
//     console.log('Summary generation failed');
//     console.error(e);
//     return 'Error: ' + e.message;
//   } finally {
//     // Hide loading animation when summary generation is complete (success or failure)
//     loadingElement.style.display = 'none';
//   }
// }

// async function createSummarizationSession(downloadProgressCallback) {
//   if (!window.ai || !window.ai.summarizer) {
//     throw new Error('AI Summarization is not supported in this browser');
//   }
//   const canSummarize = await window.ai.summarizer.capabilities();
//   if (canSummarize.available === 'no') {
//     throw new Error('AI Summarization is not availabe');
//   }

//   const summarizationSession = await window.ai.summarizer.create();
//   if (canSummarize.available === 'after-download') {
//     if (downloadProgressCallback) {
//       summarizationSession.addEventListener(
//         'downloadprogress',
//         downloadProgressCallback
//       );
//     }
//     await summarizationSession.ready;
//   }

//   return summarizationSession;
// }

async function showSummary(text) {
  // Make sure to preserve line breaks in the response
  summaryElement.textContent = '';
  const paragraphs = text.split(/\r?\n/);
  for (const paragraph of paragraphs) {
    if (paragraph) {
      summaryElement.appendChild(document.createTextNode(paragraph));
    }
    summaryElement.appendChild(document.createElement('BR'));
  }
}

async function updateWarning(warning) {
  warningElement.textContent = warning;
  if (warning) {
    warningElement.removeAttribute('hidden');
  } else {
    warningElement.setAttribute('hidden', '');
  }
}
