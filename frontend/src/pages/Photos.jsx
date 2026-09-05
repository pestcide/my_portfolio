import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Dialog, DialogContent } from "@/components/ui/dialog";

const ALL_ID = "__all__";

/** 图片淡入 */
function FadeImg({ className = "", ...props }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <img
      {...props}
      loading="lazy"
      decoding="async"
      onLoad={() => setLoaded(true)}
      className={`${className} img-fade ${loaded ? "loaded" : ""}`}
    />
  );
}

export default function Photos() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [data, setData] = useState({
    albums: [],
    uncategorized: null,
    all_photos: [],
  });
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);

  const activeId = searchParams.get("album") || ALL_ID;

  useEffect(() => {
    fetch("/api/Albums")
      .then((res) => res.json())
      .then((data) => {
        setData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("加载相册失败:", err);
        setLoading(false);
      });
  }, []);

  function setActive(id) {
    if (id === ALL_ID) {
      searchParams.delete("album");
      setSearchParams(searchParams, { replace: true });
    } else {
      setSearchParams({ album: id }, { replace: true });
    }
  }

  // 标签/侧栏数据源：全部 + 各专辑 + 未分类
  const albumTabs = [
    { id: ALL_ID, name: "全部", photos: data.all_photos },
    ...data.albums,
    ...(data.uncategorized ? [data.uncategorized] : []),
  ];

  const photos =
    activeId === ALL_ID
      ? data.all_photos
      : albumTabs.find((a) => a.id === activeId)?.photos || [];

  // ===== 预览键盘导航（← / →） =====
  const previewIndex = preview
    ? photos.findIndex((p) => p.folder === preview.folder)
    : -1;

  function stepPreview(dir) {
    if (previewIndex < 0 || photos.length === 0) return;
    const next =
      (previewIndex + dir + photos.length) % photos.length;
    setPreview(photos[next]);
  }

  useEffect(() => {
    if (!preview) return;
    const handler = (e) => {
      if (e.key === "ArrowRight") stepPreview(1);
      if (e.key === "ArrowLeft") stepPreview(-1);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  return (
    <div className="relative w-full min-h-screen bg-paper text-ink">
      {/* 返回首页 */}
      <button
        onClick={() => navigate("/")}
        className="
          fixed top-6 left-6 z-20
          h-9 px-4
          flex items-center
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

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-16 page-enter">
        {/* ===== 页头 ===== */}
        <div className="flex items-end justify-between mb-10">
          <div>
            <h1 className="font-display text-4xl font-semibold tracking-tight">
              相册
            </h1>
            <p className="text-sm text-ink-faint mt-1">Photographs</p>
          </div>
          <span className="text-sm text-ink-faint tabular-nums">
            {photos.length} 张
          </span>
        </div>

        <div className="flex gap-10">
          {/* ===== 左侧专辑栏（桌面端） ===== */}
          <aside className="hidden lg:block w-44 shrink-0">
            <div className="sticky top-16">
              <div className="font-display text-xs uppercase tracking-[0.2em] text-ink-faint mb-4">
                Albums
              </div>
              <div className="flex flex-col">
                {albumTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActive(tab.id)}
                    className={`
                      flex items-baseline justify-between gap-2 py-2 text-sm text-left transition
                      ${
                        activeId === tab.id
                          ? "text-ink font-medium"
                          : "text-ink-soft hover:text-clay-dark"
                      }
                    `}
                  >
                    <span className="link-underline">{tab.name}</span>
                    <span className="text-xs text-ink-faint tabular-nums">
                      {tab.photos?.length ?? 0}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </aside>

          <div className="flex-1 min-w-0">
            {/* ===== 移动端专辑下拉 ===== */}
            <select
              value={activeId}
              onChange={(e) => setActive(e.target.value)}
              className="lg:hidden w-full mb-6 px-4 py-2.5 rounded-xl bg-paper-raised border border-line text-sm text-ink outline-none"
            >
              {albumTabs.map((tab) => (
                <option key={tab.id} value={tab.id}>
                  {tab.name}（{tab.photos?.length ?? 0} 张）
                </option>
              ))}
            </select>

            {/* Masonry 瀑布流 */}
            {loading ? (
              <div className="text-ink-faint text-sm py-20 text-center">
                加载中...
              </div>
            ) : photos.length === 0 ? (
              <div className="text-ink-faint text-sm py-20 text-center">
                该专辑暂无照片
              </div>
            ) : (
              <div className="columns-2 md:columns-4 xl:columns-5 gap-4 space-y-4">
                {photos.map((photo) => (
                  <div
                    key={photo.folder}
                    className="break-inside-avoid cursor-pointer group"
                    onClick={() => setPreview(photo)}
                  >
                    <FadeImg
                      src={photo.thumb}
                      alt={photo.folder}
                      className="w-full rounded-xl mb-4 transition-transform duration-300 group-hover:scale-[1.02] shadow-[0_2px_12px_rgba(25,25,25,0.08)]"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ===== 预览弹窗（保留暗底） ===== */}
      <Dialog open={!!preview} onOpenChange={() => setPreview(null)}>
        <DialogContent
          className="
            z-50
            w-[95vw]
            h-[95vh]
            max-w-none
            max-h-none
            bg-[#191919]
            border border-white/10
            rounded-2xl
            p-4
            flex items-center justify-center
            focus:outline-none
          "
        >
          {preview && (
            <>
              <img
                src={preview.full}
                alt={preview.folder}
                className="max-w-full max-h-full object-contain"
              />

              {/* 计数 + 操作提示 */}
              {previewIndex >= 0 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-neutral-500 tabular-nums">
                  {previewIndex + 1} / {photos.length}
                  <span className="hidden sm:inline ml-3 text-neutral-700">
                    ← → 切换
                  </span>
                </div>
              )}

              {/* 左右切换按钮 */}
              {photos.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      stepPreview(-1);
                    }}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/5 border border-white/10 text-neutral-300 hover:text-clay hover:bg-white/10 transition flex items-center justify-center"
                  >
                    ←
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      stepPreview(1);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/5 border border-white/10 text-neutral-300 hover:text-clay hover:bg-white/10 transition flex items-center justify-center"
                  >
                    →
                  </button>
                </>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
