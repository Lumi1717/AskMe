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
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: function(node) {
          if (!node.parentElement) return NodeFilter.FILTER_REJECT;
          const style = window.getComputedStyle(node.parentElement);
          if (style.display === 'none' || style.visibility === 'hidden') {
            return NodeFilter.FILTER_REJECT;
          }
          return NodeFilter.FILTER_ACCEPT;
        }
      },
      false
    );

    let textContent = '';
    let node;
    while ((node = walker.nextNode())) {
      textContent += node.textContent.trim() + ' ';
    }

    return textContent.trim();
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