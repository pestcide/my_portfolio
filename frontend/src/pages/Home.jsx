export default function Home() {
  return (
    <div className="relative w-screen min-h-screen bg-neutral-950 overflow-hidden">
      {/* 背景光晕 */}
      <div className="absolute inset-0">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-blue-500/20 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-20 px-4 py-24">
        
        <section
          className="
            max-w-5xl w-full
            bg-white/5
            backdrop-blur-3xl
            rounded-3xl
            p-10 md:p-14
            border border-white/15
            shadow-[0_20px_60px_rgba(0,0,0,0.6)]
            relative
          "
        >
          <div className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-white/10" />

          <div className="grid md:grid-cols-[4fr_6fr] gap-12 items-center">
            {/* 左：照片 + 按钮 */}
            <div className="flex flex-col gap-6">
              <div className="grid grid-cols-1 gap-4">
                <img
                  src="/src/assets/home/DSC_8436.JPG"
                  alt=""
                  className="rounded-xl object-cover "
                />
                {/* <img
                  src="/src/assets/about/work-1.jpg"
                  alt=""
                  className="rounded-xl object-cover aspect-square"
                /> */}
              </div>

              <a
                href="/photos"
                className="
                  inline-flex
                  items-center
                  justify-center
                  px-6 py-3
                  rounded-full
                  bg-white/90
                  text-neutral-900
                  font-semibold
                  shadow-lg
                  hover:bg-white
                  hover:scale-105
                  transition
                "
              >
                查看作品 →
              </a>
            </div>

            
            {/* 右：自我介绍 + 联系方式（纵向分散） */}
            <div className="flex flex-col h-full justify-between">
              {/* 顶部：姓名 + 身份 */}
              <div>
                <h2 className="text-2xl md:text-3xl font-semibold text-neutral-100 mb-2">
                  Golem
                </h2>

                <p className="text-neutral-400 mb-6">
                  NJUer | 计算机科学与技术专业 | 摄影爱好者
                </p>
              
                <p className="text-neutral-300 leading-relaxed mb-4">
                  我关注
                  <span className="text-neutral-100 font-medium">
                    人文纪实、城市空间与影像叙事
                  </span>
                  ，同时对计算摄影、三维视觉与仿真系统保持长期探索。
                </p>

                <p className="text-neutral-300 leading-relaxed mb-4">
                  本站是我的个人网站，用于展示摄影作品，并记录一些与技术和视觉相关的思考。
                  未来这里也会陆续更新个人博客。
                </p>

                <p className="text-neutral-300 leading-relaxed mb-4">
                  本站所有摄影作品均为本人原创，版权归作者所有。
                  未经许可，请勿转载、商用或二次创作。
                </p>
              </div>

              {/* 底部：联系方式 */}
              <div className="pt-8">
                <div className="flex gap-6 text-sm">
                  <a
                    href="https://github.com/pestcide"
                    target="_blank"
                    className="text-neutral-300 hover:text-white transition"
                  >
                    GitHub
                  </a>

                  <span className="text-neutral-500">•</span>

                  <span className="text-neutral-300">
                    chenyuhwang@foxmail.com
                  </span>
                </div>
                <div className="flex gap-6 text-sm">
                  <span className="text-neutral-300">
                    © 2026 Golem. All photographs are copyrighted.
                  </span>
                </div>
              </div>
            </div>

          </div>
        </section>
      </div>
    </div>
  );
}
