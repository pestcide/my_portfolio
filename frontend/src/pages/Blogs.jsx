import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import myphoto from "../assets/home/myphoto.webp";
import beian from "../assets/备案图标.png";
import { CameraDoodle, SquiggleDoodle, StarDoodle } from "../components/doodles";

const ALL_ID = "__all__";

export default function Blogs() {
  const [data, setData] = useState({ columns: [], posts: [] });
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const activeId = searchParams.get("column") || ALL_ID;

  useEffect(() => {
    fetch("/api/Columns")
      .then((res) => res.json())
      .then((data) => {
        setData(data);
      })
      .catch((err) => {
        console.error("加载博客失败:", err);
      });

    fetch("/api/avatar")
      .then((res) => res.json())
      .then((d) => setAvatarUrl(d.url))
      .catch(() => {});
  }, []);

  function setActive(id) {
    if (id === ALL_ID) {
      searchParams.delete("column");
      setSearchParams(searchParams, { replace: true });
    } else {
      setSearchParams({ column: id }, { replace: true });
    }
  }

  const posts =
    activeId === ALL_ID
      ? data.posts
      : data.posts.filter((p) => p.column_id === activeId);

  return (
    <div className="relative flex flex-col min-h-screen bg-paper text-ink">
      {/* ================= 主体内容 ================= */}
      <div className="relative z-10 flex-1 w-full max-w-3xl mx-auto px-6 py-20 page-enter">

        {/* ================= 头部 ================= */}
        <header className="relative mb-16">
          {/* 手绘相机点缀 */}
          <CameraDoodle className="hidden md:block absolute -top-2 right-0 w-24 text-ink-faint/70" />
          <StarDoodle className="hidden md:block absolute top-10 right-28 w-5 text-clay/70" />

          <div className="flex items-start gap-6">
            <div className="w-20 h-20 rounded-2xl overflow-hidden border border-line bg-paper-raised shrink-0 mt-2 shadow-[0_2px_12px_rgba(25,25,25,0.06)]">
              <img
                src={avatarUrl || myphoto}
                alt="avatar"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="min-w-0 flex-1">
              <h1 className="font-display text-5xl font-semibold tracking-tight mb-2">
                Golem
              </h1>
              <p className="text-sm text-ink-soft">
                NJUer · 计算机科学与技术 · 摄影爱好者
              </p>
              <p className="text-[15px] text-ink-soft mt-4 leading-relaxed max-w-md">
                记录摄影作品，以及一些与技术和视觉相关的思考。
              </p>
            </div>
          </div>
        </header>

        {/* ================= 导航 ================= */}
        <nav className="flex items-center gap-8 mb-14 text-sm">
          <span className="text-ink border-b-2 border-clay pb-0.5 font-medium">博客</span>
          <button
            onClick={() => navigate("/photos")}
            className="text-ink-soft hover:text-clay-dark transition link-underline"
          >
            相册
          </button>
          <div className="flex-1" />
          <a
            href="https://github.com/pestcide"
            target="_blank"
            rel="noreferrer"
            className="text-ink-soft hover:text-clay-dark transition link-underline"
          >
            GitHub
          </a>
          <a
            href="mailto:chenyuhwang@foxmail.com"
            className="text-ink-soft hover:text-clay-dark transition link-underline"
          >
            Email
          </a>
          <button
            onClick={() => navigate("/login")}
            className="text-ink-faint hover:text-clay-dark transition link-underline text-xs"
          >
            登录
          </button>
        </nav>

        {/* ================= 专栏标签 ================= */}
        <div className="flex gap-7 overflow-x-auto pb-px mb-2 text-sm">
          <button
            onClick={() => setActive(ALL_ID)}
            className={`
              pb-3 -mb-px border-b-2 whitespace-nowrap transition
              ${
                activeId === ALL_ID
                  ? "text-ink border-clay font-medium"
                  : "text-ink-soft border-transparent hover:text-clay-dark"
              }
            `}
          >
            全部
            <span className="ml-1.5 text-xs text-ink-faint tabular-nums">
              {data.posts.length}
            </span>
          </button>

          {data.columns.map((col) => (
            <button
              key={col.id}
              onClick={() => setActive(col.id)}
              className={`
                pb-3 -mb-px border-b-2 whitespace-nowrap transition
                ${
                  activeId === col.id
                    ? "text-ink border-clay font-medium"
                    : "text-ink-soft border-transparent hover:text-clay-dark"
                }
              `}
            >
              {col.name}
              <span className="ml-1.5 text-xs text-ink-faint tabular-nums">
                {col.posts.length}
              </span>
            </button>
          ))}
        </div>

        {/* ================= 文章目录 ================= */}
        {posts.length === 0 ? (
          <div className="py-20 text-sm text-ink-faint text-center">
            {activeId === ALL_ID ? "还没有文章" : "该专栏暂无文章"}
          </div>
        ) : (
          <div className="divide-y divide-line border-t border-line">
            {posts.map((post, i) => (
              <div
                key={post.folder}
                onClick={() =>
                  navigate(`/blog?md=${encodeURIComponent(post.md_url)}`)
                }
                className="group flex items-baseline gap-5 py-6 cursor-pointer"
              >
                <span className="w-7 shrink-0 font-display text-sm text-ink-faint tabular-nums group-hover:text-clay transition">
                  {String(i + 1).padStart(2, "0")}
                </span>

                <div className="flex-1 min-w-0">
                  <h2 className="font-display text-xl text-ink group-hover:text-clay-dark transition">
                    <span className="link-underline">{post.title}</span>
                  </h2>
                  {post.description && (
                    <p className="mt-1.5 text-sm text-ink-soft truncate">
                      {post.description}
                    </p>
                  )}
                </div>

                {post.column && (
                  <span className="shrink-0 px-2.5 py-0.5 rounded-full bg-paper-raised border border-line text-xs text-ink-soft">
                    {post.column}
                  </span>
                )}

                <span className="shrink-0 text-xs text-ink-faint tabular-nums hidden sm:block">
                  {post.date}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ================= 波浪分隔 + Footer ================= */}
      <div className="flex justify-center mb-4 text-ink-faint/60">
        <SquiggleDoodle className="w-44" />
      </div>

      <footer className="relative z-10 py-8 text-center text-xs text-ink-faint">
        <div>本站博客与摄影作品，未经许可，请勿转载、商用或二次创作。</div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-3">
          <a
            href="https://beian.mps.gov.cn/#/query/webSearch?code=32011302323061"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 hover:text-ink-soft transition"
          >
            <img src={beian} alt="备案图标" className="w-3.5 h-3.5" />
            苏公网安备32011302323061号
          </a>

          <a
            href="https://beian.miit.gov.cn/"
            target="_blank"
            rel="noreferrer"
            className="hover:text-ink-soft transition"
          >
            苏ICP备2026006625号-1
          </a>
        </div>
      </footer>
    </div>
  );
}
