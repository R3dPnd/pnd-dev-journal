import { useState } from "react";
import PndButton from "../../common/components/button/button";
import PndLeftNav from "../../componets/left-nav/left-nav";
import "./entry_page.scss";
import PndEntry from "../../componets/entry/entry";
import { Entry, entries } from "../../constants/entris";
import { useIsMobile } from "../../hooks/useMediaQuery";

export default function EntryPage() {
  const isMobile = useIsMobile();

  const [entry, setEntry] = useState<Entry>(entries[0]);
  const [hidLeftNav, setHidLeftNav] = useState<boolean>(isMobile);
  // Check specific media queries

  const entryButtons = entries.map((entry) => {
    return <PndButton onClick={() => setEntry(entry)}>{entry.title}</PndButton>;
  });

  return (
    <div className="home-page page__main">
      <div className="page__main__sidebar">
        {hidLeftNav ? null : <PndLeftNav>{entryButtons}</PndLeftNav>}
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
