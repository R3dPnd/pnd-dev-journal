const OLLAMA_BASE = 'http://localhost:11434';
export const DEFAULT_MODEL = 'llama3.2';

async function generate(prompt: string, model = DEFAULT_MODEL): Promise<string> {
  const res = await fetch(`${OLLAMA_BASE}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, prompt, stream: false }),
  });
  if (!res.ok) throw new Error(`Ollama error: ${res.status}`);
  const data = await res.json() as { response: string };
  return data.response.trim();
}

export async function isAvailable(): Promise<boolean> {
  try {
    const res = await fetch(`${OLLAMA_BASE}/api/tags`, { signal: AbortSignal.timeout(2000) });
    return res.ok;
  } catch {
    return false;
  }
}

export async function generateSystemPrompt(goal: string, projectContext: string): Promise<string> {
  const prompt = `You are helping configure a Claude AI assistant for a development session.

Goal: ${goal}

Project context:
${projectContext}

Write a concise but comprehensive system prompt for Claude that sets the project context and frames the session goal. Return ONLY the system prompt text with no preamble.`;
  return generate(prompt);
}

export async function improveMessage(userMessage: string, goal: string): Promise<string> {
  const prompt = `You are optimizing a developer's message to an AI coding assistant.

Session goal: ${goal}
Original message: "${userMessage}"

Rewrite this to be clearer and more specific for an AI coding assistant. Return ONLY the improved message.`;
  return generate(prompt);
}

export async function summarizeResponse(response: string): Promise<string> {
  const prompt = `Summarize the following AI response in 2-3 concise sentences suitable for text-to-speech. Focus on key actions or answers. Return ONLY the summary.

Response:
${response}`;
  return generate(prompt);
}
