import { useEffect, useState } from "react";
import axios from "axios";

export default function Photos() {
  const [photos, setPhotos] = useState([]);

  useEffect(() => {
    axios.get("http://localhost:8000/media")
      .then(res => {
        setPhotos(res.data.media.filter(item => item.type === "photo"));
      })
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="p-4 mx-auto max-w-screen-lg">
      <h1 className="text-2xl font-bold mb-4 text-center">图片展示</h1>
      <div className="grid gap-4" >
        {photos.map((item, idx) => (
          <img
            key={idx}
            src={`http://localhost:8000${item.url}`}
            alt={item.title}
            className="w-full h-auto object-contain rounded-lg shadow"
          />
        ))}
      </div>
    </div>
  );
}
