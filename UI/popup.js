document.getElementById("sendBtn").addEventListener("click", async () => {
  // Get the active tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  const messageBox = document.getElementById("message");
  messageBox.textContent = "⏳ Generating...";
  
  // Execute a script in the page to get its content
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => ({data: document.getElementById("content").innerText, 
      title: document.getElementById("title-text").innerText})
  }, (results) => {
    const pageContent = results[0].result.data;
    const title = results[0].result.title;
    // Send to background script
    chrome.runtime.sendMessage({
      action: "sendContent",
      data: pageContent,
      title: title 
    });
  });
});

// Listen for background results
chrome.runtime.onMessage.addListener((msg) => {
  const messageBox = document.getElementById("message");
  if (msg.type === "success") {
    messageBox.textContent = `✅ ${msg.text}`;
    messageBox.className = "success";
    messageBox.style.color = "green";
  } else if (msg.type === "error") {
    messageBox.textContent = `❌ ${msg.text}`;
    messageBox.className = "error";
    messageBox.style.color = "red";
  }
});
