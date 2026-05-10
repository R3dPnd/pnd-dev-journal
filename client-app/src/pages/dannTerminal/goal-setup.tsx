import React, { useState } from 'react';
import { Project } from '../../constants/projects';

interface Props {
  project: Project;
  onStart: (goal: string) => void;
  loading: boolean;
  error: string | null;
}

export default function GoalSetup({ project, onStart, loading, error }: Props) {
  const [goal, setGoal] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (goal.trim()) onStart(goal.trim());
  };

  return (
    <div className="dt-goal-setup">
      <div className="dt-goal-setup__header">
        <img
          className="dt-goal-setup__icon"
          src="/img/rd_pnd_2025_rd_128.png"
          alt="rd pnd"
        />
        <div className="dt-goal-setup__label">DANN TERMINAL</div>
        <div className="dt-goal-setup__project">{project.title}</div>
        <div className="dt-goal-setup__dir">{project.serviceDirectory}</div>
      </div>

      <form className="dt-goal-setup__form" onSubmit={handleSubmit}>
        <label className="dt-goal-setup__prompt">
          {'>'} Define your session goal
        </label>
        <textarea
          className="dt-goal-setup__input"
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder="e.g. Refactor the authentication module to use JWT tokens..."
          rows={5}
          disabled={loading}
          autoFocus
        />
        {error && <div className="dt-goal-setup__error">{error}</div>}
        <button
          className="dt-goal-setup__btn"
          type="submit"
          disabled={loading || !goal.trim()}
        >
          {loading ? 'INITIALIZING SESSION...' : 'START SESSION >'}
        </button>
      </form>

      <div className="dt-goal-setup__info">
        <span className="dt-goal-setup__info-item">Dann LLM: llama3.2</span>
        <span className="dt-goal-setup__info-sep">|</span>
        <span className="dt-goal-setup__info-item">Claude: claude-sonnet-4-6</span>
      </div>
    </div>
  );
}
