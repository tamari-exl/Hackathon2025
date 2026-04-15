export class LlmCaller {
  constructor() {
    console.log("LlmCaller initialized");
  }

  async callLLM(prompt, maxTokens, temperature, numOfResults) {
    const {llmToken, llmApiUrl} = await loadCredentials();
    const apiUrl = llmApiUrl;

    console.log("apiUrl: ", apiUrl);

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "x-tracking-token": llmToken,
        },
        body: JSON.stringify({
          prompt: prompt,
          max_tokens: maxTokens,
          temperature: temperature,
          num_results: numOfResults,
        }),
      });

      if (!response.ok) {
        // READ the body here to get the real error message
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }
      const data = await response.json();
      console.log(data);
      return data.results;
    } catch (error) {
      console.error("Error calling LLM API:", error.message);
      throw new Error(`Failed to call LLM API - ${error.message}`);
    }
  }
}