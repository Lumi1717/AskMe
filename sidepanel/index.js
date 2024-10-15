let pageContent = '';

const summaryElement = document.body.querySelector('#summary');
const warningElement = document.body.querySelector('#warning');
const userInputElement = document.body.querySelector('#userInput');
const summarizeButton = document.body.querySelector('#summarizeButton');
const loadingElement = document.body.querySelector('#loading');



chrome.storage.session.get('pageContent', ({ pageContent }) => {
  onContentChange(pageContent);
});

chrome.storage.session.onChanged.addListener((changes) => {
  const pageContent = changes['pageContent'];
  onContentChange(pageContent.newValue);
});

summarizeButton.addEventListener('click', async () => {
  console.log('Button clicked');
  const userQuestion = userInputElement.value; // Use the current page content

  console.log(userQuestion);

  if (!userQuestion) {
    showSummary('Please ask a question!');
    return;
  }
  showSummary('Loading...');
  const answer = await generateAnswer(pageContent, userQuestion); // Now generate an answer instead of a summary
  showSummary(answer);
});


async function onContentChange(newContent) {
    // Hide loading animation as soon as we have content
    loadingElement.style.display = 'none';
    console.log(newContent)
      if (pageContent == newContent) {
        return;
      }
}

async function generateAnswer(content, question) {
  // Combine user question and the content in a single input
  const combinedInput = `The user has a question about the following content:\n\n"${content}"\n\nQuestion: ${question}\n\nPlease provide an answer based on the content above.`;

  try {
    let session = await createQASession((message, progress) => {
      console.log(`${message} (${progress.loaded}/${progress.total})`);
    });

    // Send the combined input to the API
    let answer = await session.summarize(combinedInput);
    session.destroy();
    return answer;
  } catch (e) {
    console.log('Answer generation failed');
    console.error(e);
    return 'Error: ' + e.message;
  }
}


// async function generateAnswer(content, question) {
//   // Show loading animation when starting to generate summary
//   loadingElement.style.display = 'flex';

//   try {
//     let session = await createQASession((message, progress) => {
//       console.log(`${message} (${progress.loaded}/${progress.total})`);
//     });

//     let answer = await session.summarize(content, question);
//     session.destroy();
//     return answer;
//   } catch (e) {
//     console.log('Answer generation failed');
//     console.error(e);
//     return 'Error: ' + e.message;
//   }
// }



async function createQASession(downloadProgressCallback){
  if (!window.ai || !window.ai.summarizer){
    throw new Error('Sum-It is not supported in this browser');
  }
  const canQA = await window.ai.summarizer.capabilities();
  if (canQA.available === 'no') {
    throw new Error('Sum-It is not available');
  }

  const qaSession = await window.ai.summarizer.create();
  if (canQA.available === 'after-download') {
    if (downloadProgressCallback) {
      qaSession.addEventListener(
        'downloadprogress',
        downloadProgressCallback
      );
    }
    await qaSession.ready;
  }

  return qaSession;
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
