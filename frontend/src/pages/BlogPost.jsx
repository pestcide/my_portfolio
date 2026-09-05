import { useEffect, useState, useRef } from "react";
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

import "highlight.js/styles/github.css";
import "katex/dist/katex.min.css";
import "./markdown.css";

/** 代码块：复制按钮 + 语言标签（浅色暖纸风） */
function CodeBlock({ children }) {
  const ref = useRef(null);
  const [copied, setCopied] = useState(false);

  // 语言标签（rehype-highlight 会给 code 加 language-xxx）
  const codeEl = Array.isArray(children) ? children[0] : children;
  const cls = codeEl?.props?.className || "";
  const lang = (cls.match(/language-([\w-]+)/) || [])[1];

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(ref.current?.innerText || "");
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* 剪贴板不可用时静默 */
    }
  }

  return (
    <div className="relative group/code">
      {lang && (
        <span className="absolute top-2.5 right-14 text-[10px] uppercase tracking-widest text-ink-faint select-none">
          {lang}
        </span>
      )}
      <button
        onClick={onCopy}
        className="absolute top-2 right-3 text-[11px] text-ink-faint hover:text-clay-dark transition"
      >
        {copied ? "已复制" : "复制"}
      </button>
      <pre
        ref={ref}
        style={{
          maxWidth: "100%",
          overflowX: "auto",
          whiteSpace: "pre",
        }}
      >
        {children}
      </pre>
    </div>
  );
}

export default function BlogPost() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const mdUrl = params.get("md");

  const [content, setContent] = useState("");
  const [toc, setToc] = useState([]);
  const [activeHeading, setActiveHeading] = useState(null);
  const [progress, setProgress] = useState(0);
  const [meta, setMeta] = useState(null); // {date, column}

  function generateToc(markdown) {
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
  }

  useEffect(() => {
    if (!mdUrl) return;

    fetch(mdUrl)
      .then((res) => res.text())
      .then((text) => {
        setContent(text);
        generateToc(text);
      });

    // meta：日期 + 专栏（来自列表接口）
    fetch("/api/Columns")
      .then((res) => res.json())
      .then((data) => {
        const post = data.posts.find((p) => p.md_url === mdUrl);
        if (post) {
          setMeta({ date: post.date, column: post.column });
        }
      })
      .catch(() => {});
  }, [mdUrl]);

  // ===== 阅读进度条 =====
  useEffect(() => {
    const onScroll = () => {
      const el = document.documentElement;
      const total = el.scrollHeight - el.clientHeight;
      setProgress(total > 0 ? (el.scrollTop / total) * 100 : 0);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [content]);

  // ===== TOC 当前章节高亮 =====
  useEffect(() => {
    if (!toc.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveHeading(entry.target.id);
            break;
          }
        }
      },
      { rootMargin: "-80px 0px -65% 0px" }
    );

    toc.forEach((t) => {
      const el = document.getElementById(t.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [toc, content]);

  const basePath = mdUrl
    ? mdUrl.substring(0, mdUrl.lastIndexOf("/") + 1)
    : "";

  // 阅读时长（按每分钟约 400 字估算）
  const readMinutes = content
    ? Math.max(1, Math.ceil(content.replace(/\s/g, "").length / 400))
    : null;

  return (
    <div className="relative min-h-screen bg-paper text-ink overflow-x-hidden">
      {/* 阅读进度条 */}
      <div
        className="fixed top-0 left-0 h-0.5 bg-clay z-50 transition-[width] duration-150"
        style={{ width: `${progress}%` }}
      />

      {/* 返回 */}
      <button
        onClick={() => navigate("/")}
        className="
          fixed top-6 left-6 z-20
          h-9 px-4
          flex items-center gap-2
          rounded-full
          bg-paper-raised
          border border-line
          text-sm text-ink-soft
          transition-all duration-300
          hover:text-clay-dark hover:border-clay/50
          shadow-[0_2px_10px_rgba(25,25,25,0.06)]
        "
      >
        ← 返回
      </button>

      <div className="relative z-10 max-w-[1600px] mx-auto flex">
        <div className="hidden 2xl:block w-64" />

        {/* 正文 */}
        <main className="flex-1 px-6 lg:px-10 py-16 min-w-0 page-enter">
          {/* meta 行 */}
          {(meta?.date || meta?.column || readMinutes) && (
            <div className="max-w-[820px] mx-auto mb-10 flex items-center gap-4 text-xs text-ink-faint">
              {meta?.date && (
                <span className="tabular-nums">{meta.date}</span>
              )}
              {meta?.column && (
                <>
                  <span className="text-line">·</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-paper-raised border border-line text-ink-soft">
                    {meta.column}
                  </span>
                </>
              )}
              {readMinutes && (
                <>
                  <span className="text-line">·</span>
                  <span>约 {readMinutes} 分钟</span>
                </>
              )}
            </div>
          )}

          <article
            className="
              prose
              max-w-[820px]
              mx-auto

              prose-headings:font-display

              prose-a:text-clay-dark
              prose-a:no-underline
              hover:prose-a:underline

              prose-strong:font-semibold

              prose-img:rounded-xl
              prose-img:shadow-[0_4px_20px_rgba(25,25,25,0.1)]
              prose-img:max-w-full
              prose-img:h-auto

              prose-pre:rounded-xl
              prose-pre:p-4
              prose-pre:bg-paper-raised
              prose-pre:max-w-full
              prose-pre:overflow-x-auto

              prose-code:whitespace-pre
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
                /* 图片自适应 */
                img: ({ src, ...props }) => {
                  let newSrc = src;

                  if (!src.startsWith("http") && !src.startsWith("/")) {
                    newSrc = basePath + src;
                  }

                  return (
                    <img
                      src={newSrc}
                      {...props}
                      style={{
                        maxWidth: "100%",
                        height: "auto",
                      }}
                    />
                  );
                },

                /* 代码块：复制 + 语言标签 */
                pre: ({ children }) => <CodeBlock>{children}</CodeBlock>,

                code: ({ inline, children, ...props }) => {
                  if (inline) {
                    return (
                      <code className="px-1.5 py-0.5 rounded">
                        {children}
                      </code>
                    );
                  }

                  return (
                    <code
                      {...props}
                      style={{
                        whiteSpace: "pre",
                      }}
                    >
                      {children}
                    </code>
                  );
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
        <aside className="hidden xl:block w-72 border-l border-line px-6 py-16">
          <div className="sticky top-16 max-h-[calc(100vh-80px)] overflow-y-auto">

            <h2 className="font-display text-xs font-medium text-ink-faint mb-4 uppercase tracking-[0.2em]">
              Contents
            </h2>

            <ul className="space-y-2 text-sm">
              {toc.map((item, i) => {
                const isActive = activeHeading === item.id;
                return (
                  <li
                    key={i}
                    style={{ marginLeft: (item.level - 1) * 12 }}
                  >
                    <a
                      href={`#${item.id}`}
                      className={`
                        block transition leading-snug border-l-2 -ml-3 pl-3 py-0.5
                        ${
                          isActive
                            ? "text-clay-dark border-clay font-medium"
                            : "text-ink-soft border-transparent hover:text-ink"
                        }
                      `}
                    >
                      {item.text}
                    </a>
                  </li>
                );
              })}
            </ul>

          </div>
        </aside>
      </div>
    </div>
  );
}
