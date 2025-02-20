import './App.scss';
import { getMarkdown } from './common/services/mark-down-service';
import Header from './common/components/header/header';
import { DarkTheme, LightTheme } from './constants/colors';
import ThemeToggle from './common/components/them_toggle/theme-toggle';

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
      <Header Title='Dev Journal' SubTitle='Preston Harms' IconPath='img/rd_pnd_2025_rd_128.png'>
        <ThemeToggle DarkTheme={DarkTheme} LightTheme={LightTheme}/>
      </Header>
    </div>
  );
}

export default App;
