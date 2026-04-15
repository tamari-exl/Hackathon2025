// ============================================================
// LlmCaller.js - LLM integration service
// ============================================================

/**
 * Static configuration for the LLM API.
 */
const LLM_CONFIG = Object.freeze({
  maxTokens:   10000,
  temperature: 0.7,
  numResults:  1,
  streaming:   false,
  imageDetail: 'low',
  topP:        -1,
  reasoning:   'medium',
});

/**
 * Minimal TestRail case shape used as the format example in the prompt.
 * Mirrors the testrail_template list from main.py.
 */
const TESTRAIL_CASE_TEMPLATE = Object.freeze([
  {
    title: 'Login with valid credentials',
    priority_id: 3,
    custom_steps_separated: [
      { content: 'Enter username', expected: 'Username accepted' },
      { content: 'Enter password', expected: 'Login successful' },
    ],
  },
]);

// ============================================================

export class LlmService {
  constructor() {
    console.log('[LlmService] Initialized');
  }

  // ── Prompt building ────────────────────────────────────────

  /**
   * Placeholders: {0} = title, {1} = format, {2} = spec content.
   */
  getPromptTemplate() {
    return `You are an expert Alma developer and QA engineer. 
Your task is to extract testing scenarios from the Functional Specification Document text
and output them as TestRail test cases.

RULES:
1. ✅ OUTPUT MUST BE **ONLY** a JSON array. 
2. ❌ DO NOT include explanation, headers, commentary, quotes, markdown, or prose.
3. ✅ Each object must follow the following structure but each object can have more than one custom_steps_separated:

[
  {
    "title": "<short test case name>",
    "priority_id": 3,
    "custom_steps_separated": [
      { "content": "<step description>", "expected": "<expected result>" }
    ]
  }
]

4. Use the format definition provided below.
5. If any data is unknown, infer reasonable values based on context.
6. If no scenarios are available, return \`[]\`.

TESTRAIL FORMAT:
{1}

INPUT SPECIFICATION:
Title: {0}

The following is the full Functional Specification Document. 
Use ONLY this content to extract and derive unit-level functional tests:

<<< BEGIN SPEC >>>
{2}
<<< END SPEC >>>

Now output ONLY the JSON array.`;
  }

  /**
   * Replaces {0}, {1}, {2} in the template with runtime values.
   * @param {string} title    - document title
   * @param {string} content  - full spec text
   * @returns {string}        - fully-formed prompt string
   */
  buildPrompt(title, content) {
    return this.getPromptTemplate()
      .replace('{0}', title)
      .replace('{1}', JSON.stringify(TESTRAIL_CASE_TEMPLATE, null, 2))
      .replace('{2}', content);
  }

  // ── Response cleanup ───────────────────────────────────────

  /**
   * Strips markdown code fences the LLM sometimes wraps JSON in.
   * @param {string} rawText
   * @returns {string}
   */
  cleanResponse(rawText) {
    return rawText
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim();
  }

  // ── Validation ─────────────────────────────────────────────

  /**
   * Validates that the caller supplied a usable data object.
   * @param {{ title: string, content: string }} data
   * @throws {Error}
   */
  validateInput(data) {
    if (!data || typeof data !== 'object') {
      throw new Error('[LlmService] Invalid input: expected a plain object');
    }
    if (!data.title || typeof data.title !== 'string' || !data.title.trim()) {
      throw new Error('[LlmService] Invalid input: data.title must be a non-empty string');
    }
    if (!data.content || typeof data.content !== 'string' || !data.content.trim()) {
      throw new Error('[LlmService] Invalid input: data.content must be a non-empty string');
    }
  }

  /**
   * Validates the parsed LLM output is a non-empty array of well-formed cases.
   * @param {unknown} parsed
   * @returns {object[]}
   * @throws {Error}
   */
  validateTestCases(parsed) {
    if (!Array.isArray(parsed)) {
      throw new Error('[LlmService] LLM output is not a JSON array');
    }
    for (const [i, tc] of parsed.entries()) {
      if (!tc.title) {
        throw new Error(`[LlmService] Test case at index ${i} is missing required field: title`);
      }
      if (!Array.isArray(tc.custom_steps_separated)) {
        throw new Error(
          `[LlmService] Test case "${tc.title}" is missing required field: custom_steps_separated`
        );
      }
    }
    return parsed;
  }

  // ── Request assembly ───────────────────────────────────────

  /**
   * Builds the full JSON body sent to the LLM endpoint.
   * @param {string} prompt
   * @returns {object}
   */
  buildRequestBody(prompt) {
    return {
      prompt,
      max_tokens:     LLM_CONFIG.maxTokens,
      temperature:    LLM_CONFIG.temperature,
      num_results:    LLM_CONFIG.numResults,
      streaming:      LLM_CONFIG.streaming,
      images:         [],
      image_detail:   LLM_CONFIG.imageDetail,
      seed:           0,
      response_format: {},
      tools:          [],
      tool_choice:    {},
      top_p:          LLM_CONFIG.topP,
      messages:       [],
      timing_debug:   false,
      usage:          false,
      batch:          false,
      reasoning:      LLM_CONFIG.reasoning,
    };
  }

  // ── Main entry point ───────────────────────────────────────

  /**
   * Builds the prompt, calls the LLM, and returns parsed test cases.
   *
   * @param {{ title: string, content: string }} data
   * @returns {Promise<object[]>} - Array of TestRail-formatted test cases
   */
  async sendMessage(data) {
    console.log(`[LlmService] sendMessage called — title: "${data?.title}"`);
    this.validateInput(data);

    const prompt = this.buildPrompt(data.title, data.content);
    console.log('[LlmService] Prompt built successfully');

    const requestBody = this.buildRequestBody(prompt);

    // ── Network call ─────────────────────────────────────────
    let response;
    try {
      response = await fetch(data.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept':        'application/json',
          'x-auth-token':  data.apiKey,
        },
        body: JSON.stringify(requestBody),
      });
    } catch (networkError) {
      console.error('[LlmService] Network error reaching LLM API:', networkError);
      throw new Error(`[LlmService] Network failure: ${networkError.message}`);
    }

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '(unreadable)');
      console.error(`[LlmService] LLM API error ${response.status}:`, errorBody);
      throw new Error(`[LlmService] LLM API returned HTTP ${response.status}: ${errorBody}`);
    }

    // ── Parse HTTP response ──────────────────────────────────
    let responseData;
    try {
      responseData = await response.json();
    } catch (parseError) {
      console.error('[LlmService] Could not parse API response body as JSON:', parseError);
      throw new Error('[LlmService] LLM API returned a non-JSON response body');
    }

    const rawCompletion = responseData?.results?.[0]?.completion;
    if (typeof rawCompletion !== 'string' || !rawCompletion) {
      console.error('[LlmService] Unexpected response shape:', responseData);
      throw new Error(
        '[LlmService] LLM response is missing expected field: results[0].completion'
      );
    }

    // ── Parse LLM output ─────────────────────────────────────
    const cleaned = this.cleanResponse(rawCompletion);
    console.log('[LlmService] Cleaned LLM output:', cleaned);

    let testCases;
    try {
      testCases = JSON.parse(cleaned);
    } catch (jsonError) {
      console.error('[LlmService] Failed to JSON.parse LLM output:', jsonError.message);
      console.error('[LlmService] Cleaned text was:', cleaned);
      throw new Error(`[LlmService] LLM output is not valid JSON: ${jsonError.message}`);
    }

    const validated = this.validateTestCases(testCases);
    console.log(`[LlmService] ✅ ${validated.length} test case(s) parsed and validated`);
    return validated;
  }
}