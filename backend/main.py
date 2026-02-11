from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
import os
import glob
from auth import verify_token, create_token, USERNAME, PASSWORD
from fastapi import HTTPException, Depends
import shutil
from fastapi import UploadFile, File
from PIL import Image


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
        # ⑤ 打开图片
        img = Image.open(temp_path).convert("RGB")

        # ===== 生成 2400 =====
        img_2400 = img.copy()
        img_2400.thumbnail((2400, 2400))

        full_path = os.path.join(folder_path, "2400.webp")
        img_2400.save(full_path, "WEBP", quality=95)

        # ===== 生成 800 =====
        img_800 = img.copy()
        img_800.thumbnail((800, 800))

        thumb_path = os.path.join(folder_path, "800.webp")
        img_800.save(thumb_path, "WEBP", quality=90)

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
