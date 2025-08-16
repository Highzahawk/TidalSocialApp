// Background script to handle extension icon clicks
chrome.action.onClicked.addListener((tab) => {
  // Only activate on Tidal pages
  if (tab.url && tab.url.includes('tidal.com')) {
    // Send message to content script to toggle the panel
    chrome.tabs.sendMessage(tab.id, { action: 'togglePanel' });
  }
}); 