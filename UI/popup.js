document.getElementById("sendBtn").addEventListener("click", async () => {
  // Get the active tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  // Execute a script in the page to get its content
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => document.getElementById("content").innerText
  }, (results) => {
    const pageContent = results[0].result;
    // Send to background script
    chrome.runtime.sendMessage({ action: "sendContent", data: pageContent });
  });
});
