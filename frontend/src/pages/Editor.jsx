import { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeHighlight from "rehype-highlight";
import rehypeKatex from "rehype-katex";
import { useToast } from "@/components/ui/toast";

import "highlight.js/styles/github.css";
import "katex/dist/katex.min.css";
import "./markdown.css";

export default function Editor() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const folder = params.get("folder");
  const toast = useToast();

  const [content, setContent] = useState("");
  const [savedContent, setSavedContent] = useState("");
  const [previewMode, setPreviewMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  const token = localStorage.getItem("token");
  const textareaRef = useRef(null);

  // ===== 登录校验 + 加载文章 =====
  useEffect(() => {
    if (!token) {
      window.location.href = "/login";
      return;
    }
    if (!folder) {
      navigate("/admin");
      return;
    }

    fetch("/api/me", {
      headers: { Authorization: `Bearer ${token}` },
    }).then((res) => {
      if (!res.ok) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      } else {
        setAuthorized(true);
        loadContent();
      }
    });
  }, [folder]);

  async function loadContent() {
    try {
      const res = await fetch(`/api/Blogs/${encodeURIComponent(folder)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "加载失败");
      setContent(data.content);
      setSavedContent(data.content);
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setLoading(false);
    }
  }

  const dirty = content !== savedContent;

  // ===== 未保存提醒 =====
  useEffect(() => {
    const handler = (e) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  // ===== 保存 =====
  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/Blogs/${encodeURIComponent(folder)}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "保存失败");
      setSavedContent(content);
      toast("已保存", "success");
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setSaving(false);
    }
  }

  // ===== 上传配图（光标处插入 Markdown 链接） =====
  async function handleUploadImage(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(
        `/api/Blogs/${encodeURIComponent(folder)}/images`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "上传失败");

      // 在光标位置插入，无光标则追加到文末
      const ta = textareaRef.current;
      const pos = ta ? ta.selectionStart ?? content.length : content.length;
      const snippet = `\n${data.md_link}\n`;
      const next =
        content.slice(0, pos) + snippet + content.slice(pos) + "\n";
      setContent(next);
      toast(`已插入 ${data.file}`, "success");
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setUploading(false);
    }
  }

  // Ctrl+S 保存
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        if (!saving) handleSave();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [content, saving]);

  if (!authorized) {
    return (
      <div className="w-screen h-screen bg-paper flex items-center justify-center text-ink-faint">
        Checking login...
      </div>
    );
  }

  const basePath = `/Blogs/${encodeURIComponent(folder)}/`;

  return (
    <div className="w-screen h-screen bg-paper text-ink flex flex-col overflow-hidden">
      {/* ===== 顶栏 ===== */}
      <header
        className="
          shrink-0 flex items-center gap-3 px-4 py-3
          bg-paper border-b border-line
        "
      >
        <button
          onClick={() => {
            if (dirty && !confirm("有未保存的修改，确定离开？")) return;
            navigate("/admin");
          }}
          className="w-9 h-9 shrink-0 rounded-full border border-line hover:border-clay/50 transition flex items-center justify-center text-ink-soft hover:text-clay-dark"
        >
          ←
        </button>

        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium truncate">{folder}</div>
          <div className="text-[11px] text-ink-faint">
            {dirty ? "● 未保存" : "已同步"}
          </div>
        </div>

        {/* 上传配图 */}
        <label
          className={`
            shrink-0 px-3 py-2 rounded-full text-xs cursor-pointer
            border border-line hover:border-clay/50
            text-ink-soft hover:text-clay-dark transition
            ${uploading ? "opacity-50 pointer-events-none" : ""}
          `}
        >
          {uploading ? "上传中..." : "插图"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleUploadImage}
          />
        </label>

        {/* 预览切换 */}
        <button
          onClick={() => setPreviewMode((v) => !v)}
          className={`
            shrink-0 px-3 py-2 rounded-full text-xs transition
            ${
              previewMode
                ? "bg-ink text-paper"
                : "border border-line hover:border-clay/50 text-ink-soft hover:text-clay-dark"
            }
          `}
        >
          {previewMode ? "编辑" : "预览"}
        </button>

        {/* 保存 */}
        <button
          onClick={handleSave}
          disabled={saving || !dirty}
          className={`
            shrink-0 px-4 py-2 rounded-full text-xs font-semibold transition
            ${
              dirty
                ? "bg-ink text-paper hover:bg-clay-dark"
                : "bg-paper-raised text-ink-faint cursor-default"
            }
            disabled:opacity-60
          `}
        >
          {saving ? "保存中..." : "保存"}
        </button>
      </header>

      {/* ===== 编辑 / 预览 ===== */}
      <main className="flex-1 min-h-0 overflow-y-auto">
        {loading ? (
          <div className="h-full flex items-center justify-center text-ink-faint text-sm">
            加载中...
          </div>
        ) : previewMode ? (
          <div className="max-w-[820px] mx-auto px-6 py-8">
            <article className="prose max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeHighlight, rehypeKatex]}
                components={{
                  img: ({ src, ...props }) => {
                    const newSrc =
                      !src.startsWith("http") && !src.startsWith("/")
                        ? basePath + src
                        : src;
                    return (
                      <img
                        src={newSrc}
                        {...props}
                        style={{ maxWidth: "100%", height: "auto" }}
                      />
                    );
                  },
                }}
              >
                {content}
              </ReactMarkdown>
            </article>
          </div>
        ) : (
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            spellCheck={false}
            placeholder="# 标题&#10;&#10;正文内容（Markdown）..."
            className="
              w-full h-full resize-none outline-none
              bg-paper text-ink
              font-mono text-sm leading-relaxed
              p-6
            "
          />
        )}
      </main>
    </div>
  );
}
