# 个人网站项目

这是一个由前端 (React + Vite + Tailwind) 和后端 (FastAPI) 组成的个人作品展示网站。主要功能包括博客阅读、照片相册以及后台管理界面，用于上传/删除图片。前端静态资源通过 Nginx 部署，后端提供 REST API 服务并处理图片转换。

---

## ✨ 项目功能

- **博客列表**：目录页展示所有放在 `Blogs/` 文件夹下的 Markdown 文档，点击后可查看文章，支持 GitHub 风格 Markdown、公式、代码高亮和目录生成。
- **照片相册**：瀑布流展示服务器中 `Media/` 文件夹下的 WebP 图像，点击可预览大图。
- **后台管理**：登录后可上传图片（后端自动生成缩略图和大图）、预览即将上传的文件、单张或批量删除已有图片。
- **认证**：使用 JWT token 保护登录、上传和删除接口，账号密码可在 `backend/auth.py` 中修改。
- **图片处理**：后端使用 Pillow 进行裁剪、WEBP 转换并保留 EXIF 方向信息；本地有辅助脚本 `backend/generate_photos.py` 用于预处理照片。
- **前端构建**：使用 Vite 打包，生成的 `dist` 文件夹可直接由 Nginx 或其他静态服务器提供服务。

---

## 📁 项目结构

```
my_portfolio/
├── nginx.conf                # 示例 Nginx 配置
├── backend/
│   ├── main.py               # FastAPI 应用
│   ├── auth.py               # 简单的 JWT 认证
│   ├── requirements.txt      # Python 依赖
│   └── generate_photos.py    # 本地图片处理脚本
├── Blogs/                    # 存放博客 Markdown 文档的目录
├── Media/                    # 生成的 WebP 图片目录（运行后端自动创建）
├── frontend/                 # React + Vite 前端代码
│   ├── public/
│   ├── src/                  # 页面组件、样式等
│   ├── package.json
│   └── ...
└── README.md
```

---

## 🛠️ 环境准备

### 后端

1. 安装 Python 3.8+。
2. 创建虚拟环境并激活（可使用 `venv`、`conda` 等）。
3. 安装依赖：
   ```bash
   cd backend
   pip install -r requirements.txt
   ```
4. 修改 `backend/auth.py` 中的 `SECRET_KEY`、`USERNAME` 和 `PASSWORD` 为你自己的值。

### 前端

1. 安装 Node.js (推荐 18+)。
2. 进入前端目录并安装依赖：
   ```bash
   cd frontend
   npm install
   ```

---

## 🚀 本地运行

### 后端启动

```bash
cd backend
# 开发模式
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# 或者生产模式
# uvicorn main:app --host 0.0.0.0 --port 8000
```

API 将可在 `http://localhost:8000` 访问，常用端点：

- `GET /api/Media`：获取图片列表
- `POST /api/login`：登录获取 token（请求 JSON 包含 `username` 和 `password`）
- `POST /api/upload`：上传图片（需 `Authorization: Bearer <token>`）
- `DELETE /api/delete?folder=xxx`：删除图片文件夹
- `GET /api/Blogs`：读取博客列表
- `GET /api/me`：验证 token

### 前端开发

```bash
cd frontend
npm run dev
```

打开 `http://localhost:5173` 即可预览。

构建静态文件：

```bash
npm run build
# 结果在 frontend/dist/ 下
``` 

---

## 🧱 Nginx 部署前端

示例配置文件见根目录的 `nginx.conf`，内容已更新如下（请参照该文件）：

```nginx
worker_processes  auto;

events {
    worker_connections  1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;

    gzip on;
    gzip_min_length 1k;
    gzip_comp_level 6;
    gzip_types
      text/plain
      text/css
      application/javascript
      application/json
      image/svg+xml;
    gzip_vary on;

    server {
        listen 8080;            # 避免和系统 nginx 端口冲突，可改为 80 或其他
        server_name localhost;

        root /path/to/my_portfolio/frontend/dist;   # ⚠️ 改为你的 dist 绝对路径
        index index.html;

        location / {
            try_files $uri /index.html;
        }

        location ~* \.(js|css|png|jpg|jpeg|webp|gif|svg|ico|woff|woff2)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }

        access_log off;
    }
}
```

- 将 `root` 修改为前端构建输出的 `dist` 绝对路径。
- 监听端口默认是 `8080`；如果需要使用 `80` 或其他端口，请相应更改。
- 若希望前端通过同一域名访问后台 API，可在 `server` 中添加：
  ```nginx
  location /api/ {
      proxy_pass http://127.0.0.1:8000;
  }
  ```
  如不需要代理，前端仍可直接请求后端地址或部署在不同域名下。
- 其余 gzip、缓存设置可以根据性能要求进行调整。

部署时，将 `frontend/dist` 中的静态文件放到配置的 `root` 路径，然后执行：

```bash
sudo nginx -c /path/to/nginx.conf -s reload
```

---

---

## 📦 图片管理

- 上传的原图会被转换为两种尺寸 (`800.webp` 缩略图和 `2400.webp` 全尺寸)，存放于 `Media/<name>/` 文件夹。服务端会自动处理，此目录初次运行时为空。
- 如果需要离线预处理本地图片，可使用 `python backend/generate_photos.py`，将 `src/assets/photos` 目录下的图片按同样的规则生成 WebP 文件。

---

## 📝 博客写作

1. 在 `Blogs/` 目录中新建一个文件夹，名称即为文章标题。
2. 在该文件夹内放置一个或多个 `.md` Markdown 文件。
3. 文件可使用 GitHub 风格的扩展（表格、任务列表）、数学公式和代码高亮。

前端会自动抓取目录中 `.md` 文件并显示列表。

---

## 🔐 安全提醒

- 当前认证机制为简单的用户名/密码硬编码，仅适合个人使用。如需公开部署，请改用数据库存储、HTTPS 和更强的密钥管理。
- `SECRET_KEY` 不能公开以免 JWT 被伪造。

---

## 📄 许可

根据需要添加许可信息，例如 MIT。

---

如有问题或建议，欢迎联系。祝你使用愉快！
