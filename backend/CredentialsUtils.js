/**
 * Load credentials from chrome sync storage.
 */
export async function loadCredentials() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['testrailUserName', 'testrailPassword', 'llmApiUrl', 'llmToken', 'testrailPath'], (data) => {
      resolve({
        testrailUserName: data.testrailUserName?.trim() || '',
        testrailPassword: data.testrailPassword || '',
        llmApiUrl: data.llmApiUrl?.trim() || '',
        llmToken: data.llmToken || '',
        testrailPath: data.testrailPath?.trim() || '',
      });
    });
  });
}

/**
 * Save credentials to chrome sync storage.
 */
export async function saveCredentials({ testrailUserName, testrailPassword, llmApiUrl, llmToken, testrailPath }) {
  return new Promise((resolve) => {
    chrome.storage.sync.set({ testrailUserName, testrailPassword, llmApiUrl, llmToken, testrailPath }, () => resolve());
  });
}