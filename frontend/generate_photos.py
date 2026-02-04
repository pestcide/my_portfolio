from PIL import Image, ImageOps
from pathlib import Path

# ====== 配置 ======
SOURCE_DIR = Path("src/assets/photos")

# 目标尺寸：最长边
SIZES = {
    800: 75,     # Masonry / 列表
    2400: 85,    # 预览 / 放大
}

EXTS = {".jpg", ".jpeg", ".png", ".JPG", ".JPEG", ".PNG"}
# ==================

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


def process_image(img_path: Path):
    print(f"Processing: {img_path}")

    # 输出目录：以原文件名建文件夹
    out_dir = img_path.with_suffix("")
    out_dir.mkdir(exist_ok=True)

    with Image.open(img_path) as img:
        # ✅ 自动修正 EXIF 方向（手机拍的照片非常关键）
        img = ImageOps.exif_transpose(img)
        img = img.convert("RGB")

        for target, quality in SIZES.items():
            resized = resize_keep_aspect(img, target)

            out_path = out_dir / f"{target}.webp"
            resized.save(
                out_path,
                "WEBP",
                quality=quality,
                method=6
            )

            print(f"  → {out_path} ({resized.width}x{resized.height})")


def main():
    for path in SOURCE_DIR.glob("*"):
        if path.is_file() and path.suffix in EXTS:
            process_image(path)

    print("\n✅ All images processed.")


if __name__ == "__main__":
    main()
