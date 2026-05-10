import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import terminalRoutes from './routes/terminal';
import { getSession, updateSession } from './session-store';
import { isAvailable, improveMessage, summarizeResponse } from './services/ollama';
import { streamClaude } from './services/claude';
import { RawLogEntry, WsIncoming, WsOutgoing } from './types';

const PORT = process.env.PORT ?? 3001;

const app = express();
app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());
app.use('/api/terminal', terminalRoutes);

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

function send(ws: WebSocket, msg: WsOutgoing) {
  if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(msg));
}

async function handleMessage(ws: WebSocket, sessionId: string, content: string, raw: boolean) {
  const session = getSession(sessionId);
  if (!session) {
    send(ws, { type: 'error', message: 'Session not found' });
    return;
  }

  const newRawLog: RawLogEntry[] = [...session.rawLog];
  const ollamaUp = await isAvailable();
  let messageToSend = content;

  if (raw) {
    newRawLog.push({ timestamp: Date.now(), type: 'direct-user', content });
  } else {
    newRawLog.push({ timestamp: Date.now(), type: 'user-original', content });

    if (ollamaUp) {
      send(ws, { type: 'improving' });
      try {
        messageToSend = await improveMessage(content, session.goal);
        newRawLog.push({ timestamp: Date.now(), type: 'user-improved', content: messageToSend });
        send(ws, { type: 'improving', content: messageToSend });
      } catch {
        send(ws, { type: 'warning', message: 'Ollama improvement failed, sending original' });
      }
    } else if (session.rawLog.length === 0) {
      send(ws, { type: 'warning', message: 'Ollama not available — sending messages directly to Claude' });
    }
  }

  const updatedMessages = [...session.claudeMessages, { role: 'user' as const, content: messageToSend }];
  send(ws, { type: 'thinking' });

  let fullResponse = '';
  try {
    for await (const chunk of streamClaude(updatedMessages, session.systemPrompt)) {
      fullResponse += chunk;
      send(ws, { type: 'chunk', content: chunk });
    }
  } catch (err) {
    send(ws, { type: 'error', message: `Claude error: ${(err as Error).message}` });
    return;
  }

  const logType = raw ? 'direct-claude' : 'claude-response';
  newRawLog.push({ timestamp: Date.now(), type: logType, content: fullResponse });

  const finalMessages = [...updatedMessages, { role: 'assistant' as const, content: fullResponse }];

  if (!raw && ollamaUp) {
    send(ws, { type: 'summarizing' });
    try {
      const summary = await summarizeResponse(fullResponse);
      newRawLog.push({ timestamp: Date.now(), type: 'ollama-summary', content: summary });
      send(ws, { type: 'summary', content: summary });
    } catch {
      send(ws, { type: 'done' });
    }
  }

  updateSession(sessionId, { claudeMessages: finalMessages, rawLog: newRawLog });
  send(ws, { type: 'done' });
}

wss.on('connection', (ws) => {
  let sessionId: string | null = null;

  ws.on('message', async (data) => {
    let msg: WsIncoming;
    try {
      msg = JSON.parse(data.toString()) as WsIncoming;
    } catch {
      return;
    }

    if (msg.type === 'attach' && msg.sessionId) {
      const session = getSession(msg.sessionId);
      if (!session) {
        send(ws, { type: 'error', message: 'Session not found' });
        return;
      }
      sessionId = msg.sessionId;
      send(ws, { type: 'attached' });
      return;
    }

    if (!sessionId) {
      send(ws, { type: 'error', message: 'Not attached to a session' });
      return;
    }

    if (msg.type === 'message' && msg.content) {
      await handleMessage(ws, sessionId, msg.content, false);
    } else if (msg.type === 'raw-message' && msg.content) {
      await handleMessage(ws, sessionId, msg.content, true);
    }
  });
});

server.listen(PORT, () => {
  console.log(`Dann Terminal server running on http://localhost:${PORT}`);
});
