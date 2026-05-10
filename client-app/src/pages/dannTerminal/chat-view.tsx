import React, { useEffect, useRef, useState } from 'react';
import { useTTS } from '../../hooks/useTTS';

export interface ChatMessage {
  id: string;
  role: 'user' | 'dann';
  content: string;
  isStreaming?: boolean;
}

type BusyState = 'idle' | 'improving' | 'thinking' | 'streaming' | 'summarizing';

interface Props {
  messages: ChatMessage[];
  busyState: BusyState;
  improved: string | null;
  onSend: (content: string) => void;
  autoSpeak: boolean;
  onToggleAutoSpeak: () => void;
}

const BUSY_LABELS: Record<BusyState, string> = {
  idle: '',
  improving: 'Dann is refining your message...',
  thinking: 'Waiting for Claude...',
  streaming: 'Claude is responding...',
  summarizing: 'Dann is summarizing...',
};

export default function ChatView({
  messages,
  busyState,
  improved,
  onSend,
  autoSpeak,
  onToggleAutoSpeak,
}: Props) {
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const { speak, stop, isSpeaking, voiceName } = useTTS();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, busyState]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && busyState === 'idle') {
      onSend(input.trim());
      setInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && busyState === 'idle') {
        onSend(input.trim());
        setInput('');
      }
    }
  };

  return (
    <div className="dt-chat">
      <div className="dt-chat__messages">
        {messages.map((msg) => (
          <div key={msg.id} className={`dt-chat__msg dt-chat__msg--${msg.role}`}>
            <span className="dt-chat__msg-label">{msg.role === 'user' ? 'YOU' : 'DANN'}</span>
            <div className="dt-chat__msg-content">
              {msg.content}
              {msg.isStreaming && <span className="dt-chat__cursor" />}
            </div>
            {msg.role === 'dann' && !msg.isStreaming && (
              <button
                className="dt-chat__speak-btn"
                onClick={() => (isSpeaking ? stop() : speak(msg.content))}
              >
                {isSpeaking ? '⏹ STOP' : '▶ SPEAK'}
              </button>
            )}
          </div>
        ))}

        {busyState !== 'idle' && (
          <div className="dt-chat__status">
            <span className="dt-chat__status-dot" />
            {BUSY_LABELS[busyState]}
            {busyState === 'improving' && improved && (
              <div className="dt-chat__improved">Refined: {improved}</div>
            )}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="dt-chat__footer">
        <div className="dt-chat__tts-bar">
          <span className="dt-chat__voice-name">Voice: {voiceName}</span>
          <button
            className={`dt-chat__autospeak ${autoSpeak ? 'dt-chat__autospeak--on' : ''}`}
            onClick={onToggleAutoSpeak}
          >
            Auto-speak: {autoSpeak ? 'ON' : 'OFF'}
          </button>
          {isSpeaking && (
            <button className="dt-chat__stop-tts" onClick={stop}>
              ⏹ STOP
            </button>
          )}
        </div>

        <form className="dt-chat__input-row" onSubmit={handleSend}>
          <textarea
            className="dt-chat__input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Talk to Dann... (Enter to send, Shift+Enter for newline)"
            disabled={busyState !== 'idle'}
            rows={2}
          />
          <button
            className="dt-chat__send"
            type="submit"
            disabled={busyState !== 'idle' || !input.trim()}
          >
            SEND
          </button>
        </form>
      </div>
    </div>
  );
}
