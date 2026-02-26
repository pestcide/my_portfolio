
import { useEffect, useState } from "react";

export default function Admin() {
  const [files, setFiles] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [selected, setSelected] = useState([]);

  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [msg, setMsg] = useState("");
  const [checking, setChecking] = useState(true);

  const token = localStorage.getItem("token");

  // ===== 登录校验 =====
  useEffect(() => {
    if (!token) {
      window.location.href = "/login";
      return;
    }

    fetch("/api/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }).then((res) => {
      if (!res.ok) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      } else {
        setChecking(false);
        loadPhotos();
      }
    });
  }, []);

  // ===== 加载图库 =====
  async function loadPhotos() {
    const res = await fetch("/api/Media");
    const data = await res.json();
    setPhotos(data);
  }

  // ===== 选择文件 =====
  function handleSelect(e) {
    setFiles([...e.target.files]);
  }

  // ===== 上传 =====
  async function handleUpload() {
    if (!files.length) return;

    setUploading(true);
    setMsg("");

    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/upload", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.detail || "上传失败");
        }
      }

      setMsg("上传成功 ✅");
      setFiles([]);
      document.getElementById("fileInput").value = "";
      loadPhotos();
    } catch (err) {
      setMsg(err.message);
    } finally {
      setUploading(false);
    }
  }

  // ===== 勾选 =====
  function toggleSelect(url) {
    setSelected((prev) =>
      prev.includes(url)
        ? prev.filter((u) => u !== url)
        : [...prev, url]
    );
  }

  function selectAll() {
    setSelected(photos.map((p) => p.thumb));
  }

  function clearSelect() {
    setSelected([]);
  }

  // ===== 单删 =====
  async function handleDeleteByUrl(url) {
    const match = url.match(/\/Media\/(.*?)\//);
    if (!match) return;

    const folder = match[1];

    if (!confirm(`确定删除 ${folder} ?`)) return;

    try {
      const res = await fetch(`/api/delete?folder=${folder}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "删除失败");
      }

      setMsg("删除成功 🗑️");
      loadPhotos();
    } catch (err) {
      setMsg(err.message);
    }
  }

  // ===== 批量删除 =====
  async function handleBatchDelete() {
    if (selected.length === 0) return;

    if (!confirm(`确定删除选中的 ${selected.length} 项？`)) return;

    setDeleting(true);
    setMsg("");

    try {
      for (const url of selected) {
        const match = url.match(/\/Media\/(.*?)\//);
        if (!match) continue;

        const folder = match[1];

        const res = await fetch(`/api/delete?folder=${folder}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.detail || `删除失败: ${folder}`);
        }
      }

      setMsg("批量删除成功 🗑️");
      setSelected([]);
      loadPhotos();
    } catch (err) {
      setMsg(err.message);
    } finally {
      setDeleting(false);
    }
  }

  // ===== 登录检测中 =====
  if (checking) {
    return (
      <div className="w-screen h-screen bg-neutral-950 flex items-center justify-center text-neutral-400">
        Checking login...
      </div>
    );
  }

  return (
    <div className="relative w-screen min-h-screen bg-neutral-950 overflow-hidden">
      {/* 背景光晕 */}
      <div className="absolute inset-0">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-blue-500/20 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-24 flex flex-col gap-16">

        {/* ===== 上传 ===== */}
        <section className="bg-white/5 backdrop-blur-3xl border border-white/15 rounded-3xl p-10 shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
          <h2 className="text-xl font-semibold text-neutral-100 mb-6">
            上传图片
          </h2>

          <div className="flex flex-col md:flex-row gap-6 items-center">
            <input
              id="fileInput"
              type="file"
              multiple
              accept="image/*"
              onChange={handleSelect}
              className="text-neutral-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-white/90 file:text-neutral-900 hover:file:bg-white file:cursor-pointer"
            />

            <button
              onClick={handleUpload}
              disabled={uploading}
              className="px-6 py-3 rounded-full bg-white/90 text-neutral-900 font-semibold shadow-lg hover:bg-white hover:scale-105 transition disabled:opacity-50"
            >
              {uploading ? "上传中..." : "开始上传"}
            </button>
          </div>

          {msg && (
            <div className="mt-4 text-sm text-neutral-300">{msg}</div>
          )}
        </section>

        {/* ===== 上传预览 ===== */}
        {files.length > 0 && (
          <section className="bg-white/5 backdrop-blur-3xl border border-white/15 rounded-3xl p-10 shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
            <h2 className="text-xl font-semibold text-neutral-100 mb-6">
              上传预览
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {files.map((file, i) => (
                <div key={i} className="bg-white/5 rounded-xl overflow-hidden border border-white/10">
                  <img
                    src={URL.createObjectURL(file)}
                    alt="preview"
                    className="object-cover aspect-square"
                  />
                  <div className="p-2 text-xs text-neutral-400 truncate">
                    {file.name}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ===== 图片管理 ===== */}
        <section className="bg-white/5 backdrop-blur-3xl border border-white/15 rounded-3xl p-10 shadow-[0_20px_60px_rgba(0,0,0,0.6)]">

          {/* 标题 + 操作栏 */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
            <h2 className="text-xl font-semibold text-neutral-100">
              图片管理
            </h2>

            <div className="flex items-center gap-4">
              <button
                onClick={selectAll}
                className="text-sm text-neutral-300 hover:text-white"
              >
                全选
              </button>

              <button
                onClick={clearSelect}
                className="text-sm text-neutral-300 hover:text-white"
              >
                取消
              </button>

              <button
                onClick={handleBatchDelete}
                disabled={selected.length === 0 || deleting}
                className="
                  px-4 py-2 rounded-full
                  bg-red-500 text-white text-sm
                  hover:bg-red-600
                  disabled:opacity-40
                "
              >
                {deleting
                  ? "删除中..."
                  : `批量删除 (${selected.length})`}
              </button>
            </div>
          </div>

          {photos.length === 0 ? (
            <div className="text-neutral-400 text-sm">暂无图片</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {photos.map((p, i) => (
                <div
                  key={i}
                  className="group relative bg-white/5 rounded-xl overflow-hidden border border-white/10"
                >
                  {/* 勾选框 */}
                  <input
                    type="checkbox"
                    checked={selected.includes(p.thumb)}
                    onChange={() => toggleSelect(p.thumb)}
                    className="absolute top-2 left-2 z-10 w-4 h-4"
                  />

                  <img
                    src={p.thumb}
                    className="object-cover aspect-square"
                  />

                  {/* 单删 */}
                  <button
                    onClick={() => handleDeleteByUrl(p.thumb)}
                    className="
                      absolute inset-0
                      bg-black/60
                      opacity-0
                      group-hover:opacity-100
                      flex items-center justify-center
                      text-sm text-white
                      transition
                    "
                  >
                    删除
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

