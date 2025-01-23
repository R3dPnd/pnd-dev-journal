import './App.scss';
import { getMarkdown } from './common/services/mark-down-service';
import Header from './common/components/header/header';
import { useEffect, useState } from 'react';
import Button from './common/components/button/button';
import { DarkTheme, LightTheme, Theme } from './constants/colors';
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
      <Header>
      <ThemeToggle DarkTheme={DarkTheme} LightTheme={LightTheme}/>
      </Header>
    </div>
  );
}

export default App;
