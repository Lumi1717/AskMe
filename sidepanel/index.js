// The underlying model has a context of 1,024 tokens, out of which 26 are used by the internal prompt,
// leaving about 998 tokens for the input text. Each token corresponds, roughly, to about 4 characters, so 4,000
// is used as a limit to warn the user the content might be too long to summarize.
const MAX_MODEL_CHARS = 4000;

let pageContent = '';

const summaryElement = document.body.querySelector('#summary');
const warningElement = document.body.querySelector('#warning');
const userInputElement = document.body.querySelector('#userInput');
const summarizeButton = document.body.querySelector('#summarizeButton');
const loadingElement = document.body.querySelector('#loading');

// Show loading animation immediately
loadingElement.style.display = 'flex';

summarizeButton.addEventListener('click', () => {
    const userContent = userInputElement.value;
    if (userContent) {
      chrome.runtime.sendMessage({ action: 'summarize', content: userContent }, (response) => {
        console.log(response.status);
        onContentChange(userContent);
      });
    }
  });

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
    let session = await createSummarizationSession((message, progress) => {
      console.log(`${message} (${progress.loaded}/${progress.total})`);
    });
    let summary = await session.summarize(text);
    session.destroy();
    return summary;
  } catch (e) {
    console.log('Summary generation failed');
    console.error(e);
    return 'Error: ' + e.message;
  } finally {
    // Hide loading animation when summary generation is complete (success or failure)
    loadingElement.style.display = 'none';
  }
}

async function createSummarizationSession(downloadProgressCallback) {
  if (!window.ai || !window.ai.summarizer) {
    throw new Error('AI Summarization is not supported in this browser');
  }
  const canSummarize = await window.ai.summarizer.capabilities();
  if (canSummarize.available === 'no') {
    throw new Error('AI Summarization is not availabe');
  }

  const summarizationSession = await window.ai.summarizer.create();
  if (canSummarize.available === 'after-download') {
    if (downloadProgressCallback) {
      summarizationSession.addEventListener(
        'downloadprogress',
        downloadProgressCallback
      );
    }
    await summarizationSession.ready;
  }

  return summarizationSession;
}

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
