import { useEffect, useState } from "react";
import axios from "axios";

export default function Videos() {
  const [videos, setVideos] = useState([]);

  useEffect(() => {
    axios.get("http://localhost:8000/media")
      .then(res => {
        setVideos(res.data.media.filter(item => item.type === "video"));
      })
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="p-4 mx-auto max-w-screen-lg">
      <h1 className="text-2xl font-bold mb-4 text-center">视频展示</h1>
      <div className="grid gap-4">
        {videos.map((item, idx) => (
          <video
            key={idx}
            src={`http://localhost:8000${item.url}`}
            controls
            className="w-full h-auto rounded-lg shadow"
          />
        ))}
      </div>
    </div>
  );
}
