import React from 'react';
import logo from './logo.svg';
import './App.css';
import Markdown from 'react-markdown';
import axios from 'axios';
import { getMarkdown } from './common/services/mark-down-service';

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
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.tsx</code> and save to reload.
        </p>
        <Markdown>
          {markdown}
          </Markdown>
      </header>
    </div>
  );
}

export default App;
