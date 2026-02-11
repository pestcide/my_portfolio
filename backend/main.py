from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
import os
import glob

app = FastAPI()

PHOTO_DIR = "../Media"   # 按实际路径改

# 挂载静态目录
app.mount("/Media", StaticFiles(directory=PHOTO_DIR), name="Media")


@app.get("/api/Media")
def get_photos():
    files = glob.iglob(
        os.path.join(PHOTO_DIR, "**/*.webp"),
        recursive=True
    )

    photos = {}

    for f in files:
        # ① 转相对路径（去掉 ./Media 前缀）
        rel_path = os.path.relpath(f, PHOTO_DIR)

        # ② Windows -> URL 路径
        rel_path = rel_path.replace("\\", "/")

        # ③ 生成 URL
        url = f"/Media/{rel_path}"

        # ④ 生成 key（去掉文件名）
        if rel_path.endswith("800.webp"):
            key = rel_path.replace("800.webp", "")
            photos.setdefault(key, {})["thumb"] = url

        if rel_path.endswith("2400.webp"):
            key = rel_path.replace("2400.webp", "")
            photos.setdefault(key, {})["full"] = url

    return list(photos.values())



