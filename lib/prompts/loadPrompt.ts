import { readFile } from "node:fs/promises";
import path from "node:path";

const promptCache = new Map<string, string>();

export async function loadPrompt(fileName: string): Promise<string> {
  if (promptCache.has(fileName)) {
    return promptCache.get(fileName)!;
  }

  const absolutePath = path.join(process.cwd(), "prompts", fileName);
  const content = await readFile(absolutePath, "utf-8");
  promptCache.set(fileName, content);
  return content;
}

