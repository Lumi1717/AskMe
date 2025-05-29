import DOMPurify from 'dompurify';
import { marked } from 'marked';
import { initializeQA, askQuestion, setApiKey } from './qa.js';

let pageContent = '';

const summaryElement = document.body.querySelector('#summary');
const warningElement = document.body.querySelector('#warning');
const summaryTypeSelect = document.querySelector('#type');
const summaryFormatSelect = document.querySelector('#format');
const summaryLengthSelect = document.querySelector('#length');
const questionInput = document.querySelector('#question');
const askButton = document.querySelector('#ask');
const answerElement = document.querySelector('#answer');
const apiKeyInput = document.querySelector('#api-key');
const saveApiKeyButton = document.querySelector('#save-api-key');
const apiKeyStatus = document.querySelector('#api-key-status');

// Initialize Q&A
initializeQA();

// Load API key from storage
chrome.storage.local.get(['geminiApiKey'], async (result) => {
  if (result.geminiApiKey) {
    apiKeyInput.value = result.geminiApiKey;
    try {
      await setApiKey(result.geminiApiKey);
      apiKeyStatus.textContent = 'API key loaded.';
      setTimeout(() => (apiKeyStatus.textContent = ''), 2000);
    } catch (error) {
      apiKeyStatus.textContent = 'Error loading API key.';
      apiKeyStatus.style.color = 'red';
      setTimeout(() => {
        apiKeyStatus.textContent = '';
        apiKeyStatus.style.color = 'green';
      }, 2000);
    }
  }
});

saveApiKeyButton.addEventListener('click', async () => {
  const key = apiKeyInput.value.trim();
  if (!key) return;
  
  try {
    await setApiKey(key);
    chrome.storage.local.set({ geminiApiKey: key }, () => {
      apiKeyStatus.textContent = 'API key saved!';
      apiKeyStatus.style.color = 'green';
      document.querySelector('.settings-card').classList.add('hidden');
      setTimeout(() => (apiKeyStatus.textContent = ''), 2000);
    });
  } catch (error) {
    apiKeyStatus.textContent = 'Error saving API key.';
    apiKeyStatus.style.color = 'red';
    setTimeout(() => {
      apiKeyStatus.textContent = '';
      apiKeyStatus.style.color = 'green';
    }, 2000);
  }
});

// Handle Q&A
askButton.addEventListener('click', async () => {
  const question = questionInput.value.trim();
  if (!question) return;

  answerElement.textContent = 'Thinking...';
  const answer = await askQuestion(question);
  answerElement.textContent = answer;
});

// Handle Enter key in question input
questionInput.addEventListener('keypress', async (e) => {
  if (e.key === 'Enter') {
    askButton.click();
  }
});

function onConfigChange() {
  const oldContent = pageContent;
  pageContent = '';
  onContentChange(oldContent);
}

[summaryTypeSelect, summaryFormatSelect, summaryLengthSelect].forEach((e) =>
  e.addEventListener('change', onConfigChange)
);

chrome.storage.session.get(['pageContent'], (result) => {
  if (result.pageContent) {
    console.log('Fetched pageContent:', result.pageContent);
    onContentChange(result.pageContent);
  } else {
    console.log('No pageContent found yet.');
    // Optionally, show a loading state and wait for the onChanged event
  }
});

chrome.storage.session.onChanged.addListener((changes, areaName) => {
  if (areaName === 'session' && changes.pageContent) {
    console.log('Updated pageContent:', changes.pageContent.newValue);
    // Update your UI or trigger summary generation here
  }
});

async function onContentChange(newContent) {
  if (pageContent == newContent) {
    // no new content, do nothing
    return;
  }
  console.log('pageContent', pageContent);
  pageContent = newContent;
  let summary;
  if (newContent) {
    updateWarning('');
    showSummary('Loading...');
    summary = await generateSummary(newContent);
  } else {
    summary = "There's nothing to summarize";
  }
  showSummary(summary);
}

async function generateSummary(text) {
  try {
    const session = await createSummarizer(
      {
        type: summaryTypeSelect.value,
        format: summaryFormatSelect.value,
        length: length.value
      },
      (message, progress) => {
        console.log(`${message} (${progress.loaded}/${progress.total})`);
      }
    );
    const summary = await session.summarize(text);
    session.destroy();
    return summary;
  } catch (e) {
    console.log('Summary generation failed');
    console.error(e);
    return 'Error: ' + e.message;
  }
}

async function createSummarizer(config, downloadProgressCallback) {
  if (!window.ai || !window.ai.summarizer) {
    throw new Error('AI Summarization is not supported in this browser');
  }
  const canSummarize = await window.ai.summarizer.capabilities();
  if (canSummarize.available === 'no') {
    throw new Error('AI Summarization is not supported');
  }
  const summarizationSession = await self.ai.summarizer.create(
    config,
    downloadProgressCallback
  );
  if (canSummarize.available === 'after-download') {
    summarizationSession.addEventListener(
      'downloadprogress',
      downloadProgressCallback
    );
    await summarizationSession.ready;
  }
  return summarizationSession;
}

async function showSummary(text) {
  summaryElement.innerHTML = DOMPurify.sanitize(marked.parse(text));
}

async function updateWarning(warning) {
  warningElement.textContent = warning;
  if (warning) {
    warningElement.removeAttribute('hidden');
  } else {
    warningElement.setAttribute('hidden', '');
  }
}
