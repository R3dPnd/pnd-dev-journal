import { useState } from 'react';
import PndButton from '../../common/components/button/button';
import PndLeftNav from '../../componets/left-nav/left-nav';
import './entry_page.scss';
import PndEntry from '../../componets/entry/entry';
import { Entry, entries } from '../../constants/entris';
import { projects } from '../../constants/projects';
import { useIsMobile } from '../../hooks/useMediaQuery';

type NavSection = 'journal' | 'projects';

export default function EntryPage() {
  const isMobile = useIsMobile();
  const [entry, setEntry] = useState<Entry>(entries[0]);
  const [hidLeftNav, setHidLeftNav] = useState<boolean>(isMobile);
  const [navSection, setNavSection] = useState<NavSection>('journal');

  const entryButtons = entries.map((e) => (
    <PndButton key={e.title} onClick={() => setEntry(e)}>
      {e.title}
    </PndButton>
  ));

  const openDannTerminal = (projectId: string) => {
    window.open(`/dann-terminal/${projectId}`, '_blank');
  };

  const projectItems = projects.map((p) => (
    <div key={p.id} className="ep-project-item">
      <div className="ep-project-item__title">{p.title}</div>
      <div className="ep-project-item__desc">{p.description}</div>
      <button
        className="ep-project-item__dann-btn"
        onClick={() => openDannTerminal(p.id)}
        title="Open Dann Terminal"
      >
        <img
          className="ep-project-item__dann-icon"
          src="img/rd_pnd_2025_rd_128.png"
          alt="Dann Terminal"
        />
        <span>Dann Terminal ↗</span>
      </button>
    </div>
  ));

  const navContent = (
    <>
      <div className="ep-nav-tabs">
        <button
          className={`ep-nav-tab ${navSection === 'journal' ? 'ep-nav-tab--active' : ''}`}
          onClick={() => setNavSection('journal')}
        >
          Journal
        </button>
        <button
          className={`ep-nav-tab ${navSection === 'projects' ? 'ep-nav-tab--active' : ''}`}
          onClick={() => setNavSection('projects')}
        >
          Projects
        </button>
      </div>

      {navSection === 'journal' ? entryButtons : projectItems}
    </>
  );

  return (
    <div className="home-page page__main">
      <div className="page__main__sidebar">
        {hidLeftNav ? null : <PndLeftNav>{navContent}</PndLeftNav>}
      </div>
      <div className="page__main__content">
        <PndEntry
          title={entry.title}
          description={entry.description}
          file={entry.file}
        />
      </div>
    </div>
  );
}
