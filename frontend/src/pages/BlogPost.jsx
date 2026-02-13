import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";

import "highlight.js/styles/github-dark.css";

export default function BlogPost() {
  const [params] = useSearchParams();
  const mdUrl = params.get("md");

  const [content, setContent] = useState("");

  useEffect(() => {
    if (!mdUrl) return;

    fetch(mdUrl)
      .then((res) => res.text())
      .then(setContent);
  }, [mdUrl]);

  // 图片路径补全
  const basePath = mdUrl
    ? mdUrl.substring(0, mdUrl.lastIndexOf("/") + 1)
    : "";

  return (
    <div className="min-h-screen bg-neutral-950 p-8">
      <div className="max-w-4xl mx-auto prose prose-invert max-w-none">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeHighlight]}
          components={{
            img: ({ src, ...props }) => {
              let newSrc = src;

              if (!src.startsWith("http") && !src.startsWith("/")) {
                newSrc = basePath + src;
              }

              return (
                <img
                  src={newSrc}
                  className="rounded-xl shadow-xl"
                  {...props}
                />
              );
            },
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
}
