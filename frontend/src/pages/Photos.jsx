import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

export default function Photos() {
  const [photos, setPhotos] = useState([]);
  const [preview, setPreview] = useState(null);

  /**
   * 从后端获取图片列表
   */
  useEffect(() => {
    fetch("/api/Media")
      .then((res) => res.json())
      .then((data) => {
        setPhotos(data);
      })
      .catch((err) => {
        console.error("加载图片失败:", err);
      });
  }, []);

  return (
    <div className="relative w-full min-h-screen bg-neutral-950 p-6 overflow-hidden">
      
      {/* Masonry 瀑布流 */}
      <div className="columns-2 md:columns-4 lg:columns-6 gap-4 space-y-4">
        {photos.map((photo, idx) => (
          <div
            key={idx}
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
