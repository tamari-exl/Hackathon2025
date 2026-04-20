import { loadCredentials, saveCredentials } from './BACKEND/CredentialsUtils.js';

document.getElementById("sendBtn").addEventListener("click", async () => {
  // Get the active tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  const messageBox = document.getElementById("message");
  messageBox.textContent = "⏳ Generating...";

  // Execute a script in the page to get its content
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => ({
      data: document.getElementById("content").textContent,
      title: document.getElementById("title-text").innerText
    })
  }, (results) => {
    const pageContent = results[0].result.data;
    const title = results[0].result.title;
    const selectedSuite = document.getElementById("dropdown");
    // Send to background script
    chrome.runtime.sendMessage({
      action: "sendContent",
      data: pageContent,
      title: title,
      suiteId: selectedSuite.value
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

const dropdown = document.getElementById("dropdown");
loadTestRailDropdown();

function loadTestRailDropdown() {
  chrome.runtime.sendMessage(
    { type: "GET_TESTRAIL_CASES" },
    (response) => {
      if (!response || !response.success) {
        dropdown.innerHTML = "<option>Error loading</option>";
        return;
      }

      dropdown.innerHTML = "";

      response.data.forEach(testCase => {
        const option = document.createElement("option");
        option.value = testCase.id;
        option.textContent = `${testCase.name}`;
        dropdown.appendChild(option);
      });
    }
  );
}

// ======================================= Settings ========================================
document.addEventListener("DOMContentLoaded", () => {
  const settingsModal = new bootstrap.Modal(document.getElementById('settingsModal'));
  document.getElementById('btnSettings').addEventListener('click', async () => {
    console.log('⚙️ Settings button clicked');
    const creds = await loadCredentials();
    console.log('🔑 Loaded credentials:', Object.keys(creds), Object.values(creds));
    document.getElementById('testrailUserName').value = creds.testrailUserName;
    document.getElementById('testrailPassword').value = creds.testrailPassword;
    document.getElementById('llmToken').value = creds.llmToken;
    document.getElementById('llmApiUrl').value = creds.llmApiUrl;
    document.getElementById('testrailPath').value = creds.testrailPath;
    settingsModal.show();
  });

  document.getElementById('btnSaveSettings').addEventListener('click', async () => {
    console.log('💾 Save settings clicked');
    const creds = {
      testrailUserName: document.getElementById('testrailUserName').value,
      testrailPassword: document.getElementById('testrailPassword').value,
      llmToken: document.getElementById('llmToken').value,
      llmApiUrl: document.getElementById('llmApiUrl').value,
      testrailPath: document.getElementById('testrailPath').value
    };
    console.log('🔑 Saving credentials:', Object.keys(creds), Object.values(creds));
    await saveCredentials(creds);
    settingsModal.hide();
    const messageBox = document.getElementById("message");
    messageBox.textContent = `✅ Settings saved successfully`;
    messageBox.className = "success";
    messageBox.style.color = "green";
    loadTestRailDropdown();
    console.log('✅ Settings saved successfully');
  });
});