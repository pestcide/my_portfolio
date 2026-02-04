import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

function createSeededRandom(seed) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }

  return function () {
    h += h << 13;
    h ^= h >>> 7;
    h += h << 3;
    h ^= h >>> 17;
    h += h << 5;
    return (h >>> 0) / 4294967296;
  };
}

function shuffleStable(array, seed) {
  const rng = createSeededRandom(seed);
  const arr = [...array];

  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }

  return arr;
}


/**
 * 缩略图
 */
const thumbs = import.meta.glob(
  "/src/assets/photos/**/800.webp",
  {
    eager: true,
    query: "?url",
    import: "default",
  }
);

/**
 * 大图
 */
const full = import.meta.glob(
  "/src/assets/photos/**/2400.webp",
  {
    eager: true,
    query: "?url",
    import: "default",
  }
);

/**
 * 建立映射
 */
// 用“当天日期”作为 seed
const seed = new Date().toISOString().slice(0, 10);

const photos = shuffleStable(
  Object.keys(thumbs).map((key) => {
    const fullKey = key.replace(/800\.webp$/, "2400.webp");

    return {
      thumb: thumbs[key],
      full: full[fullKey],
    };
  }),
  seed
);


export default function Photos() {
  const [preview, setPreview] = useState(null);

  return (
    <div className="relative w-full min-h-screen bg-neutral-950 p-6 overflow-hidden">
      {/* Masonry */}
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
              src={preview.full}
              className="max-w-full max-h-full object-contain"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
