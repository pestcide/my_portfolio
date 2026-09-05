
import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import BlogAdmin from "./BlogAdmin";
import AccountAdmin from "./AccountAdmin";

const UNCATEGORIZED_ID = "__uncategorized__";

export default function Admin() {
  const [files, setFiles] = useState([]);
  const [albumData, setAlbumData] = useState({
    albums: [],
    uncategorized: null,
    all_photos: [],
  });
  const [selected, setSelected] = useState([]);

  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [msg, setMsg] = useState("");
  const [checking, setChecking] = useState(true);

  const [uploadAlbumId, setUploadAlbumId] = useState(UNCATEGORIZED_ID);

  const [newAlbumName, setNewAlbumName] = useState("");
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [coverPickerId, setCoverPickerId] = useState(null);

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

  // ===== 加载专辑数据 =====
  async function loadPhotos() {
    const res = await fetch("/api/Albums");
    const data = await res.json();
    setAlbumData(data);
  }

  const allAlbums = [
    ...albumData.albums,
    ...(albumData.uncategorized ? [albumData.uncategorized] : []),
  ];

  // 照片文件夹 -> 所属专辑名（用于徽标）
  const albumOfFolder = {};
  albumData.albums.forEach((a) =>
    a.photos.forEach((p) => {
      albumOfFolder[p.folder] = a.name;
    })
  );
  albumData.all_photos.forEach((p) => {
    if (!albumOfFolder[p.folder]) albumOfFolder[p.folder] = "未分类";
  });

  // ===== 选择文件 =====
  function handleSelect(e) {
    setFiles([...e.target.files]);
  }

  // ===== 上传（支持目标专辑） =====
  async function handleUpload() {
    if (!files.length) return;

    setUploading(true);
    setMsg("");

    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("album_id", uploadAlbumId);

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

  // ===== 勾选（按照片文件夹名） =====
  function toggleSelect(folder) {
    setSelected((prev) =>
      prev.includes(folder)
        ? prev.filter((f) => f !== folder)
        : [...prev, folder]
    );
  }

  function selectAll() {
    setSelected(albumData.all_photos.map((p) => p.folder));
  }

  function clearSelect() {
    setSelected([]);
  }

  // ===== 移动照片 =====
  async function handleMove(folders, targetId) {
    if (!folders.length || !targetId) return;

    const targetName =
      allAlbums.find((a) => a.id === targetId)?.name || "未知专辑";

    try {
      const res = await fetch(`/api/Albums/${targetId}/photos`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ folders }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "移动失败");
      }

      setMsg(`已移动 ${folders.length} 张到「${targetName}」✅`);
      setSelected([]);
      loadPhotos();
    } catch (err) {
      setMsg(err.message);
    }
  }

  // ===== 专辑：新建 =====
  async function handleCreateAlbum() {
    const name = newAlbumName.trim();
    if (!name) return;

    setCreating(true);
    setMsg("");

    try {
      const res = await fetch("/api/Albums", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "创建失败");
      }

      setMsg(`专辑「${name}」创建成功 ✅`);
      setNewAlbumName("");
      loadPhotos();
    } catch (err) {
      setMsg(err.message);
    } finally {
      setCreating(false);
    }
  }

  // ===== 专辑：重命名 =====
  async function handleRename(albumId) {
    const name = editName.trim();
    if (!name) {
      setEditingId(null);
      return;
    }

    try {
      const res = await fetch(`/api/Albums/${albumId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "重命名失败");
      }

      setMsg(`已重命名为「${name}」✅`);
      loadPhotos();
    } catch (err) {
      setMsg(err.message);
    } finally {
      setEditingId(null);
    }
  }

  // ===== 专辑：设置封面 =====
  async function handleSetCover(albumId, folder) {
    try {
      const res = await fetch(`/api/Albums/${albumId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ cover: folder }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "设置封面失败");
      }

      setMsg("封面已更新 ✅");
      loadPhotos();
    } catch (err) {
      setMsg(err.message);
    } finally {
      setCoverPickerId(null);
    }
  }

  // ===== 专辑：删除 =====
  async function handleDeleteAlbum(albumId, name) {
    if (!confirm(`确定删除专辑「${name}」？其中的照片将回到未分类。`)) return;

    try {
      const res = await fetch(`/api/Albums/${albumId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "删除失败");
      }

      setMsg(`专辑「${name}」已删除 🗑️`);
      loadPhotos();
    } catch (err) {
      setMsg(err.message);
    }
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
      for (const folder of selected) {
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

  const coverPickerAlbum = allAlbums.find((a) => a.id === coverPickerId);

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

            <select
              value={uploadAlbumId}
              onChange={(e) => setUploadAlbumId(e.target.value)}
              className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-neutral-200 outline-none"
            >
              {allAlbums.map((a) => (
                <option key={a.id} value={a.id} className="bg-neutral-900">
                  上传到：{a.name}
                </option>
              ))}
            </select>

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

        {/* ===== 专辑管理 ===== */}
        <section className="bg-white/5 backdrop-blur-3xl border border-white/15 rounded-3xl p-10 shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
          <h2 className="text-xl font-semibold text-neutral-100 mb-6">
            专辑管理
          </h2>

          {/* 新建专辑 */}
          <div className="flex flex-col md:flex-row gap-4 items-center mb-8">
            <input
              value={newAlbumName}
              onChange={(e) => setNewAlbumName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreateAlbum()}
              placeholder="新专辑名称"
              className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-neutral-200 placeholder:text-neutral-500 outline-none focus:border-purple-400/40"
            />
            <button
              onClick={handleCreateAlbum}
              disabled={creating || !newAlbumName.trim()}
              className="px-6 py-2.5 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 text-white text-sm font-semibold hover:opacity-90 transition disabled:opacity-40"
            >
              {creating ? "创建中..." : "创建专辑"}
            </button>
          </div>

          {/* 专辑列表 */}
          <div className="flex flex-col gap-3">
            {allAlbums.map((a) => {
              const isUncategorized = a.id === UNCATEGORIZED_ID;
              return (
                <div
                  key={a.id}
                  className="flex items-center gap-4 p-3 rounded-2xl bg-white/5 border border-white/10"
                >
                  {a.cover ? (
                    <img
                      src={a.cover.thumb}
                      alt={a.name}
                      className="w-14 h-14 rounded-xl object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-white/10 flex items-center justify-center shrink-0 text-neutral-500 text-xs">
                      空
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    {editingId === a.id ? (
                      <input
                        autoFocus
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleRename(a.id);
                          if (e.key === "Escape") setEditingId(null);
                        }}
                        className="w-full max-w-xs px-3 py-1.5 rounded-lg bg-white/10 border border-white/15 text-sm text-neutral-100 outline-none"
                      />
                    ) : (
                      <div className="text-sm text-neutral-100 truncate">
                        {a.name}
                      </div>
                    )}
                    <div className="text-xs text-neutral-500 mt-0.5">
                      {a.photos.length} 张
                      {isUncategorized && " · 不可删除"}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {editingId === a.id ? (
                      <>
                        <button
                          onClick={() => handleRename(a.id)}
                          className="px-3 py-1.5 rounded-full bg-emerald-500/90 text-white text-xs hover:bg-emerald-500"
                        >
                          保存
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-3 py-1.5 rounded-full bg-white/10 text-neutral-300 text-xs hover:bg-white/20"
                        >
                          取消
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          disabled={isUncategorized}
                          onClick={() => {
                            setEditingId(a.id);
                            setEditName(a.name);
                          }}
                          className="px-3 py-1.5 rounded-full bg-white/10 text-neutral-300 text-xs hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          重命名
                        </button>
                        <button
                          disabled={isUncategorized || a.photos.length === 0}
                          onClick={() => setCoverPickerId(a.id)}
                          className="px-3 py-1.5 rounded-full bg-white/10 text-neutral-300 text-xs hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          设封面
                        </button>
                        <button
                          disabled={isUncategorized}
                          onClick={() => handleDeleteAlbum(a.id, a.name)}
                          className="px-3 py-1.5 rounded-full bg-red-500/90 text-white text-xs hover:bg-red-500 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          删除
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ===== 博客管理（专栏 + 文章） ===== */}
        <BlogAdmin />

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

              {/* 批量移动 */}
              <select
                value=""
                disabled={selected.length === 0}
                onChange={(e) => {
                  handleMove(selected, e.target.value);
                  e.target.value = "";
                }}
                className="px-3 py-2 rounded-full bg-white/10 border border-white/10 text-sm text-neutral-200 outline-none disabled:opacity-40"
              >
                <option value="" disabled className="bg-neutral-900">
                  移动到... ({selected.length})
                </option>
                {allAlbums.map((a) => (
                  <option key={a.id} value={a.id} className="bg-neutral-900">
                    {a.name}
                  </option>
                ))}
              </select>

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

          {albumData.all_photos.length === 0 ? (
            <div className="text-neutral-400 text-sm">暂无图片</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {albumData.all_photos.map((p) => (
                <div
                  key={p.folder}
                  className="group relative bg-white/5 rounded-xl overflow-hidden border border-white/10"
                >
                  {/* 勾选框 */}
                  <input
                    type="checkbox"
                    checked={selected.includes(p.folder)}
                    onChange={() => toggleSelect(p.folder)}
                    className="absolute top-2 left-2 z-10 w-4 h-4"
                  />

                  <img
                    src={p.thumb}
                    className="object-cover aspect-square"
                  />

                  {/* 专辑徽标 */}
                  <div className="absolute top-2 right-2 z-10 px-2 py-0.5 rounded-full bg-black/60 text-[10px] text-neutral-200 max-w-[70%] truncate">
                    {albumOfFolder[p.folder]}
                  </div>

                  {/* 悬浮操作 */}
                  <div
                    className="
                      absolute inset-0
                      bg-black/60
                      opacity-0
                      group-hover:opacity-100
                      flex flex-col items-center justify-center gap-2
                      p-2
                      transition
                    "
                  >
                    <button
                      onClick={() => handleDeleteByUrl(p.thumb)}
                      className="px-4 py-1.5 rounded-full bg-red-500 text-white text-xs hover:bg-red-600"
                    >
                      删除
                    </button>

                    <select
                      value=""
                      onChange={(e) => {
                        if (e.target.value) handleMove([p.folder], e.target.value);
                        e.target.value = "";
                      }}
                      className="px-2 py-1 rounded-full bg-white/90 text-neutral-900 text-xs outline-none"
                    >
                      <option value="" disabled className="bg-neutral-900">
                        移动到...
                      </option>
                      {allAlbums
                        .filter((a) => albumOfFolder[p.folder] !== a.name)
                        .map((a) => (
                          <option
                            key={a.id}
                            value={a.id}
                            className="bg-neutral-900"
                          >
                            {a.name}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ===== 账号设置（改密码 + 头像） ===== */}
        <AccountAdmin />
      </div>

      {/* ===== 封面选择弹窗 ===== */}
      <Dialog open={!!coverPickerId} onOpenChange={() => setCoverPickerId(null)}>
        <DialogContent className="z-50 bg-neutral-900 border border-white/15 rounded-3xl max-w-3xl max-h-[80vh] overflow-y-auto">
          <h3 className="text-lg font-semibold text-neutral-100 mb-4">
            选择「{coverPickerAlbum?.name}」封面
          </h3>

          <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
            <button
              onClick={() => handleSetCover(coverPickerId, null)}
              className={`
                aspect-square rounded-xl border flex items-center justify-center
                text-xs text-neutral-400 transition
                ${
                  !coverPickerAlbum?.cover
                    ? "border-purple-400/60 bg-purple-500/10"
                    : "border-white/10 bg-white/5 hover:bg-white/10"
                }
              `}
            >
              自动（首图）
            </button>

            {coverPickerAlbum?.photos.map((p) => {
              const isCover = coverPickerAlbum.cover?.folder === p.folder;
              return (
                <button
                  key={p.folder}
                  onClick={() => handleSetCover(coverPickerId, p.folder)}
                  className={`relative rounded-xl overflow-hidden border transition ${
                    isCover
                      ? "border-purple-400/60 ring-2 ring-purple-400/40"
                      : "border-white/10 hover:opacity-80"
                  }`}
                >
                  <img
                    src={p.thumb}
                    className="w-full aspect-square object-cover"
                  />
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
