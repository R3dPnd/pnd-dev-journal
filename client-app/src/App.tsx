import './App.css';
import { getMarkdown } from './common/services/mark-down-service';
import Header from './common/components/header/header';

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
      <Header/>
    </div>
  );
}

export default App;
