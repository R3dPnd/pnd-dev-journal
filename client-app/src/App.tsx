import './App.scss';

import { BrowserRouter, Routes, Route } from "react-router-dom";

import PndHeader from './common/components/header/header';
import { DarkTheme, LightTheme } from './constants/colors';
import PndThemeToggle from './common/components/them_toggle/theme-toggle';
import EntryPage from './pages/entryPage/entry_page';
import { useIsMobile } from './hooks/useMediaQuery';

function App() {
  const isMobile = useIsMobile(); // (max-width: 480px)

  return (
    <div className="App">
      <PndHeader Title='Dev Journal' SubTitle='Preston Harms' IconPath='img/rd_pnd_2025_rd_128.png'>
        <PndThemeToggle DarkTheme={DarkTheme} LightTheme={LightTheme}/>
      </PndHeader>
      <BrowserRouter>
      <Routes>
          <Route index element={<EntryPage/>} />
      </Routes>
    </BrowserRouter>
    </div>
  );
}

export default App;
