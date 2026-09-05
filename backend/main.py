from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
import os
import glob
import json
import re
import uuid
from auth import verify_token, create_token, USERNAME, PASSWORD
from fastapi import HTTPException, Depends, Form
import shutil
from fastapi import UploadFile, File
from PIL import Image, ImageOps
from datetime import datetime


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


# ==================== 专辑（相册分组）数据层 ====================

ALBUMS_FILE = os.path.join(PHOTO_DIR, "albums.json")
UNCATEGORIZED_ID = "__uncategorized__"
UNCATEGORIZED_NAME = "未分类"


def scan_photo_folders():
    """扫描 Media 下所有有效照片文件夹（含 800.webp 缩略图）"""
    folders = []
    for name in os.listdir(PHOTO_DIR):
        folder_path = os.path.join(PHOTO_DIR, name)
        if os.path.isdir(folder_path) and os.path.exists(
            os.path.join(folder_path, "800.webp")
        ):
            folders.append(name)
    return folders


def _read_albums_file():
    """读取 albums.json，返回专辑列表；文件不存在/损坏返回 None"""
    try:
        with open(ALBUMS_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
        if isinstance(data.get("albums"), list):
            return data["albums"]
    except (FileNotFoundError, json.JSONDecodeError, OSError):
        pass
    return None


def _write_albums_file(albums):
    """原子写入 albums.json（临时文件 + os.replace）"""
    tmp_path = ALBUMS_FILE + ".tmp"
    with open(tmp_path, "w", encoding="utf-8") as f:
        json.dump({"albums": albums}, f, ensure_ascii=False, indent=2)
    os.replace(tmp_path, ALBUMS_FILE)


def get_album_state():
    """
    返回 (albums, disk_folders)。
    - 首次访问时自动创建 albums.json（存量照片天然属于"未分类"，无需迁移条目）
    - 懒清理：过滤掉磁盘上已不存在的幽灵照片，并写回
    """
    albums = _read_albums_file()
    if albums is None:
        if os.path.exists(ALBUMS_FILE):
            shutil.copy2(ALBUMS_FILE, ALBUMS_FILE + ".bak")
        albums = []
        _write_albums_file(albums)
        return albums, set(scan_photo_folders())

    disk = set(scan_photo_folders())
    changed = False
    for alb in albums:
        cleaned = [f for f in alb.get("photos", []) if f in disk]
        if len(cleaned) != len(alb.get("photos", [])):
            alb["photos"] = cleaned
            changed = True
    if changed:
        _write_albums_file(albums)

    return albums, disk


def _find_album(albums, album_id):
    return next((a for a in albums if a["id"] == album_id), None)


def _photo_payload(folder):
    p800 = os.path.join(PHOTO_DIR, folder, "800.webp")
    return {
        "folder": folder,
        "thumb": f"/Media/{folder}/800.webp",
        "full": f"/Media/{folder}/2400.webp",
        "_mtime": os.path.getmtime(p800) if os.path.exists(p800) else 0,
    }


def _album_payload(alb, photos):
    cover_folder = alb.get("cover")
    if cover_folder not in [p["folder"] for p in photos]:
        cover_folder = photos[0]["folder"] if photos else None
    cover = next((p for p in photos if p["folder"] == cover_folder), None)
    return {
        "id": alb["id"],
        "name": alb["name"],
        "cover": cover,
        "photos": photos,
    }


@app.get("/api/Media")
def get_photos():
    files = glob.iglob(
        os.path.join(PHOTO_DIR, "**/*.webp"),
        recursive=True
    )

    photos = {}

    for f in files:
        rel_path = os.path.relpath(f, PHOTO_DIR)
        rel_path = rel_path.replace("\\", "/")
        url = f"/Media/{rel_path}"

        # ✅ 获取文件修改时间
        mtime = datetime.fromtimestamp(os.path.getmtime(f))

        if rel_path.endswith("800.webp"):
            key = rel_path.replace("800.webp", "").rstrip("/")
            photos.setdefault(key, {})["thumb"] = url
            photos[key]["time"] = mtime

        if rel_path.endswith("2400.webp"):
            key = rel_path.replace("2400.webp", "").rstrip("/")
            photos.setdefault(key, {})["full"] = url
            photos[key]["time"] = mtime

    # ✅ 排序（最新在前）
    result = list(photos.values())
    result.sort(key=lambda x: x.get("time") or datetime.min, reverse=True)

    for r in result:
        r["folder"] = r["thumb"].split("/")[2]
        r.pop("time", None)

    return result

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
    album_id: str = Form(None),
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

    # ⑤ 归入指定专辑（默认未分类，无需处理）
    if album_id and album_id != UNCATEGORIZED_ID:
        albums, _ = get_album_state()
        alb = _find_album(albums, album_id)
        if alb is not None and filename not in alb["photos"]:
            alb["photos"].append(filename)
            _write_albums_file(albums)

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


# ==================== 专辑管理接口 ====================

@app.get("/api/Albums")
def list_albums():
    """返回全部专辑 + 未分类 + 全部照片（前台一次请求拿全）"""
    albums, disk = get_album_state()
    used = set()

    album_list = []
    for alb in albums:
        photos = [_photo_payload(f) for f in alb["photos"]]
        photos.sort(key=lambda p: p["_mtime"], reverse=True)
        used.update(alb["photos"])
        album_list.append(_album_payload(alb, photos))

    uncategorized_photos = [_photo_payload(f) for f in disk - used]
    uncategorized_photos.sort(key=lambda p: p["_mtime"], reverse=True)
    uncategorized = _album_payload(
        {
            "id": UNCATEGORIZED_ID,
            "name": UNCATEGORIZED_NAME,
            "cover": None,
        },
        uncategorized_photos,
    )

    all_photos = sorted(
        [p for p in uncategorized_photos] +
        [p for a in album_list for p in a["photos"]],
        key=lambda p: p["_mtime"],
        reverse=True,
    )

    def strip_mtime(payload):
        if payload.get("cover"):
            payload["cover"].pop("_mtime", None)
        for p in payload["photos"]:
            p.pop("_mtime", None)
        return payload

    album_list = [strip_mtime(a) for a in album_list]
    uncategorized = strip_mtime(uncategorized)
    for p in all_photos:
        p.pop("_mtime", None)

    return {
        "albums": album_list,
        "uncategorized": uncategorized,
        "all_photos": all_photos,
    }


@app.post("/api/Albums")
def create_album(data: dict, user: str = Depends(verify_token)):
    name = (data.get("name") or "").strip()
    if not name:
        raise HTTPException(400, "专辑名称不能为空")

    albums, _ = get_album_state()
    if any(a["name"] == name for a in albums):
        raise HTTPException(400, "专辑名称已存在")

    alb = {
        "id": uuid.uuid4().hex[:8],
        "name": name,
        "cover": None,
        "created_at": datetime.now().isoformat(timespec="seconds"),
        "photos": [],
    }
    albums.append(alb)
    _write_albums_file(albums)

    return {
        "msg": "创建成功",
        "id": alb["id"],
        "name": alb["name"],
    }


@app.patch("/api/Albums/{album_id}")
def update_album(album_id: str, data: dict, user: str = Depends(verify_token)):
    albums, _ = get_album_state()
    alb = _find_album(albums, album_id)
    if not alb:
        raise HTTPException(404, "专辑不存在")

    if "name" in data:
        name = (data["name"] or "").strip()
        if not name:
            raise HTTPException(400, "专辑名称不能为空")
        if any(a["name"] == name and a["id"] != album_id for a in albums):
            raise HTTPException(400, "专辑名称已存在")
        alb["name"] = name

    if "cover" in data:
        cover = data["cover"]
        if cover is not None and cover not in alb["photos"]:
            raise HTTPException(400, "封面必须是专辑内的照片")
        alb["cover"] = cover

    _write_albums_file(albums)
    return {"msg": "更新成功"}


@app.delete("/api/Albums/{album_id}")
def delete_album(album_id: str, user: str = Depends(verify_token)):
    if album_id == UNCATEGORIZED_ID:
        raise HTTPException(400, "未分类专辑不可删除")

    albums, _ = get_album_state()
    alb = _find_album(albums, album_id)
    if not alb:
        raise HTTPException(404, "专辑不存在")

    # 删除专辑后，其照片自动归入"未分类"（隐式规则，无需移动）
    albums.remove(alb)
    _write_albums_file(albums)

    return {"msg": "删除成功"}


@app.post("/api/Albums/{album_id}/photos")
def move_photos_to_album(album_id: str, data: dict, user: str = Depends(verify_token)):
    """
    批量把照片移入指定专辑（一张照片只属于一个专辑，自动从其他专辑移除）。
    album_id 为未分类时表示"移出所有专辑"。
    """
    folders = data.get("folders") or []
    if not folders:
        raise HTTPException(400, "未选择照片")

    albums, disk = get_album_state()

    if album_id == UNCATEGORIZED_ID:
        target = None
    else:
        target = _find_album(albums, album_id)
        if not target:
            raise HTTPException(404, "专辑不存在")

    changed = False
    for folder in folders:
        if folder not in disk:
            continue

        for alb in albums:
            if folder in alb["photos"]:
                alb["photos"].remove(folder)
                changed = True

        if target is not None:
            target["photos"].append(folder)
            changed = True

    if changed:
        _write_albums_file(albums)

    return {"msg": "移动成功"}


@app.delete("/api/Albums/{album_id}/photos")
def remove_photos_from_album(album_id: str, data: dict, user: str = Depends(verify_token)):
    """批量把照片移出指定专辑（照片自动回到未分类）"""
    folders = data.get("folders") or []
    if not folders:
        raise HTTPException(400, "未选择照片")

    albums, _ = get_album_state()
    alb = _find_album(albums, album_id)
    if not alb:
        raise HTTPException(404, "专辑不存在")

    changed = False
    for folder in folders:
        if folder in alb["photos"]:
            alb["photos"].remove(folder)
            changed = True

    if changed:
        _write_albums_file(albums)

    return {"msg": "移出成功"}


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
            md_path = os.path.join(folder_path, md)
            blogs.append({
                "folder": folder,
                "title": folder,
                "folder_url": f"/Blogs/{folder}",
                "md_url": f"/Blogs/{folder}/{md}",
                "mtime": os.path.getmtime(md_path),
            })

    # 最新修改在前
    blogs.sort(key=lambda b: b["mtime"], reverse=True)
    for b in blogs:
        b.pop("mtime", None)

    return blogs


# ==================== 博客专栏数据层 ====================

COLUMNS_FILE = os.path.join(BLOG_DIR, "columns.json")


def scan_blog_folders():
    """扫描 Blogs 下的文章文件夹（至少含一个 .md 文件）"""
    folders = []
    for name in os.listdir(BLOG_DIR):
        folder_path = os.path.join(BLOG_DIR, name)
        if os.path.isdir(folder_path):
            has_md = any(f.endswith(".md") for f in os.listdir(folder_path))
            if has_md:
                folders.append(name)
    return folders


def _read_columns_file():
    try:
        with open(COLUMNS_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
        if isinstance(data.get("columns"), list):
            return data["columns"]
    except (FileNotFoundError, json.JSONDecodeError, OSError):
        pass
    return None


def _write_columns_file(columns):
    tmp_path = COLUMNS_FILE + ".tmp"
    with open(tmp_path, "w", encoding="utf-8") as f:
        json.dump({"columns": columns}, f, ensure_ascii=False, indent=2)
    os.replace(tmp_path, COLUMNS_FILE)


def get_columns_state():
    """返回 (columns, disk_folders)；懒清理磁盘上已不存在的幽灵文章"""
    columns = _read_columns_file()
    if columns is None:
        if os.path.exists(COLUMNS_FILE):
            shutil.copy2(COLUMNS_FILE, COLUMNS_FILE + ".bak")
        columns = []
        _write_columns_file(columns)
        return columns, set(scan_blog_folders())

    disk = set(scan_blog_folders())
    changed = False
    for col in columns:
        cleaned = [f for f in col.get("posts", []) if f in disk]
        if len(cleaned) != len(col.get("posts", [])):
            col["posts"] = cleaned
            changed = True
    if changed:
        _write_columns_file(columns)

    return columns, disk


def _find_column(columns, column_id):
    return next((c for c in columns if c["id"] == column_id), None)


def safe_name(name):
    """校验文件/文件夹名：非空、不含路径分隔符与非法字符"""
    name = (name or "").strip()
    if not name or re.search(r'[\\/:*?"<>|]|\.\.', name):
        return None
    return name


def _post_payload(folder):
    """读取文章文件夹信息：md_url + 摘要"""
    folder_path = os.path.join(BLOG_DIR, folder)
    md_files = sorted(f for f in os.listdir(folder_path) if f.endswith(".md"))
    if not md_files:
        return None

    md = md_files[0]
    md_path = os.path.join(folder_path, md)

    # 摘要：正文第一个非标题/非代码/非图片的段落
    description = ""
    try:
        with open(md_path, "r", encoding="utf-8", errors="ignore") as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                if line.startswith(("#", "```", "!", ">", "---", "|")):
                    continue
                description = line[:80]
                break
    except OSError:
        pass

    return {
        "folder": folder,
        "title": folder,
        "md_url": f"/Blogs/{folder}/{md}",
        "description": description,
        "_mtime": os.path.getmtime(md_path),
    }


def _strip_mtime(payload):
    if isinstance(payload, dict):
        payload.pop("_mtime", None)
    return payload


# ==================== 专栏管理接口 ====================

@app.get("/api/Columns")
def list_columns():
    """返回全部专栏 + 所有文章（一次请求，前台博客列表直接用）"""
    columns, disk = get_columns_state()
    used = set()

    column_list = []
    column_of = {}
    for col in columns:
        posts = [_post_payload(f) for f in col["posts"]]
        posts = [p for p in posts if p]
        posts.sort(key=lambda p: p["_mtime"], reverse=True)
        for p in posts:
            column_of[p["folder"]] = (col["id"], col["name"])
        column_list.append({
            "id": col["id"],
            "name": col["name"],
            "posts": posts,
        })

    # 全部文章（mtime 倒序）+ 归属信息
    all_posts = []
    for f in disk:
        p = _post_payload(f)
        if not p:
            continue
        column_id, column_name = column_of.get(f, (None, None))
        p["column_id"] = column_id
        p["column"] = column_name
        all_posts.append(p)
    all_posts.sort(key=lambda p: p["_mtime"], reverse=True)

    # 统一去掉内部排序字段
    for col in column_list:
        col["posts"] = [_strip_mtime(p) for p in col["posts"]]
    all_posts = [_strip_mtime(p) for p in all_posts]

    return {
        "columns": column_list,
        "posts": all_posts,
    }


@app.post("/api/Columns")
def create_column(data: dict, user: str = Depends(verify_token)):
    name = (data.get("name") or "").strip()
    if not name:
        raise HTTPException(400, "专栏名称不能为空")

    columns, _ = get_columns_state()
    if any(c["name"] == name for c in columns):
        raise HTTPException(400, "专栏名称已存在")

    col = {
        "id": uuid.uuid4().hex[:8],
        "name": name,
        "created_at": datetime.now().isoformat(timespec="seconds"),
        "posts": [],
    }
    columns.append(col)
    _write_columns_file(columns)

    return {"msg": "创建成功", "id": col["id"], "name": col["name"]}


@app.patch("/api/Columns/{column_id}")
def update_column(column_id: str, data: dict, user: str = Depends(verify_token)):
    columns, _ = get_columns_state()
    col = _find_column(columns, column_id)
    if not col:
        raise HTTPException(404, "专栏不存在")

    name = (data.get("name") or "").strip()
    if not name:
        raise HTTPException(400, "专栏名称不能为空")
    if any(c["name"] == name and c["id"] != column_id for c in columns):
        raise HTTPException(400, "专栏名称已存在")

    col["name"] = name
    _write_columns_file(columns)
    return {"msg": "更新成功"}


@app.delete("/api/Columns/{column_id}")
def delete_column(column_id: str, user: str = Depends(verify_token)):
    columns, _ = get_columns_state()
    col = _find_column(columns, column_id)
    if not col:
        raise HTTPException(404, "专栏不存在")

    # 删除专栏后文章仍在"全部"列表中，不丢失
    columns.remove(col)
    _write_columns_file(columns)
    return {"msg": "删除成功"}


@app.post("/api/Columns/{column_id}/posts")
def assign_posts_to_column(column_id: str, data: dict, user: str = Depends(verify_token)):
    """把文章归入专栏（一篇文章只属于一个专栏，自动从其他专栏移除）"""
    folders = data.get("folders") or []
    if not folders:
        raise HTTPException(400, "未选择文章")

    columns, disk = get_columns_state()
    col = _find_column(columns, column_id)
    if not col:
        raise HTTPException(404, "专栏不存在")

    changed = False
    for folder in folders:
        if folder not in disk:
            continue
        for c in columns:
            if folder in c["posts"]:
                c["posts"].remove(folder)
                changed = True
        col["posts"].append(folder)
        changed = True

    if changed:
        _write_columns_file(columns)
    return {"msg": "归入成功"}


@app.delete("/api/Columns/{column_id}/posts")
def remove_posts_from_column(column_id: str, data: dict, user: str = Depends(verify_token)):
    """把文章移出专栏（文章保留在"全部"列表）"""
    folders = data.get("folders") or []
    if not folders:
        raise HTTPException(400, "未选择文章")

    columns, _ = get_columns_state()
    col = _find_column(columns, column_id)
    if not col:
        raise HTTPException(404, "专栏不存在")

    changed = False
    for folder in folders:
        if folder in col["posts"]:
            col["posts"].remove(folder)
            changed = True

    if changed:
        _write_columns_file(columns)
    return {"msg": "移出成功"}


# ==================== 博客在线编辑接口 ====================

@app.post("/api/Blogs")
def create_blog(data: dict, user: str = Depends(verify_token)):
    """新建文章：创建文件夹 + index.md 模板"""
    title = safe_name(data.get("title"))
    if not title:
        raise HTTPException(400, "标题为空或包含非法字符（不允许 \\/:*?\"<>| ..）")

    folder_path = os.path.join(BLOG_DIR, title)
    if os.path.exists(folder_path):
        raise HTTPException(400, "同名文章已存在")

    os.makedirs(folder_path, exist_ok=True)
    try:
        with open(os.path.join(folder_path, "index.md"), "w", encoding="utf-8") as f:
            f.write(f"# {title}\n\n")
    except OSError:
        shutil.rmtree(folder_path, ignore_errors=True)
        raise HTTPException(500, "文章创建失败")

    return {
        "msg": "创建成功",
        "folder": title,
        "md_url": f"/Blogs/{title}/index.md",
    }


@app.get("/api/Blogs/{folder}")
def read_blog(folder: str, user: str = Depends(verify_token)):
    """读取文章 Markdown 原文（供编辑器使用）"""
    folder = safe_name(folder)
    if not folder:
        raise HTTPException(400, "非法路径")
    folder_path = os.path.join(BLOG_DIR, folder)
    if not os.path.isdir(folder_path):
        raise HTTPException(404, "文章不存在")

    md_files = sorted(f for f in os.listdir(folder_path) if f.endswith(".md"))
    if not md_files:
        raise HTTPException(404, "文章不存在")

    md = md_files[0]
    try:
        with open(os.path.join(folder_path, md), "r", encoding="utf-8", errors="ignore") as f:
            content = f.read()
    except OSError:
        raise HTTPException(500, "读取失败")

    return {
        "folder": folder,
        "md_url": f"/Blogs/{folder}/{md}",
        "content": content,
    }


@app.put("/api/Blogs/{folder}")
def save_blog(folder: str, data: dict, user: str = Depends(verify_token)):
    """保存文章内容（写入该文件夹现有 md；不存在则创建 index.md）"""
    folder = safe_name(folder)
    if not folder:
        raise HTTPException(400, "非法路径")

    folder_path = os.path.join(BLOG_DIR, folder)
    if not os.path.isdir(folder_path):
        raise HTTPException(404, "文章不存在")

    content = data.get("content")
    if not isinstance(content, str):
        raise HTTPException(400, "内容不能为空")

    md_files = sorted(f for f in os.listdir(folder_path) if f.endswith(".md"))
    md = md_files[0] if md_files else "index.md"

    try:
        with open(os.path.join(folder_path, md), "w", encoding="utf-8") as f:
            f.write(content)
    except OSError:
        raise HTTPException(500, "保存失败")

    return {
        "msg": "保存成功",
        "md_url": f"/Blogs/{folder}/{md}",
    }


@app.delete("/api/Blogs/{folder}")
def delete_blog(folder: str, user: str = Depends(verify_token)):
    """删除文章文件夹，并同步从所有专栏移除"""
    folder = safe_name(folder)
    if not folder:
        raise HTTPException(400, "非法路径")

    folder_path = os.path.join(BLOG_DIR, folder)
    if not os.path.isdir(folder_path):
        raise HTTPException(404, "文章不存在")

    shutil.rmtree(folder_path)

    # 从专栏中移除
    columns, _ = get_columns_state()
    changed = False
    for col in columns:
        if folder in col["posts"]:
            col["posts"].remove(folder)
            changed = True
    if changed:
        _write_columns_file(columns)

    return {"msg": "删除成功"}


@app.post("/api/Blogs/{folder}/images")
def upload_blog_image(
    folder: str,
    file: UploadFile = File(...),
    user: str = Depends(verify_token)
):
    """上传文章配图：转 WebP（最长边 1200），存入文章文件夹，返回相对 Markdown 链接"""
    folder = safe_name(folder)
    if not folder:
        raise HTTPException(400, "非法路径")

    folder_path = os.path.join(BLOG_DIR, folder)
    if not os.path.isdir(folder_path):
        raise HTTPException(404, "文章不存在")

    if not file.content_type.startswith("image/"):
        raise HTTPException(400, "只能上传图片文件")

    base = os.path.splitext(os.path.basename(file.filename))[0]
    base = safe_name(base) or "image"

    # 临时保存原图
    temp_path = os.path.join(folder_path, "temp_image")
    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        with Image.open(temp_path) as img:
            img = ImageOps.exif_transpose(img)
            img = img.convert("RGB")

            w, h = img.size
            long_edge = max(w, h)
            if long_edge > 1200:
                scale = 1200 / long_edge
                img = img.resize(
                    (int(w * scale), int(h * scale)),
                    Image.LANCZOS
                )

            # 文件名冲突则追加序号
            out_name = f"{base}.webp"
            i = 1
            while os.path.exists(os.path.join(folder_path, out_name)):
                i += 1
                out_name = f"{base}-{i}.webp"

            img.save(
                os.path.join(folder_path, out_name),
                "WEBP",
                quality=80,
                method=6
            )
    except Exception:
        raise HTTPException(500, "图片处理失败")
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

    return {
        "msg": "上传成功",
        "file": out_name,
        # 相对链接：随文章文件夹移动不受影响，BlogPost 会自动拼接 basePath
        # 文件名可能含空格，用 <> 包裹目的地保证 Markdown 链接解析正确
        "md_link": f"![{base}](<{out_name}>)",
    }