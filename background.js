import { TestRailUtils } from "./backend/TestRailUtils.js";

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "sendContent") {
    const testRailUtils = new TestRailUtils();
    testRailUtils.getOrCreateAllTreeSection(message.suiteId, "Yuval Peleg/Keren Jacobson/UT Wiz/", message.title)
      .then(data => {
        chrome.runtime.sendMessage({ type: "success", text: "UTs created successfully!" });
      })
      .catch(error => {
        chrome.runtime.sendMessage({ type: "error", text: "Failed to create UTs." });
      });
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "GET_TESTRAIL_CASES") {
    const testRailUtils = new TestRailUtils();
    testRailUtils.fetchTestRailCases()
      .then(data => sendResponse({ success: true, data }))
      .catch(error => sendResponse({ success: false, error }));
    return true;
  }
});