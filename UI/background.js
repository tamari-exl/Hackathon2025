// // Disable extension by default
// chrome.action.disable();

// // Enable only for TestRail pages
// chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
//   if (!tab.url) return;

//   if (tab.url.startsWith("https://wiki.clarivate.io/")) {
//     chrome.action.enable(tabId);
//   } else {
//     chrome.action.disable(tabId);
//   }
// });

// // Also handle tab switching
// chrome.tabs.onActivated.addListener(activeInfo => {
//   chrome.tabs.get(activeInfo.tabId, tab => {
//     if (!tab.url) return;

//     if (tab.url.startsWith("https://wiki.clarivate.io/")) {
//       chrome.action.enable(tab.id);
//     } else {
//       chrome.action.disable(tab.id);
//     }
//   });
// });

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "sendContent") {
    // fetch("https://your-service-url.com/api/upload", {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify({ content: message.data })
    // })
    // .then(res => res.text())
    // .then(console.log)
    // .catch(console.error);
    fetch("http://127.0.0.1:8000/", { method: "GET" })
      .then(res => res.text())
      .then(data => {
        console.log("✅ Fetch successful:", data);
        chrome.runtime.sendMessage({ type: "success", text: "Data retrieved successfully!" });
      })
      .catch(error => {
        console.error("❌ Fetch failed:", error);
        chrome.runtime.sendMessage({ type: "error", text: "Failed to fetch data from server." });
      });
    
    console.log("FROM BACKGROUND: ", message.data);
  }
});