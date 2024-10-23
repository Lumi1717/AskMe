
const { GoogleGenerativeAI } = '../node_modules/@google/generative-ai/dist/index.mjs';
let pageContent = '';
let processedContent = '';

const warningElement = document.body.querySelector('#warning');

chrome.storage.session.get('pageContent', ({ pageContent }) => {
  onContentChange(pageContent);
});

chrome.storage.session.onChanged.addListener((changes) => {
  const pageContent = changes['pageContent'];
  onContentChange(pageContent.newValue);
});


// Initialize GoogleGenerativeAI with your API_KEY.

function initModel(generationConfig) {
  genAI = new GoogleGenerativeAI(API_KEY);
  model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    safetySettings,
    generationConfig
  });
  return model;
}



async function onContentChange(newContent) {
  if (pageContent == newContent) {
    // no new content, do nothing
    return;
  }

  pageContent = newContent; // Update pageContent with the new content
  console.log('pageContent:', pageContent);

  const newText = convertPageContentToTextMIME(pageContent)

  console.log(typeof newText)

  console.log(newText.size)

}

function convertPageContentToTextMIME(pageContent) {
    // Create a new Blob with the pageContent and specify the MIME type
    const blob = new Blob([pageContent], { type: 'text/plain' });
    return blob;
}



function readBlobContent(blob) {
  const reader = new FileReader();

  reader.onload = function(event) {
    const content = event.target.result;
    console.log(content); // This will log the actual content of the Blob
  };

  reader.readAsText(blob); // Read as text
}

readBlobContent(newText);
