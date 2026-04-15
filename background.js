import { TestRailUtils } from "./backend/TestRailUtils.js";
import { LlmService } from './backend/LlmCaller.js';


const ALLOWED_DOMAIN = "https://clarivate.atlassian.net/";
const AI_PLATFORM_URL = 'https://agai-platform-api.dev.int.proquest.com/large-language-models/gpt_41_mini_2025_04_14'; //to be replaced by param
const AI_PLATFORM_API_KEY = 'DemoToken'; //to be replaced by param
const PATH = "Yuval Peleg/Keren Jacobson/UT Wiz/"; //to be replaced by param

function updateIcon(tabId, url) {
  if (!url) return;

  const isAllowed = url.includes(ALLOWED_DOMAIN);

  chrome.action.setIcon({
    tabId,
    path: isAllowed
      ? {
        "16": "images/icon16.png",
        "32": "images/icon32.png",
        "48": "images/icon48.png",
        "128": "images/icon128.png"
      }
      : {
        "16": "images/disabled_icon16.png",
        "32": "images/disabled_icon32.png",
        "48": "images/disabled_icon48.png",
        "128": "images/disabled_icon128.png"
      }
  });

  chrome.action.setTitle({
    tabId,
    title: isAllowed
      ? "Extension active"
      : "Disabled on this site"
  });
  if (isAllowed) {
    chrome.action.enable(tabId);
  } else {
    chrome.action.disable(tabId);
  }
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (!tab.url) return;
  updateIcon(tabId, tab.url);
});

chrome.tabs.onActivated.addListener(async (activeInfo) => {
  const tab = await chrome.tabs.get(activeInfo.tabId);
  if (!tab.url) return;
  updateIcon(activeInfo.tabId, tab.url);
});

async function createUTs(message) {
  try {
    const testRailUtils = new TestRailUtils();
    const data = await testRailUtils.getOrCreateAllTreeSection(
      message.suiteId,
      PATH,
      message.title
    );

    const sectionId = data.id;
    const llmService = new LlmService();
    const testCases = await llmService.sendMessage({
      title: message.title,
      content: message.data,
      apiUrl: AI_PLATFORM_URL,
      apiKey: AI_PLATFORM_API_KEY
    });

    await testRailUtils.postTestRailCases(sectionId, testCases);

    chrome.runtime.sendMessage({
      type: "success",
      text: "UTs created successfully!"
    });

  } catch (error) {
    console.error(error);

    chrome.runtime.sendMessage({
      type: "error",
      text: "Failed to create UTs."
    });
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "sendContent") {
    createUTs(message).then(() => {              
      chrome.runtime.sendMessage({ type: "success", text: "UTs created successfully!" });
    }).catch(() => {
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