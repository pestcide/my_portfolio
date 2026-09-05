import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Dialog, DialogContent } from "@/components/ui/dialog";

const ALL_ID = "__all__";

export default function Photos() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState({
    albums: [],
    uncategorized: null,
    all_photos: [],
  });
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);

  const activeId = searchParams.get("album") || ALL_ID;

  /**
   * 从后端获取专辑数据
   */
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

  /**
   * 切换专辑（同步到 URL，可分享/刷新保留）
   */
  function setActive(id) {
    if (id === ALL_ID) {
      searchParams.delete("album");
      setSearchParams(searchParams, { replace: true });
    } else {
      setSearchParams({ album: id }, { replace: true });
    }
  }

  // 标签/侧边栏数据源：全部 + 各专辑 + 未分类
  const albumTabs = [
    { id: ALL_ID, name: "全部", photos: data.all_photos, cover: null },
    ...data.albums,
    ...(data.uncategorized ? [data.uncategorized] : []),
  ];

  const photos =
    activeId === ALL_ID
      ? data.all_photos
      : albumTabs.find((a) => a.id === activeId)?.photos || [];

  return (
    <div className="relative w-full min-h-screen bg-neutral-950 overflow-hidden">
      {/* 背景光晕 */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-blue-500/20 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        {/* ===== 顶部标签页 ===== */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 lg:mb-10">
          {albumTabs.map((tab) => {
            const isActive = activeId === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActive(tab.id)}
                className={`
                  shrink-0 px-4 py-2 rounded-full text-sm font-medium
                  transition whitespace-nowrap
                  ${
                    isActive
                      ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg"
                      : "bg-white/5 text-neutral-300 border border-white/10 hover:bg-white/10"
                  }
                `}
              >
                {tab.name}
                <span className="ml-1.5 text-xs opacity-70">
                  {tab.photos?.length ?? 0}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex gap-8">
          {/* ===== 左侧专辑栏（桌面端） ===== */}
          <aside className="hidden lg:block w-56 shrink-0">
            <div className="sticky top-12 flex flex-col gap-3">
              {albumTabs.map((tab) => {
                const isActive = activeId === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActive(tab.id)}
                    className={`
                      flex items-center gap-3 p-2 rounded-2xl border text-left
                      transition
                      ${
                        isActive
                          ? "bg-white/10 border-purple-400/40 shadow-[0_0_20px_rgba(168,85,247,0.15)]"
                          : "bg-white/5 border-white/10 hover:bg-white/10"
                      }
                    `}
                  >
                    {tab.cover ? (
                      <img
                        src={tab.cover.thumb}
                        alt={tab.name}
                        className="w-12 h-12 rounded-xl object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center shrink-0 text-neutral-400 text-sm">
                        {tab.id === ALL_ID ? "全" : "空"}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="truncate text-sm text-neutral-200">
                        {tab.name}
                      </div>
                      <div className="text-xs text-neutral-500">
                        {tab.photos?.length ?? 0} 张
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>

          {/* ===== 移动端专辑下拉 ===== */}
          <div className="flex-1 min-w-0">
            <select
              value={activeId}
              onChange={(e) => setActive(e.target.value)}
              className="lg:hidden w-full mb-4 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-neutral-200 outline-none"
            >
              {albumTabs.map((tab) => (
                <option
                  key={tab.id}
                  value={tab.id}
                  className="bg-neutral-900"
                >
                  {tab.name}（{tab.photos?.length ?? 0} 张）
                </option>
              ))}
            </select>

            {/* Masonry 瀑布流 */}
            {loading ? (
              <div className="text-neutral-400 text-sm py-20 text-center">
                加载中...
              </div>
            ) : photos.length === 0 ? (
              <div className="text-neutral-400 text-sm py-20 text-center">
                该专辑暂无照片
              </div>
            ) : (
              <div className="columns-2 md:columns-4 xl:columns-5 gap-4 space-y-4">
                {photos.map((photo) => (
                  <div
                    key={photo.folder}
                    className="break-inside-avoid cursor-pointer"
                    onClick={() => setPreview(photo)}
                  >
                    <img
                      src={photo.thumb}
                      loading="lazy"
                      decoding="async"
                      className="w-full rounded-xl mb-4"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 预览弹窗 */}
      <Dialog open={!!preview} onOpenChange={() => setPreview(null)}>
        <DialogContent
          className="
            z-50
            w-[95vw]
            h-[95vh]
            max-w-none
            max-h-none
            bg-white/5
            backdrop-blur-2xl
            border border-white/15
            rounded-3xl
            p-4
            flex items-center justify-center
            shadow-[0_30px_80px_rgba(0,0,0,0.7)]
          "
        >
          {preview && (
            <img
              src={preview.full}
              className="max-w-full max-h-full object-contain"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
