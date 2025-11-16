from fastapi import FastAPI, Query
from moviepy import VideoFileClip
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from PIL import Image
from io import BytesIO
import os
from glob import glob
import numpy as np

app = FastAPI()

# 跨域允许前端访问
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 或填写前端地址
    allow_methods=["*"],
    allow_headers=["*"],
)

# 挂载静态目录
app.mount("/media", StaticFiles(directory="media"), name="media")

# 动态返回压缩图片
@app.get("/media_compressed/photos/{filename}")
def get_compressed_photo(filename: str, max_width: int = 1200):
    path = os.path.join("media", "photos", filename)
    if not os.path.exists(path):
        return {"error": "File not found"}

    img = Image.open(path)

    # 转换为 RGB（避免 CMYK / RGBA 报错）
    if img.mode != "RGB":
        img = img.convert("RGB")

    # 判断宽度，保持比例缩放
    if img.width > max_width:
        new_height = int(max_width * img.height / img.width)
        # Pillow >= 10 推荐用 Resampling.LANCZOS
        img = img.resize((max_width, new_height), Image.Resampling.LANCZOS)

    buf = BytesIO()
    img.save(buf, format="JPEG", optimize=True, quality=85)
    buf.seek(0)
    return StreamingResponse(buf, media_type="image/jpeg")

@app.get("/thumbnail")
def get_thumbnail(video: str = Query(...)):
    print(video)
    video_path = os.path.join("media", "videos", video)
    if not os.path.exists(video_path):
        print("Video not found")
        return {"error": "Video not found"}

    clip = VideoFileClip(video_path)
    # frame = clip.get_frame(1)  # 获取1秒处的帧 (numpy array)
    # 获取第一帧（t=0）
    frame = clip.get_frame(0)

    # 确保为 uint8 并去掉可能的 alpha 通道
    frame = np.asarray(frame)
    if frame.dtype != np.uint8:
        frame = np.clip(frame, 0, 255).astype(np.uint8)
    if frame.ndim == 3 and frame.shape[2] == 4:
        frame = frame[:, :, :3]
    clip.close()

    # 转为 PIL Image
    img = Image.fromarray(frame)
    buffer = BytesIO()
    img.save(buffer, format="JPEG")
    buffer.seek(0)

    return StreamingResponse(buffer, media_type="image/jpeg")

# 动态返回媒体列表
@app.get("/media")
def get_media():
    photos = glob(os.path.join("media", "photos", "*"))
    videos = glob(os.path.join("media", "videos", "*"))
    media = []

    for photo in photos:
        filename = os.path.basename(photo)
        media.append({
            "type": "photo",
            "url": f"/media/photos/{filename}",  # 原图
            "compressed_url": f"/media_compressed/photos/{filename}",  # 压缩图
            "title": filename
        })
    for video in videos:
        filename = os.path.basename(video)
        media.append({
            "type": "video",
            "url": f"/media/videos/{filename}",
            "title": filename
        })
    
    return {"media": media}
