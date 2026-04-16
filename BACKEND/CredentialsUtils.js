/**
 * Load credentials from chrome sync storage.
 */
export async function loadCredentials() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['testrailUserName', 'testrailPassword', 'llmApiUrl', 'llmToken'], (data) => {
      resolve({
        testrailUserName: data.testrailUserName?.trim() || '',
        testrailPassword: data.testrailPassword || '',
        llmApiUrl: data.llmApiUrl?.trim() || '',
        llmToken: data.llmToken || ''
      });
    });
  });
}

/**
 * Save credentials to chrome sync storage.
 */
export async function saveCredentials({ testrailUserName, testrailPassword, llmApiUrl, llmToken }) {
  return new Promise((resolve) => {
    chrome.storage.sync.set({ testrailUserName, testrailPassword, llmApiUrl, llmToken }, () => resolve());
  });
}