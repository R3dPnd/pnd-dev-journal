import React, { useEffect, useRef, useState } from 'react';
import { RawLogEntry } from '../../services/dann-terminal-api';

const TYPE_LABELS: Record<RawLogEntry['type'], string> = {
  'user-original': 'YOU (original)',
  'user-improved': 'DANN (improved)',
  'claude-response': 'CLAUDE',
  'ollama-summary': 'DANN (summary)',
  'direct-user': 'YOU (direct)',
  'direct-claude': 'CLAUDE (direct)',
};

const TYPE_CLASS: Record<RawLogEntry['type'], string> = {
  'user-original': 'raw-entry--user-orig',
  'user-improved': 'raw-entry--improved',
  'claude-response': 'raw-entry--claude',
  'ollama-summary': 'raw-entry--summary',
  'direct-user': 'raw-entry--direct-user',
  'direct-claude': 'raw-entry--direct-claude',
};

interface Props {
  log: RawLogEntry[];
  onDirectSend: (content: string) => void;
  busy: boolean;
}

export default function RawView({ log, onDirectSend, busy }: Props) {
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [log.length]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !busy) {
      onDirectSend(input.trim());
      setInput('');
    }
  };

  return (
    <div className="dt-raw">
      <div className="dt-raw__header">RAW TERMINAL — direct Claude access</div>
      <div className="dt-raw__log">
        {log.map((entry, i) => (
          <div key={i} className={`dt-raw__entry ${TYPE_CLASS[entry.type]}`}>
            <span className="dt-raw__entry-label">[{TYPE_LABELS[entry.type]}]</span>
            <pre className="dt-raw__entry-content">{entry.content}</pre>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <form className="dt-raw__input-row" onSubmit={handleSend}>
        <span className="dt-raw__prompt">{'>'}</span>
        <input
          className="dt-raw__input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Send directly to Claude (bypasses Dann)..."
          disabled={busy}
          autoComplete="off"
        />
        <button className="dt-raw__send" type="submit" disabled={busy || !input.trim()}>
          SEND
        </button>
      </form>
    </div>
  );
}
