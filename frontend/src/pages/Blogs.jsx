import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Blogs() {
  const [blogs, setBlogs] = useState([]);
  const navigate = useNavigate();

  /**
   * 获取博客列表
   */
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
    <div className="relative w-full min-h-screen bg-neutral-950 p-8 overflow-hidden">
      
      {/* 标题 */}
      <h1 className="text-3xl font-bold text-white mb-8">
        Blogs
      </h1>

      {/* 卡片网格 */}
      <div
        className="
          grid
          grid-cols-1
          sm:grid-cols-2
          md:grid-cols-3
          lg:grid-cols-4
          gap-6
        "
      >
        {blogs.map((blog, idx) => (
          <div
            key={idx}
            onClick={() =>
              navigate(`/blog?md=${encodeURIComponent(blog.md_url)}`)
            }
            className="
              group
              cursor-pointer
              rounded-2xl
              bg-white/5
              backdrop-blur-xl
              border border-white/10
              hover:border-white/30
              transition
              duration-300
              overflow-hidden
              shadow-[0_10px_40px_rgba(0,0,0,0.5)]
            "
          >
            {/* 封面（没有就用占位） */}
            <div className="h-40 bg-gradient-to-br from-neutral-800 to-neutral-900 flex items-center justify-center">
              <span className="text-neutral-500 text-sm">
                No Cover
              </span>
            </div>

            {/* 内容 */}
            <div className="p-4">
              <h2
                className="
                  text-white
                  font-semibold
                  text-lg
                  line-clamp-2
                  group-hover:text-neutral-200
                "
              >
                {blog.title}
              </h2>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
