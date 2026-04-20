/**
 * Load credentials from chrome sync storage.
 */
export async function loadCredentials() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['llmApiUrl', 'llmToken', 'testrailPath'], (data) => {
      resolve({
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
export async function saveCredentials({ llmApiUrl, llmToken, testrailPath }) {
  return new Promise((resolve) => {
    chrome.storage.sync.set({ llmApiUrl, llmToken, testrailPath }, () => resolve());
  });
}