import { useEffect, useState } from "react";
import axios from "axios";
import { Dialog, DialogContent } from "@/components/ui/dialog";

export default function Photos() {
  const [photos, setPhotos] = useState([]);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    axios
      .get("http://localhost:8000/media")
      .then((res) => {
        setPhotos(res.data.media.filter((item) => item.type === "photo"));
      })
      .catch((err) => console.error(err));
  }, []);

  return (
    <div className="w-full min-h-screen bg-neutral-900 p-6 pt-24">

      {/* Masonry Layout */}
      <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
        {photos.map((item, idx) => (
          <div
            key={idx}
            className="break-inside-avoid cursor-pointer"
            onClick={() => setPreview(`http://localhost:8000${item.url}`)}
          >
            <img
              src={`http://localhost:8000${item.url}`}
              alt={item.title}
              loading="lazy"
              onLoad={(e)=> e.target.classList.remove("opacity-0")}
              className="
                w-full rounded-lg object-cover mb-2 hover:opacity-90 transition
                bg-neutral-800 opacity-0 duration-700
              "
            />

            {/* <p className="text-sm text-neutral-300 pl-2">
              • {item.title || "未命名图片"}
            </p> */}
          </div>
        ))}
      </div>

      {/* 点击图片放大 */}
      <Dialog open={!!preview} onOpenChange={() => setPreview(null)}>
        <DialogContent
          className="max-w-5xl max-h-[90vh] bg-neutral-950 border-neutral-800"
        >
          <img
            src={preview}
            className="w-auto h-auto max-h-[80vh] rounded mx-auto"
            alt="Preview"
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
