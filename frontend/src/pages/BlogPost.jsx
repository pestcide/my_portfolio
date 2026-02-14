import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

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
  const mdUrl = params.get("md");

  const [content, setContent] = useState("");
  const [toc, setToc] = useState([]);

  /* ===============================
     获取 Markdown
  =============================== */
  useEffect(() => {
    if (!mdUrl) return;

    fetch(mdUrl)
      .then((res) => res.text())
      .then((text) => {
        setContent(text);
        generateToc(text);
      });
  }, [mdUrl]);

  /* ===============================
     生成 TOC（与 rehype-slug 同规则）
  =============================== */
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
        const level = node.depth;

        // 与 rehype-slug 完全一致
        const id = slugger.slug(text);

        headings.push({
          level,
          text,
          id,
        });
      }

      if (node.children) {
        node.children.forEach(visit);
      }
    };

    visit(tree);
    setToc(headings);
  };

  /* ===============================
     图片路径补全
  =============================== */
  const basePath = mdUrl
    ? mdUrl.substring(0, mdUrl.lastIndexOf("/") + 1)
    : "";

  /* ===============================
     页面
  =============================== */
  return (
    <div className="bg-neutral-950 text-white min-h-screen">
      <div className="max-w-[1600px] mx-auto flex">

        {/* 左侧留白 */}
        <div className="hidden 2xl:block w-64" />

        {/* ================= 正文 ================= */}
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
                rehypeSlug, // 自动标题 id
              ]}
              components={{
                /* 图片路径补全 */
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

                /* 修复 README 锚点大小写 */
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

        {/* ================= TOC ================= */}
        <aside
          className="
            hidden xl:block
            w-72
            border-l border-neutral-800
            px-6 py-10
          "
        >
          <div className="sticky top-10 max-h-[calc(100vh-80px)] overflow-y-auto">

            <h2 className="text-sm font-semibold text-neutral-400 mb-4 uppercase tracking-wider">
              On this page
            </h2>

            <ul className="space-y-2 text-sm">
              {toc.map((item, i) => (
                <li
                  key={i}
                  style={{
                    marginLeft: (item.level - 1) * 12,
                  }}
                >
                  <a
                    href={`#${item.id}`}
                    className="
                      block
                      text-neutral-400
                      hover:text-white
                      transition
                      leading-snug
                    "
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
