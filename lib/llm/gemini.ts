import { GoogleGenerativeAI } from "@google/generative-ai";
import { scoreSchema, ScoreResult } from "@/lib/llm/scoreSchema";
import { loadPrompt } from "@/lib/prompts/loadPrompt";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
const LLM_MAX_RETRIES = Number(process.env.LLM_MAX_RETRIES ?? "3");
const LLM_RETRY_BACKOFF_MS = Number(process.env.LLM_RETRY_BACKOFF_MS ?? "1500");

if (!GEMINI_API_KEY) {
  throw new Error("Missing GEMINI_API_KEY (or GOOGLE_GEMINI_API_KEY) in environment variables");
}

const client = new GoogleGenerativeAI(GEMINI_API_KEY);

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryable(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /429|rate limit|timeout|temporar|5\d\d/i.test(message);
}

export async function evaluateWithGemini(input: {
  resumeText: string;
  jobDescription: string;
}): Promise<ScoreResult> {
  const systemPrompt = await loadPrompt("resume-screening-system.md");
  const userPromptTemplate = await loadPrompt("resume-screening-user.md");
  const userPrompt = userPromptTemplate
    .replace("{{JOB_DESCRIPTION}}", input.jobDescription)
    .replace("{{RESUME_TEXT}}", input.resumeText);

  let attempt = 0;
  let lastError: unknown;

  while (attempt <= LLM_MAX_RETRIES) {
    try {
      const model = client.getGenerativeModel({
        model: GEMINI_MODEL,
        systemInstruction: systemPrompt,
      });
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.1,
        },
      });

      const text = result.response.text() ?? "";
      const parsedJson = JSON.parse(text);
      return scoreSchema.parse(parsedJson);
    } catch (error) {
      lastError = error;
      if (attempt === LLM_MAX_RETRIES || !isRetryable(error)) {
        break;
      }

      const delay = LLM_RETRY_BACKOFF_MS * 2 ** attempt;
      await sleep(delay);
      attempt += 1;
    }
  }

  throw lastError instanceof Error ? lastError : new Error("LLM evaluation failed");
}

