import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import myphoto from "../assets/home/myphoto.webp";
import beian from "../assets/备案图标.png";

export default function Blogs() {
  const [blogs, setBlogs] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetch("/api/Blogs")
      .then((res) => res.json())
      .then((data) => {
        setBlogs(data);
      })
      .catch((err) => {
        console.error("加载博客失败:", err);
      });
  }, []);

  return (
    <div className="relative flex flex-col min-h-screen bg-neutral-950 text-white overflow-hidden">
      
      {/* ================= 背景光晕 ================= */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-blue-500/20 rounded-full blur-3xl" />
      </div>

      {/* ================= 主体内容 ================= */}
      <div className="relative z-10 flex-1 max-w-7xl mx-auto px-6 py-12">
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* ================= 左侧个人信息 ================= */}
          <div className="lg:col-span-1">
            <div className="sticky top-12">
              <div className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-8 shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
                
                {/* 头像 */}
                <div className="flex justify-center mb-6">
                  <div className="w-32 h-32 rounded-full overflow-hidden border border-white/20">
                    <img
                      src={myphoto}
                      alt="avatar"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                {/* 名字 */}
                <h2 className="text-2xl font-bold text-center mb-2">
                  Golem
                </h2>

                {/* 职业 */}
                <p className="text-neutral-400 text-center mb-6">
                  NJUer | 计算机科学与技术专业 | 摄影爱好者
                </p>

                {/* 简介 */}
                <p className="text-neutral-300 text-sm leading-relaxed text-center mb-6">
                  本站是我的个人网站，用于展示摄影作品，并记录一些与技术和视觉相关的思考。
                </p>

                {/* 相册按钮 */}
                <button
                  onClick={() => navigate("/photos")}
                  className="
                    w-full
                    py-3
                    rounded-xl
                    bg-gradient-to-r
                    from-purple-500
                    to-blue-500
                    text-sm
                    font-semibold
                    hover:opacity-90
                    transition
                    shadow-lg
                    shadow-purple-500/20
                    mb-6
                  "
                >
                  📷 Golem & Suu 的相册
                </button>

                <div className="h-px bg-white/10 my-6"></div>

                {/* 联系方式 */}
                <div className="flex justify-center gap-6 text-sm text-neutral-400">
                  <a
                    href="https://github.com/pestcide"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-white transition"
                  >
                    GitHub
                  </a>
                  <a
                    href="mailto:chenyuhwang@foxmail.com"
                    className="hover:text-white transition"
                  >
                    Email
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* ================= 右侧博客列表 ================= */}
          <div className="lg:col-span-2">
            <h1 className="text-3xl font-bold mb-10 tracking-tight">
              Blogs
            </h1>

            {/* 两列布局 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {blogs.map((blog, idx) => (
                <div
                  key={idx}
                  onClick={() =>
                    navigate(`/blog?md=${encodeURIComponent(blog.md_url)}`)
                  }
                  className="
                    group
                    relative
                    cursor-pointer
                    rounded-2xl
                    bg-white/5
                    backdrop-blur-xl
                    border border-white/10
                    hover:border-purple-400/40
                    transition-all
                    duration-300
                    p-6
                    hover:-translate-y-1
                    hover:shadow-[0_10px_40px_rgba(139,92,246,0.25)]
                  "
                >
                  {/* 左侧渐变条 */}
                  <div className="absolute left-0 top-6 bottom-6 w-1 rounded-full bg-gradient-to-b from-purple-500 to-blue-500 opacity-60 group-hover:opacity-100 transition" />

                  {/* 标题 */}
                  <h2 className="text-xl font-semibold text-white mb-2 group-hover:text-purple-300 transition">
                    {blog.title}
                  </h2>

                  {/* 描述 */}
                  {blog.description && (
                    <p className="text-sm text-neutral-400 leading-relaxed line-clamp-3">
                      {blog.description}
                    </p>
                  )}

                  <div className="mt-4 text-xs text-neutral-500 group-hover:text-neutral-300 transition">
                    Read more →
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* ================= Footer ================= */}
      <footer className="relative z-10 py-8 text-center text-xs text-neutral-500">
        <div>本站博客与摄影作品，未经许可，请勿转载、商用或二次创作。</div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-2">
          <a
            href="https://beian.mps.gov.cn/#/query/webSearch?code=32011302323061"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 hover:text-neutral-300 transition"
          >
            <img src={beian} alt="备案图标" className="w-4 h-4" />
            苏公网安备32011302323061号
          </a>

          <a
            href="https://beian.miit.gov.cn/"
            target="_blank"
            rel="noreferrer"
            className="hover:text-neutral-300 transition"
          >
            苏ICP备2026006625号-1
          </a>
        </div>
      </footer>
    </div>
  );
}