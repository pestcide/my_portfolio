import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

// ✅ Vite 官方推荐写法
const images = import.meta.glob(
  "/src/assets/photos/*.{jpg,jpeg,png,webp,JPG,PNG,WEBP}",
  {
    eager: true,
    query: "?url",
    import: "default",
  }
);

function shuffle(array) {
  let arr = array.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const photos = shuffle(Object.values(images));

export default function Photos() {
  const [preview, setPreview] = useState(null);

  return (
    <div className="relative w-full min-h-screen bg-neutral-950 p-6 pt-6 overflow-hidden">
      {/* 背景环境光（和 Home 页一致） */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-3xl" />
      </div>

      {/* Masonry */}
      <div className="relative z-10 columns-2 md:columns-4 lg:columns-6 gap-4 space-y-4">
        {photos.map((url, idx) => (
          <div
            key={idx}
            className="
              break-inside-avoid
              cursor-pointer
              transition
              hover:scale-[1.01]
            "
            onClick={() => setPreview(url)}
          >
            <img
              src={url}
              loading="lazy"
              alt=""
              onLoad={(e) =>
                e.currentTarget.classList.remove("opacity-0")
              }
              className="
                w-full rounded-xl object-cover mb-2
                bg-neutral-800
                opacity-0 duration-700 transition
                hover:opacity-90
              "
            />
          </div>
        ))}
      </div>

      {/* Preview */}
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
              src={preview}
              alt=""
              className="
                max-w-full
                max-h-full
                object-contain
                rounded-xl
              "
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
