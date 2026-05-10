const BASE = 'http://localhost:3001/api/terminal';

export interface StartSessionResponse {
  sessionId: string;
  systemPrompt: string;
  ollamaAvailable: boolean;
}

export interface RawLogEntry {
  timestamp: number;
  type: 'user-original' | 'user-improved' | 'claude-response' | 'ollama-summary' | 'direct-user' | 'direct-claude';
  content: string;
}

export interface SessionHistoryResponse {
  goal: string;
  systemPrompt: string;
  rawLog: RawLogEntry[];
  messageCount: number;
}

export async function startSession(
  projectId: string,
  serviceDirectory: string,
  goal: string
): Promise<StartSessionResponse> {
  const res = await fetch(`${BASE}/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectId, serviceDirectory, goal }),
  });
  if (!res.ok) throw new Error(`Failed to start session: ${res.status}`);
  return res.json() as Promise<StartSessionResponse>;
}

export async function getSessionHistory(sessionId: string): Promise<SessionHistoryResponse> {
  const res = await fetch(`${BASE}/${sessionId}/history`);
  if (!res.ok) throw new Error(`Failed to get history: ${res.status}`);
  return res.json() as Promise<SessionHistoryResponse>;
}
