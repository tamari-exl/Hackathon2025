import { LlmService } from './LlmCaller.js';

const llmService = new LlmService();

/**
 * Calls the LLM and returns the generated test cases.
 *
 * @param {{ title: string, content: string }} data
 * @returns {Promise<object[]>} - array of TestRail-formatted test cases
 */
export async function generateAndPushTestCases(data) {
  console.log(`[UTWizService] ▶ Generating test cases for: "${data?.title}"`);
  const testCases = await llmService.sendMessage(data);
  console.log(`[UTWizService] LLM returned ${testCases.length} test case(s)`);
  return testCases;
}
