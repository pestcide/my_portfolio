import { useEffect, useState } from "react";
import axios from "axios";
import { Dialog, DialogContent } from "@/components/ui/dialog";

export default function Photos() {
  const [videos, setVideos] = useState([]);
  const [preview, setPreview] = useState(null); // 当前播放视频的 url

  useEffect(() => {
    axios
      .get("http://localhost:8000/media")
      .then((res) => {
        setVideos(res.data.media.filter((item) => item.type === "video"));
      })
      .catch((err) => console.error(err));
  }, []);

  return (
    <div className="w-full min-h-screen bg-neutral-900 p-6 pt-24">
      {/* Masonry Layout */}
      <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
        {videos.map((item, idx) => (
          <div
            key={idx}
            className="break-inside-avoid cursor-pointer"
            onClick={() => setPreview(`http://localhost:8000${item.url}`)}
          >
            <img
              src={`http://localhost:8000/thumbnail?video=${item.title}`}
              alt={item.title}
              className="w-full rounded-lg object-cover mb-2 hover:opacity-90 transition"
            />
            <p className="text-sm text-neutral-300 pl-2">
              {item.title || "未命名视频"}
            </p>
          </div>
        ))}
      </div>

      {/* 点击封面播放视频 */}
      <Dialog open={!!preview} onOpenChange={() => setPreview(null)}>
        <DialogContent className="max-w-5xl bg-neutral-950 border-neutral-800 p-4">
          {preview && (
            <video
              src={preview}
              controls
              autoPlay
              className="w-full rounded-lg"
              onEnded={() => setPreview(null)} // 视频播放结束自动关闭
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
