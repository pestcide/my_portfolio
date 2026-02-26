from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
import os
import glob
from auth import verify_token, create_token, USERNAME, PASSWORD
from fastapi import HTTPException, Depends
import shutil
from fastapi import UploadFile, File
from PIL import Image, ImageOps


app = FastAPI()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PHOTO_DIR = os.path.join(BASE_DIR, "..", "Media")
BLOG_DIR = os.path.join(BASE_DIR, "..", "Blogs")

if not os.path.exists(PHOTO_DIR):
    os.makedirs(PHOTO_DIR, exist_ok=True)
if not os.path.exists(BLOG_DIR):
    os.makedirs(BLOG_DIR, exist_ok=True)

# 目标尺寸：最长边
SIZES = {
    800: 75,     # Masonry / 列表
    2400: 85,    # 预览 / 放大
}

# 挂载静态目录
app.mount("/Media", StaticFiles(directory=PHOTO_DIR), name="Media")
app.mount("/Blogs", StaticFiles(directory=BLOG_DIR), name="Blogs")


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

@app.post("/api/login")
def login(data: dict):
    username = data.get("username")
    password = data.get("password")

    if username != USERNAME or password != PASSWORD:
        raise HTTPException(status_code=401, detail="账号或密码错误")

    token = create_token(username)

    return {
        "token": token,
        "token_type": "bearer"
    }

@app.post("/api/upload")
def upload_image(
    file: UploadFile = File(...),
    user: str = Depends(verify_token)
):
    def is_image(file: UploadFile):
        return file.content_type.startswith("image/")
    def resize_keep_aspect(img: Image.Image, target: int) -> Image.Image:
        """
        保持横竖比例：
        - 以最长边为 target
        - 不裁剪
        - 不放大
        """
        w, h = img.size
        long_edge = max(w, h)

        if long_edge <= target:
            return img.copy()

        scale = target / long_edge
        new_size = (int(w * scale), int(h * scale))

        return img.resize(new_size, Image.LANCZOS)
    # ① 校验是否为图片
    if not is_image(file):
        raise HTTPException(400, "只能上传图片文件")

    # ② 取文件名（去后缀）
    filename = os.path.splitext(file.filename)[0]

    # ③ 创建文件夹
    folder_path = os.path.join(PHOTO_DIR, filename)

    if os.path.exists(folder_path):
        raise HTTPException(400, "该图片已存在")

    os.makedirs(folder_path, exist_ok=True)

    # ④ 临时保存原图
    temp_path = os.path.join(folder_path, "temp")

    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        with Image.open(temp_path) as img:
            img = ImageOps.exif_transpose(img)
            img = img.convert("RGB")
            for target, quality in SIZES.items():
                resized = resize_keep_aspect(img, target)

                out_path = os.path.join(folder_path, f"{target}.webp")
                resized.save(
                    out_path,
                    "WEBP",
                    quality=quality,
                    method=6
                )

    except Exception:
        shutil.rmtree(folder_path)
        raise HTTPException(500, "图片处理失败")

    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

    return {
        "msg": "上传并转换成功",
        "folder": filename,
        "thumb": f"/Media/{filename}/800.webp",
        "full": f"/Media/{filename}/2400.webp",
    }


@app.delete("/api/delete")
def delete_image(
    folder: str,
    user: str = Depends(verify_token)
):
    folder_path = os.path.join(PHOTO_DIR, folder)

    if not os.path.exists(folder_path):
        raise HTTPException(404, "图片文件夹不存在")

    shutil.rmtree(folder_path)

    return {"msg": "删除成功"}

@app.get("/api/me")
def get_me(user: str = Depends(verify_token)):
    return {
        "username": user
    }
    
@app.get("/api/Blogs")
def list_blogs():
    blogs = []

    for folder in os.listdir(BLOG_DIR):
        folder_path = os.path.join(BLOG_DIR, folder)

        if not os.path.isdir(folder_path):
            continue

        md_files = [
            f for f in os.listdir(folder_path)
            if f.endswith(".md")
        ]

        for md in md_files:
            blogs.append({
                "title": folder,
                "folder_url": f"/Blogs/{folder}",
                "md_url": f"/Blogs/{folder}/{md}"
            })

    return blogs