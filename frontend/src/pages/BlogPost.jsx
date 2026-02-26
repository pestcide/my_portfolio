import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeHighlight from "rehype-highlight";
import rehypeKatex from "rehype-katex";
import rehypeSlug from "rehype-slug";

import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm2 from "remark-gfm";
import remarkMath2 from "remark-math";
import { toString } from "mdast-util-to-string";

import GithubSlugger from "github-slugger";

import "highlight.js/styles/github-dark.css";
import "katex/dist/katex.min.css";
import "./markdown.css";

export default function BlogPost() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const mdUrl = params.get("md");

  const [content, setContent] = useState("");
  const [toc, setToc] = useState([]);

  useEffect(() => {
    if (!mdUrl) return;

    fetch(mdUrl)
      .then((res) => res.text())
      .then((text) => {
        setContent(text);
        generateToc(text);
      });
  }, [mdUrl]);

  const generateToc = (markdown) => {
    const tree = unified()
      .use(remarkParse)
      .use(remarkGfm2)
      .use(remarkMath2)
      .parse(markdown);

    const slugger = new GithubSlugger();
    const headings = [];

    const visit = (node) => {
      if (node.type === "heading") {
        const text = toString(node);
        const id = slugger.slug(text);

        headings.push({
          level: node.depth,
          text,
          id,
        });
      }
      node.children?.forEach(visit);
    };

    visit(tree);
    setToc(headings);
  };

  const basePath = mdUrl
    ? mdUrl.substring(0, mdUrl.lastIndexOf("/") + 1)
    : "";

  return (
    <div className="relative min-h-screen bg-neutral-950 text-white">

      {/* ================= 全局光晕 ================= */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-purple-500/20 rounded-full blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] bg-blue-500/20 rounded-full blur-[120px]" />
      </div>

      {/* ================= 返回按钮（页面级） ================= */}
      <button
        onClick={() => navigate("/")}
        className="
          fixed top-6 left-6 z-20
          w-11 h-11
          flex items-center justify-center
          rounded-full
          bg-white/5
          border border-white/10
          backdrop-blur-md
          transition-all duration-300
          hover:bg-white/10
          hover:border-purple-400/40
          hover:-translate-y-0.5
          hover:shadow-[0_0_25px_rgba(139,92,246,0.4)]
          group
        "
      >
        <span
          className="
            text-lg
            text-neutral-300
            transition-transform duration-300
            
          "
        >
          ←
        </span>
      </button>

      {/* ================= 页面内容 ================= */}
      <div className="relative z-10 max-w-[1600px] mx-auto flex">

        <div className="hidden 2xl:block w-64" />

        {/* 正文 */}
        <main className="flex-1 px-6 lg:px-10 py-10">
          <article
            className="
              prose prose-invert
              max-w-[820px]
              mx-auto

              prose-img:rounded-xl
              prose-img:shadow-xl

              prose-pre:rounded-xl
              prose-pre:p-4
              prose-pre:overflow-x-auto
              prose-pre:bg-neutral-900
            "
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkMath]}
              rehypePlugins={[
                rehypeHighlight,
                rehypeKatex,
                rehypeSlug,
              ]}
              components={{
                img: ({ src, ...props }) => {
                  let newSrc = src;
                  if (
                    !src.startsWith("http") &&
                    !src.startsWith("/")
                  ) {
                    newSrc = basePath + src;
                  }
                  return <img src={newSrc} {...props} />;
                },
                a: ({ href, ...props }) => {
                  if (href?.startsWith("#")) {
                    href = href.toLowerCase();
                  }
                  return (
                    <a
                      href={href}
                      className="hover:underline"
                      {...props}
                    />
                  );
                },
              }}
            >
              {content}
            </ReactMarkdown>
          </article>
        </main>

        {/* TOC */}
        <aside className="hidden xl:block w-72 border-l border-neutral-800 px-6 py-10">
          <div className="sticky top-10 max-h-[calc(100vh-80px)] overflow-y-auto">
            <h2 className="text-sm font-semibold text-neutral-400 mb-4 uppercase tracking-wider">
              On this page
            </h2>
            <ul className="space-y-2 text-sm">
              {toc.map((item, i) => (
                <li
                  key={i}
                  style={{ marginLeft: (item.level - 1) * 12 }}
                >
                  <a
                    href={`#${item.id}`}
                    className="block text-neutral-400 hover:text-white transition leading-snug"
                  >
                    {item.text}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}