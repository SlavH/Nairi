// Nairi AI Extension Popup Script

const NAIRI_BASE_URL = 'http://localhost:3000';

// DOM Elements
const openChatBtn = document.getElementById('openChat');
const summarizePageBtn = document.getElementById('summarizePage');
const translatePageBtn = document.getElementById('translatePage');
const explainPageBtn = document.getElementById('explainPage');
const screenshotAnalyzeBtn = document.getElementById('screenshotAnalyze');
const saveToKnowledgeBtn = document.getElementById('saveToKnowledge');
const quickPromptInput = document.getElementById('quickPrompt');
const sendPromptBtn = document.getElementById('sendPrompt');
const openFullAppBtn = document.getElementById('openFullApp');
const openSidePanelBtn = document.getElementById('openSidePanel');
const recentChatsList = document.getElementById('recentChatsList');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadRecentChats();
});

// Open Chat
openChatBtn.addEventListener('click', () => {
  chrome.tabs.create({ url: `${NAIRI_BASE_URL}/chat` });
  window.close();
});

// Summarize Page
summarizePageBtn.addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const prompt = `Please summarize this webpage: ${tab.title}\n\nURL: ${tab.url}`;
  openChatWithPrompt(prompt);
});

// Translate Page
translatePageBtn.addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const prompt = `Please translate the content of this webpage to English: ${tab.title}\n\nURL: ${tab.url}`;
  openChatWithPrompt(prompt);
});

// Explain Page
explainPageBtn.addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const prompt = `Please explain the content of this webpage in simple terms: ${tab.title}\n\nURL: ${tab.url}`;
  openChatWithPrompt(prompt);
});

// Screenshot & Analyze
screenshotAnalyzeBtn.addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  // Capture visible tab
  chrome.tabs.captureVisibleTab(null, { format: 'png' }, (dataUrl) => {
    if (chrome.runtime.lastError) {
      console.error('Screenshot failed:', chrome.runtime.lastError);
      return;
    }
    
    // Store screenshot and open chat
    chrome.storage.local.set({ pendingScreenshot: dataUrl }, () => {
      chrome.tabs.create({ url: `${NAIRI_BASE_URL}/chat?action=analyze-screenshot` });
      window.close();
    });
  });
});

// Save to Knowledge
saveToKnowledgeBtn.addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  // Get page content
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: getPageContent
  }, async (results) => {
    if (results && results[0]) {
      const content = results[0].result;
      
      try {
        const response = await fetch(`${NAIRI_BASE_URL}/api/knowledge/save`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: tab.title,
            url: tab.url,
            content: content
          })
        });
        
        if (response.ok) {
          showNotification('Saved to Knowledge Graph!');
        } else {
          showNotification('Failed to save', 'error');
        }
      } catch (error) {
        console.error('Save failed:', error);
        showNotification('Failed to save', 'error');
      }
    }
  });
});

// Send Quick Prompt
sendPromptBtn.addEventListener('click', () => {
  const prompt = quickPromptInput.value.trim();
  if (prompt) {
    openChatWithPrompt(prompt);
  }
});

// Enter key to send
quickPromptInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendPromptBtn.click();
  }
});

// Open Side Panel
openSidePanelBtn.addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.sidePanel.open({ tabId: tab.id });
  window.close();
});

// Helper Functions
function openChatWithPrompt(prompt) {
  const encodedPrompt = encodeURIComponent(prompt);
  chrome.tabs.create({ url: `${NAIRI_BASE_URL}/chat?prompt=${encodedPrompt}` });
  window.close();
}

function getPageContent() {
  const article = document.querySelector('article');
  const main = document.querySelector('main');
  const body = document.body;
  
  const content = article?.innerText || main?.innerText || body?.innerText || '';
  return content.substring(0, 10000); // Limit content length
}

async function loadRecentChats() {
  try {
    const response = await fetch(`${NAIRI_BASE_URL}/api/conversations?limit=5`);
    if (response.ok) {
      const chats = await response.json();
      renderRecentChats(chats);
    } else {
      recentChatsList.innerHTML = '<p class="empty-state">Sign in to see recent chats</p>';
    }
  } catch (error) {
    recentChatsList.innerHTML = '<p class="empty-state">Could not load chats</p>';
  }
}

function renderRecentChats(chats) {
  if (!chats || chats.length === 0) {
    recentChatsList.innerHTML = '<p class="empty-state">No recent chats</p>';
    return;
  }
  
  recentChatsList.innerHTML = chats.map(chat => `
    <a href="${NAIRI_BASE_URL}/chat/${chat.id}" target="_blank" class="chat-item">
      <svg class="chat-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
      <span class="chat-title">${escapeHtml(chat.title)}</span>
      <span class="chat-time">${formatTime(chat.updated_at)}</span>
    </a>
  `).join('');
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now - date;
  
  if (diff < 60000) return 'now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
  return `${Math.floor(diff / 86400000)}d`;
}

function showNotification(message, type = 'success') {
  // Simple notification - could be enhanced
  alert(message);
}
