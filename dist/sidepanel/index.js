
// const { GoogleGenerativeAI } = '../node_modules/@google/generative-ai/dist/index.mjs';
// import { GoogleGenerativeAI } from "@google/generative-ai";

import { GoogleAIFileManager } from "@google/generative-ai/server";



let pageContent = '';
let processedContent = '';
const API_KEY = 'AIzaSyDVrYMjYwf7mLpnfIShqDv6vMaXSvfwkZ0';

const warningElement = document.body.querySelector('#warning');
const answerButton = document.body.querySelector('#AnswerButton');
const userInput = document.body.querySelector('#userInput');
const apiResponse = document.body.querySelector('#response');



let generationConfig = {
  temperature: 1
};

chrome.storage.session.get('pageContent', ({ pageContent }) => {
  onContentChange(pageContent);
});

chrome.storage.session.onChanged.addListener((changes) => {
  const pageContent = changes['pageContent'];
  onContentChange(pageContent.newValue);
});



const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({
  // Choose a Gemini model.
  model: "gemini-1.5-flash",
});




// function showLoading() {
//   hide(apiResponse);
//   hide(elementError);
//   show(elementLoading);
// }


async function onContentChange(newContent) {
  if (pageContent == newContent) {
    // no new content, do nothing
    return;
  }

  pageContent = newContent; // Update pageContent with the new content
  console.log('pageContent:', pageContent);
}

// Handle question submission
answerButton.addEventListener('click', async () => {
  const question = userInput.value.trim();
  console.log('Question', question)
  // showLoading();
  try {
    const answer = await getAnswerFromAPI([question, pageContent]); // Send the question and page content to the API
    showResponse(answer);
  } catch (e) {
    showError(e);
  }
});



async function getAnswerFromAPI(question, pageContent) {
  
  // Create a prompt that includes the page content and the user's question
  // const prompt = `Page Content: ${pageContent}\n\nQuestion: ${question}\nAnswer:`;
  
  // Generate the answer using the model
  try {
    const result = await model.generateContent(question, pageContent);
    console.log(result)
    const response = await result.response;
    return response.text(); // Assuming the response is in text format
  }catch (e) {
    console.log('Prompt failed');
    console.error(e);
    console.log('Prompt:', prompt);
    throw e;
  }
}


userInput.addEventListener('input', () => {
  if (userInput.value.trim()) {
    answerButton.removeAttribute('disabled');
  } else {
    answerButton.setAttribute('disabled', '');
  }
});



function showResponse(response) {
  // Display the response in the UI
  apiResponse.textContent = response;
}


function showError(error) {
  // Handle and display errors
  console.error(error);
}