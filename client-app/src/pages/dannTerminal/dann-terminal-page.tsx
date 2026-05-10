import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { projects } from '../../constants/projects';
import { startSession } from '../../services/dann-terminal-api';
import { RawLogEntry } from '../../services/dann-terminal-api';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useTTS } from '../../hooks/useTTS';
import GoalSetup from './goal-setup';
import ChatView, { ChatMessage } from './chat-view';
import RawView from './raw-view';
import './dann-terminal.scss';

type BusyState = 'idle' | 'improving' | 'thinking' | 'streaming' | 'summarizing';

export default function DannTerminalPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const project = projects.find((p) => p.id === projectId);

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [goal, setGoal] = useState('');
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  const [view, setView] = useState<'chat' | 'raw'>('chat');
  const [busyState, setBusyState] = useState<BusyState>('idle');
  const [improved, setImproved] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [rawLog, setRawLog] = useState<RawLogEntry[]>([]);
  const [streamBuffer, setStreamBuffer] = useState('');
  const [autoSpeak, setAutoSpeak] = useState(true);

  const { send, status, lastMessage } = useWebSocket(sessionId);
  const { speak } = useTTS();
  const streamingMsgId = useRef<string | null>(null);

  // Handle WebSocket messages
  useEffect(() => {
    if (!lastMessage) return;
    const msg = lastMessage;

    if (msg.type === 'improving') {
      setBusyState('improving');
      if (msg.content) setImproved(msg.content);
    } else if (msg.type === 'thinking') {
      setBusyState('thinking');
      setImproved(null);
    } else if (msg.type === 'chunk') {
      setBusyState('streaming');
      const chunk = msg.content ?? '';
      setStreamBuffer((prev) => {
        const next = prev + chunk;
        if (!streamingMsgId.current) {
          const id = uuidv4();
          streamingMsgId.current = id;
          setMessages((m) => [...m, { id, role: 'dann', content: next, isStreaming: true }]);
        } else {
          setMessages((m) =>
            m.map((x) =>
              x.id === streamingMsgId.current
                ? { ...x, content: next, isStreaming: true }
                : x
            )
          );
        }
        return next;
      });
    } else if (msg.type === 'summarizing') {
      setBusyState('summarizing');
      // Finalize streaming message
      if (streamingMsgId.current) {
        const finalContent = streamBuffer;
        setMessages((m) =>
          m.map((x) =>
            x.id === streamingMsgId.current ? { ...x, isStreaming: false } : x
          )
        );
        setRawLog((prev) => [
          ...prev,
          { timestamp: Date.now(), type: 'claude-response', content: finalContent },
        ]);
        streamingMsgId.current = null;
        setStreamBuffer('');
      }
    } else if (msg.type === 'summary') {
      const summary = msg.content ?? '';
      setRawLog((prev) => [...prev, { timestamp: Date.now(), type: 'ollama-summary', content: summary }]);
      // Replace the last dann message with the summary
      setMessages((m) => {
        const lastIdx = [...m].reverse().findIndex((x) => x.role === 'dann');
        if (lastIdx === -1) return m;
        const idx = m.length - 1 - lastIdx;
        const updated = [...m];
        updated[idx] = { ...updated[idx], content: summary, isStreaming: false };
        return updated;
      });
      if (autoSpeak) speak(summary);
    } else if (msg.type === 'done') {
      setBusyState('idle');
      setStreamBuffer('');
      streamingMsgId.current = null;
    } else if (msg.type === 'warning') {
      console.warn('Dann Terminal warning:', msg.message);
    } else if (msg.type === 'error') {
      setBusyState('idle');
      setMessages((m) => [
        ...m,
        { id: uuidv4(), role: 'dann', content: `Error: ${msg.message ?? 'Unknown error'}` },
      ]);
    }
  }, [lastMessage]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleStart = async (goalText: string) => {
    if (!project) return;
    setStarting(true);
    setStartError(null);
    try {
      const { sessionId: id } = await startSession(project.id, project.serviceDirectory, goalText);
      setGoal(goalText);
      setSessionId(id);
    } catch (err) {
      setStartError(`Could not connect to Dann Terminal server. Is it running on port 3001? ${(err as Error).message}`);
    } finally {
      setStarting(false);
    }
  };

  const handleSend = (content: string) => {
    if (busyState !== 'idle') return;
    setMessages((m) => [...m, { id: uuidv4(), role: 'user', content }]);
    setRawLog((prev) => [...prev, { timestamp: Date.now(), type: 'user-original', content }]);
    send({ type: 'message', content });
  };

  const handleDirectSend = (content: string) => {
    if (busyState !== 'idle') return;
    setRawLog((prev) => [...prev, { timestamp: Date.now(), type: 'direct-user', content }]);
    send({ type: 'raw-message', content });
  };

  if (!project) {
    return (
      <div className="dt-page dt-page--error">
        <div className="dt-error">Project "{projectId}" not found.</div>
      </div>
    );
  }

  if (!sessionId) {
    return (
      <div className="dt-page dt-page--setup">
        <GoalSetup project={project} onStart={handleStart} loading={starting} error={startError} />
      </div>
    );
  }

  return (
    <div className="dt-page">
      <div className="dt-topbar">
        <div className="dt-topbar__left">
          <img className="dt-topbar__icon" src="/img/rd_pnd_2025_rd_128.png" alt="rd pnd" />
          <span className="dt-topbar__title">DANN TERMINAL</span>
          <span className="dt-topbar__sep">|</span>
          <span className="dt-topbar__project">{project.title}</span>
          <span className="dt-topbar__goal" title={goal}>{goal}</span>
        </div>
        <div className="dt-topbar__right">
          <span className={`dt-topbar__status dt-topbar__status--${status}`}>
            {status === 'connected' ? '● LIVE' : status === 'connecting' ? '○ CONNECTING' : '○ OFFLINE'}
          </span>
          <div className="dt-topbar__tabs">
            <button
              className={`dt-topbar__tab ${view === 'chat' ? 'dt-topbar__tab--active' : ''}`}
              onClick={() => setView('chat')}
            >
              CHAT
            </button>
            <button
              className={`dt-topbar__tab ${view === 'raw' ? 'dt-topbar__tab--active' : ''}`}
              onClick={() => setView('raw')}
            >
              RAW
            </button>
          </div>
        </div>
      </div>

      <div className="dt-body">
        {view === 'chat' ? (
          <ChatView
            messages={messages}
            busyState={busyState}
            improved={improved}
            onSend={handleSend}
            autoSpeak={autoSpeak}
            onToggleAutoSpeak={() => setAutoSpeak((v) => !v)}
          />
        ) : (
          <RawView log={rawLog} onDirectSend={handleDirectSend} busy={busyState !== 'idle'} />
        )}
      </div>
    </div>
  );
}
