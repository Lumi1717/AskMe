console.log('[Summarizer] Background script loaded');

chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));

// Function to check if content is available
async function checkContent() {
  const result = await chrome.storage.session.get(['pageContent']);
  console.log('[Summarizer] Current stored content:', result.pageContent ? 'Content available' : 'No content');
  return result.pageContent;
}

// Function to extract content
function extractContent() {
  function extractVisibleText() {
    // Get the page title
    const title = document.title;
    
    // Get the main content
    const mainContent = document.querySelector('main, article, [role="main"], .main, #main');
    const content = mainContent || document.body;
    
    // Get all headings
    const headings = Array.from(content.querySelectorAll('h1, h2, h3, h4, h5, h6'))
      .map(h => ({
        level: parseInt(h.tagName[1]),
        text: h.textContent.trim()
      }))
      .filter(h => h.text);

    // Get paragraphs and other text content
    const textElements = Array.from(content.querySelectorAll('p, li, td, th, pre, code, blockquote'))
      .map(el => {
        const text = el.textContent.trim();
        if (!text) return null;

        // Handle code elements specially
        if (el.tagName.toLowerCase() === 'code' || el.tagName.toLowerCase() === 'pre') {
          return {
            type: 'code',
            text: text,
            language: el.getAttribute('data-lang') || el.className.match(/language-(\w+)/)?.[1] || 'plaintext'
          };
        }

        // Handle blockquotes
        if (el.tagName.toLowerCase() === 'blockquote') {
          return {
            type: 'quote',
            text: text
          };
        }

        // Handle list items
        if (el.tagName.toLowerCase() === 'li') {
          return {
            type: 'list-item',
            text: text
          };
        }

        // Regular paragraphs
        return {
          type: 'paragraph',
          text: text
        };
      })
      .filter(el => el !== null);

    // Structure the content
    const structuredContent = {
      title: title,
      headings: headings,
      elements: textElements,
      url: window.location.href,
      timestamp: new Date().toISOString()
    };

    // Convert to a more readable format for the LLM
    let formattedContent = `Title: ${title}`;
    
    // Add headings with proper hierarchy
    headings.forEach(h => {
      formattedContent += `${'#'.repeat(h.level)} ${h.text}\n`;
    });
    
    formattedContent += '\n';
    
    // Add other elements with proper formatting
    textElements.forEach(el => {
      switch (el.type) {
        case 'code':
          formattedContent += `\nCode (${el.language}):\n\`\`\`${el.language}\n${el.text}\n\`\`\`\n\n`;
          break;
        case 'quote':
          formattedContent += `> ${el.text}\n\n`;
          break;
        case 'list-item':
          formattedContent += `- ${el.text}\n`;
          break;
        case 'paragraph':
          formattedContent += `${el.text}\n\n`;
          break;
      }
    });

    console.log('[Summarizer] Content extracted and structured');
    return formattedContent;
  }

  const extractedText = extractVisibleText();
  console.log('[Summarizer] Content extracted:', extractedText.substring(0, 100) + '...');
  return extractedText;
}

// Listen for tab updates
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url?.startsWith('http')) {
    try {
      console.log('[Summarizer] Injecting content extraction into tab:', tabId);
      const results = await chrome.scripting.executeScript({
        target: { tabId },
        func: extractContent
      });
      
      if (results && results[0] && results[0].result) {
        const content = results[0].result;
        console.log('[Summarizer] Content extracted successfully');
        await chrome.storage.session.set({ pageContent: content });
        console.log('[Summarizer] Content saved to storage');
      } else {
        console.error('[Summarizer] No content was extracted');
      }
    } catch (error) {
      console.error('[Summarizer] Failed to extract content:', error);
    }
  }
});

// Listen for tab activation
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    if (tab.url?.startsWith('http')) {
      console.log('[Summarizer] Injecting content extraction into activated tab:', activeInfo.tabId);
      const results = await chrome.scripting.executeScript({
        target: { tabId: activeInfo.tabId },
        func: extractContent
      });
      
      if (results && results[0] && results[0].result) {
        const content = results[0].result;
        console.log('[Summarizer] Content extracted successfully');
        await chrome.storage.session.set({ pageContent: content });
        console.log('[Summarizer] Content saved to storage');
      } else {
        console.error('[Summarizer] No content was extracted');
      }
    }
  } catch (error) {
    console.error('[Summarizer] Failed to extract content:', error);
  }
});

// Initial content check
checkContent();