# Welcome to My Dev Journal

This is a sample markdown file that demonstrates how to read and display markdown content in your React application.

## Features

- **Markdown Support**: Read markdown files from the public folder
- **Dynamic Loading**: Load different markdown files based on user interaction
- **Error Handling**: Graceful error handling when files can't be loaded

## Code Example

```javascript
const readMarkdownFile = async (filePath) => {
  const response = await fetch(filePath);
  const content = await response.text();
  return content;
};
```

## Next Steps

1. Install a markdown parser like `react-markdown`
2. Replace the `<pre>` tag with proper markdown rendering
3. Add styling for the rendered markdown content

---

*This file is located in the `public` folder and can be accessed via the web server.* 