chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "sendContent") {
    fetch("https://your-service-url.com/api/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: message.data })
    })
    .then(res => res.text())
    .then(console.log)
    .catch(console.error);
  }
});
