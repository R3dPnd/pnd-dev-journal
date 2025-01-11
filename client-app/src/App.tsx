import './App.scss';
import { getMarkdown } from './common/services/mark-down-service';
import Header from './common/components/header/header';
import { useEffect, useState } from 'react';
import Button from './common/components/button/button';
import { DarkTheme, LightTheme, Theme } from './constants/colors';

function App() {
  const [darkTheme, setDarkTheme] = useState(false);

  function setTheme(theme: Theme): void{
    const root = document.documentElement;
    root?.style.setProperty(
      "--background-color",
      theme.backgroundColor
    );
    root?.style.setProperty(
      "--text-color",
      theme.fontColor
    );
    root?.style.setProperty(
      "--primary-color",
      theme.primaryColor
    );
    root?.style.setProperty(
      "--secondary-color",
      theme.secondaryColor
    );
    root?.style.setProperty(
      "--ternary-color",
      theme.ternaryColor
    );
  }

  useEffect(() => {
    let theme = darkTheme ? DarkTheme : LightTheme;
    setTheme(theme);
  }, [darkTheme]);

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
      <Button
        onClick={() =>
          setDarkTheme(!darkTheme)
        }
      >
        {darkTheme
          ? "Switch to Light"
          : "Switch to Dark"}
      </Button>
      </Header>
    </div>
  );
}

export default App;
