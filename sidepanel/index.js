
const { GoogleGenerativeAI } = '../node_modules/@google/generative-ai/dist/index.js';
// Initialize GoogleGenerativeAI with your API_KEY.
const genAI = new GoogleGenerativeAI(API_KEY);


const model = genAI.getGenerativeModel({
  // Choose a Gemini model.
  model: "gemini-1.5-flash",
});



let pageContent = '';

const summaryElement = document.body.querySelector('#summary');
const warningElement = document.body.querySelector('#warning');

chrome.storage.session.get('pageContent', ({ pageContent }) => {
  onContentChange(pageContent);
});

chrome.storage.session.onChanged.addListener((changes) => {
  const pageContent = changes['pageContent'];
  onContentChange(pageContent.newValue);
});

async function onContentChange(newContent) {
  if (pageContent == newContent) {
    // no new content, do nothing
    return;
  }
  console.log(typeof pageContent)

  newText = convertPageContentToTextMIME(pageContent)

  console.log(typeof newText)
}

function convertPageContentToTextMIME(pageContent) {
    // Create a new Blob with the pageContent and specify the MIME type
    const blob = new Blob([pageContent], { type: 'text/plain' });
    return blob;
}
