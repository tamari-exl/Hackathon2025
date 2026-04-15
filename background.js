import { TestRailUtils } from "./backend/TestRailUtils.js";
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
    const testRailUtils = new TestRailUtils();
    testRailUtils.createTestRailSection(message.suiteId, message.title)
      .then(res => res.json())
      .then(data => {
        console.log("✅ Fetch successful:", data);
        chrome.runtime.sendMessage({ type: "success", text: "UTs created successfully!" });
      })
      .catch(error => {
        console.error("❌ Fetch failed:", error);
        chrome.runtime.sendMessage({ type: "error", text: "Failed to create UTs." });
      });
    /*fetch("http://127.0.0.1:1234/", { 
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({title: message.title, content: message.data})
    })
      .then(res => res.text())
      .then(data => {
        console.log("✅ Fetch successful:", data);
        chrome.runtime.sendMessage({ type: "success", text: "UTs created successfully!" });
      })
      .catch(error => {
        console.error("❌ Fetch failed:", error);
        chrome.runtime.sendMessage({ type: "error", text: "Failed to create UTs." });
      });
    
    console.log("FROM BACKGROUND: ", message.data);*/
  }
});

const format = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}${month}`;
  }

const getSprintToSearch = () => {
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  return [format(new Date(year, month + 3)), format(new Date(year, month + 2)), format(new Date(year, month + 1)), format(new Date(year, month))];
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "GET_TESTRAIL_CASES") {
    const sprintsToSearch = getSprintToSearch();
    const testRailUtils = new TestRailUtils();
    testRailUtils.fetchTestRailCases()
      .then(res => res.json())
      .then(data =>  data.filter(suite => sprintsToSearch.some(sprint => suite.name.includes(sprint))))
      .then(data => data.sort((a, b) => a.name.localeCompare(b.name)))
      .then(data => sendResponse({ success: true, data }))
      .catch(error => sendResponse({ success: false, error }));
    return true;
  }
});