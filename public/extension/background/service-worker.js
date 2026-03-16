// Nairi AI Extension Service Worker

const NAIRI_BASE_URL = 'http://localhost:3000';

// Create context menus on install
chrome.runtime.onInstalled.addListener(() => {
  // Ask Nairi about selected text
  chrome.contextMenus.create({
    id: 'askNairi',
    title: 'Ask Nairi about "%s"',
    contexts: ['selection']
  });

  // Explain selected text
  chrome.contextMenus.create({
    id: 'explainText',
    title: 'Explain this with Nairi',
    contexts: ['selection']
  });

  // Translate selected text
  chrome.contextMenus.create({
    id: 'translateText',
    title: 'Translate with Nairi',
    contexts: ['selection']
  });

  // Save to Knowledge Graph
  chrome.contextMenus.create({
    id: 'saveToKnowledge',
    title: 'Save to Nairi Knowledge Graph',
    contexts: ['selection', 'page']
  });

  // Analyze image
  chrome.contextMenus.create({
    id: 'analyzeImage',
    title: 'Analyze image with Nairi',
    contexts: ['image']
  });

  // Separator
  chrome.contextMenus.create({
    id: 'separator1',
    type: 'separator',
    contexts: ['selection', 'page', 'image']
  });

  // Generate similar image
  chrome.contextMenus.create({
    id: 'generateSimilar',
    title: 'Generate similar image with Nairi',
    contexts: ['image']
  });

  // Summarize page
  chrome.contextMenus.create({
    id: 'summarizePage',
    title: 'Summarize this page with Nairi',
    contexts: ['page']
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  switch (info.menuItemId) {
    case 'askNairi':
      handleAskNairi(info.selectionText, tab);
      break;
    case 'explainText':
      handleExplainText(info.selectionText, tab);
      break;
    case 'translateText':
      handleTranslateText(info.selectionText, tab);
      break;
    case 'saveToKnowledge':
      handleSaveToKnowledge(info, tab);
      break;
    case 'analyzeImage':
      handleAnalyzeImage(info.srcUrl, tab);
      break;
    case 'generateSimilar':
      handleGenerateSimilar(info.srcUrl, tab);
      break;
    case 'summarizePage':
      handleSummarizePage(tab);
      break;
  }
});

// Handler functions
function handleAskNairi(text, tab) {
  const prompt = `I have a question about this text from ${tab.title}:\n\n"${text}"\n\nPlease help me understand this.`;
  openChatWithPrompt(prompt);
}

function handleExplainText(text, tab) {
  const prompt = `Please explain the following text in simple terms:\n\n"${text}"\n\nSource: ${tab.title}`;
  openChatWithPrompt(prompt);
}

function handleTranslateText(text, tab) {
  const prompt = `Please translate the following text to English:\n\n"${text}"`;
  openChatWithPrompt(prompt);
}

async function handleSaveToKnowledge(info, tab) {
  const content = info.selectionText || '';
  
  try {
    const response = await fetch(`${NAIRI_BASE_URL}/api/knowledge/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: tab.title,
        url: tab.url,
        content: content,
        type: 'webpage'
      })
    });

    if (response.ok) {
      // Show success notification
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: 'Nairi AI',
        message: 'Saved to Knowledge Graph!'
      });
    }
  } catch (error) {
    console.error('Failed to save to knowledge:', error);
  }
}

function handleAnalyzeImage(imageUrl, tab) {
  const prompt = `Please analyze this image and describe what you see:\n\nImage URL: ${imageUrl}\n\nSource page: ${tab.title}`;
  openChatWithPrompt(prompt);
}

function handleGenerateSimilar(imageUrl, tab) {
  // Store image URL and open image generator
  chrome.storage.local.set({ referenceImage: imageUrl }, () => {
    chrome.tabs.create({ url: `${NAIRI_BASE_URL}/chat?mode=image&reference=${encodeURIComponent(imageUrl)}` });
  });
}

function handleSummarizePage(tab) {
  const prompt = `Please summarize this webpage:\n\nTitle: ${tab.title}\nURL: ${tab.url}`;
  openChatWithPrompt(prompt);
}

function openChatWithPrompt(prompt) {
  const encodedPrompt = encodeURIComponent(prompt);
  chrome.tabs.create({ url: `${NAIRI_BASE_URL}/chat?prompt=${encodedPrompt}` });
}

// Handle messages from content script or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'OPEN_CHAT':
      openChatWithPrompt(message.prompt || '');
      sendResponse({ success: true });
      break;
    case 'SAVE_TO_KNOWLEDGE':
      handleSaveToKnowledge({ selectionText: message.content }, { title: message.title, url: message.url });
      sendResponse({ success: true });
      break;
    default:
      sendResponse({ success: false, error: 'Unknown message type' });
  }
  return true; // Keep message channel open for async response
});

// Handle keyboard shortcuts
chrome.commands.onCommand.addListener((command) => {
  switch (command) {
    case 'open-nairi':
      chrome.tabs.create({ url: `${NAIRI_BASE_URL}/chat` });
      break;
    case 'quick-ask':
      // Open side panel for quick ask
      chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
        chrome.sidePanel.open({ tabId: tab.id });
      });
      break;
  }
});
