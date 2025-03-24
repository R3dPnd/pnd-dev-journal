import './App.scss';
import { getMarkdown } from './common/services/mark-down-service';
import PndHeader from './common/components/header/header';
import { DarkTheme, LightTheme } from './constants/colors';
import PndThemeToggle from './common/components/them_toggle/theme-toggle';
import PndLeftNav from './componenets/left-nav/left-nav';
import PndButton from './common/components/button/button';

function App() {

  let markdown = "https://github.com/Medium/medium-api-docs/blob/master/README.md";

  getMarkdown(markdown).then((response) => {
    console.log(response.data);
  }
  ).catch((error) => {
    console.error(error);
  });

  return (
    <div className="App">
      <PndHeader Title='Dev Journal' SubTitle='Preston Harms' IconPath='img/rd_pnd_2025_rd_128.png'>
        <PndThemeToggle DarkTheme={DarkTheme} LightTheme={LightTheme}/>
      </PndHeader>
        <PndLeftNav>
          <PndButton label="Home" onClick={()=> console.log("Game Over")}/>
      </PndLeftNav>
    </div>
  );
}

export default App;
