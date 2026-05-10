export interface RawLogEntry {
  timestamp: number;
  type: 'user-original' | 'user-improved' | 'claude-response' | 'ollama-summary' | 'direct-user' | 'direct-claude';
  content: string;
}

export interface Session {
  id: string;
  projectId: string;
  serviceDirectory: string;
  goal: string;
  systemPrompt: string;
  claudeMessages: Array<{ role: 'user' | 'assistant'; content: string }>;
  rawLog: RawLogEntry[];
  createdAt: number;
}

export interface WsIncoming {
  type: 'attach' | 'message' | 'raw-message';
  sessionId?: string;
  content?: string;
}

export interface WsOutgoing {
  type: 'attached' | 'improving' | 'thinking' | 'chunk' | 'summarizing' | 'summary' | 'done' | 'error' | 'warning';
  content?: string;
  message?: string;
}
