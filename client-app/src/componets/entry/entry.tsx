import { useState } from "react";
import "./entry.scss";
import { remark } from "remark";
import ReactMarkdown from "react-markdown";

interface Props {
  title: string;
  description: string;
  file: string;
}

const readPublicFile = async (file: string) => {
  try {
    const response = await fetch(`/entries/${file}`);
    const content = await response.text();
    return content;
  } catch (error) {
    console.error("Error reading file:", error);
  }
}; // (min-width: 769px)

export default function PndEntry({ title, description, file }: Props) {
  const [content, setContent] = useState<string>("");

  readPublicFile(file).then((content) => {
    remark()
    .process(content)
    .then((result) => {
      setContent(result.toString());
    });
  });

  return (
    <div className="entry-container">
      <h1>{title}</h1>
        <ReactMarkdown>
            {content}
        </ReactMarkdown>
    </div>
  );
}
