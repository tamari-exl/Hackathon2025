import { TestRailUtils } from "./backend/TestRailUtils.js";
// // Disable extension by default
// chrome.action.disable();

// Enable only for Confluence pages
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  console.log("onUpdated", tab);
  if (changeInfo.status === "complete") {
    if (!tab.url) {
      console.log(tabId + ' no url - rejected for plugin')
      chrome.action.disable(tabId);
      return;
    }

    if (tab.url.match("https://clarivate.atlassian.net/wiki/")) {
      console.log(tabId + ' confirmed for plugin')
      chrome.action.enable(tabId);
    } else {
      console.log(tabId + ' rejected for plugin')
      chrome.action.disable(tabId);
    }
  }
});

// chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
//     if(changeInfo.status === "complete"){
//         if (isAllowedUrl(tab.url)) {
//             if(tab.url.match(solrUri)){
//                 chrome.scripting.executeScript({
//                     target: {tabId: tabId},
//                     files: ['content_scripts/solr/build_solr_dashboard.js']
//                 });
//             }
//             console.log(tabId + ' confirmed for plugin')
//             chrome.action.enable(tabId);
//             chrome.action.setIcon({
//                 path : "images/conf_38.jpg"
//             });
//         } else {
//             console.log(tabId + ' rejected for plugin')
//             chrome.action.disable(tabId);
//         }
//     }
// });

// Also handle tab switching
// chrome.tabs.onActivated.addListener(activeInfo => {
//   console.log("onActivated");
//   chrome.tabs.get(activeInfo.tabId, tab => {
//     console.log("tab: ", tab);
//     if (!tab.url) {
//       console.log("!tabs[0].url");
//       // chrome.action.setIcon({
//       //   path: "images/disabled_icon.png"
//       // });
//       return;
//     }

//     if (tab.url.startsWith("https://clarivate.atlassian.net/wiki/")) {
//       chrome.action.enable(tab.id);
//     } else {
//       chrome.action.disable(tab.id);
//       chrome.action.setIcon({
//         path: "images/disabled_icon.png"
//       });
//     }
//   });
// });

chrome.tabs.onActivated.addListener(async function setExtensionIcon(activeInfo) {
  console.log("onActivated", activeInfo);
  try {
    chrome.tabs.query({ active: true }).then((tabs) => {
      console.log("tab: ", tabs[0]);
      if (!tabs[0].url) {
        console.log("!tabs[0].url");
        chrome.action.setIcon({
          path: "images/disabled_icon.png"
        });
        return;
      }

      if (tabs[0].url.match("https://clarivate.atlassian.net/wiki/")) {
        console.log("icon");
        chrome.action.setIcon({
          path: "images/icon.png"
        });

      } else {
        console.log("disabled_icon", chrome);
        chrome.action.setIcon({
          path: "images/disabled_icon.png"
        })
      }
    })
  } catch (error) {
    console.error(error);
    if (error == 'Error: Tabs cannot be edited right now (user may be dragging a tab).') {
      setTimeout(() => setExtensionIcon(activeInfo), 50);
    }
  }
});

// chrome.tabs.onActivated.addListener(async function setExtensionIcon(activeInfo) {
//     try {
//         chrome.tabs.query({active : true}).then((tabs) => {
//             if(isAllowedUrl(tabs[0].url)){
//                 chrome.action.setIcon({
//                     path : "images/conf_38.jpg"
//                 });
//             } else {
//                 chrome.action.setIcon({
//                     path : "images/conf_disabled_38.png"
//                 });
//             }
//         })
//     } catch (error) {
//         console.error(error);
//         if (error == 'Error: Tabs cannot be edited right now (user may be dragging a tab).') {
//             setTimeout(() => setExtensionIcon(activeInfo), 50);
//         }
//     }
// });

// const solrUri = '/solr';
// const allowedUrlsPatterns = ['/primo_library', '/primo-explore', '/mng', '/ng', '/ful', '/infra/', '/rep', '/acq', '/prima', '/discovery', '/nde', solrUri];

// function isAllowedUrl(url){
//     return url.match('(' + allowedUrlsPatterns.join('|') + ')')
// }

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
      body: JSON.stringify({ title: message.title, content: message.data })
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