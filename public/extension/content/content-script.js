// Nairi AI Extension Content Script

// Create floating action button
function createFloatingButton() {
  const button = document.createElement('div');
  button.id = 'nairi-fab';
  button.innerHTML = `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  `;
  button.title = 'Ask Nairi';
  
  button.addEventListener('click', () => {
    const selection = window.getSelection().toString().trim();
    if (selection) {
      chrome.runtime.sendMessage({
        type: 'OPEN_CHAT',
        prompt: `Please help me with this: "${selection}"`
      });
    } else {
      chrome.runtime.sendMessage({ type: 'OPEN_CHAT' });
    }
  });
  
  document.body.appendChild(button);
}

// Show floating button when text is selected
let selectionTimeout;
document.addEventListener('mouseup', (e) => {
  clearTimeout(selectionTimeout);
  
  selectionTimeout = setTimeout(() => {
    const selection = window.getSelection().toString().trim();
    const fab = document.getElementById('nairi-fab');
    
    if (selection && selection.length > 0) {
      if (!fab) {
        createFloatingButton();
      }
      
      const fabElement = document.getElementById('nairi-fab');
      if (fabElement) {
        fabElement.style.display = 'flex';
        fabElement.style.left = `${e.pageX + 10}px`;
        fabElement.style.top = `${e.pageY + 10}px`;
      }
    } else if (fab) {
      fab.style.display = 'none';
    }
  }, 200);
});

// Hide button when clicking elsewhere
document.addEventListener('mousedown', (e) => {
  const fab = document.getElementById('nairi-fab');
  if (fab && !fab.contains(e.target)) {
    fab.style.display = 'none';
  }
});

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'GET_PAGE_CONTENT':
      const content = getPageContent();
      sendResponse({ content });
      break;
    case 'GET_SELECTION':
      const selection = window.getSelection().toString();
      sendResponse({ selection });
      break;
    default:
      sendResponse({ error: 'Unknown message type' });
  }
  return true;
});

function getPageContent() {
  const article = document.querySelector('article');
  const main = document.querySelector('main');
  const body = document.body;
  
  const content = article?.innerText || main?.innerText || body?.innerText || '';
  return content.substring(0, 15000); // Limit content length
}

console.log('Nairi AI Extension loaded');
