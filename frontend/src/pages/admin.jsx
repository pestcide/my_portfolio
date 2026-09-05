import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { useConfirm } from "@/components/ui/confirm-dialog";
import BlogAdmin from "./BlogAdmin";
import AccountAdmin from "./AccountAdmin";
import {
  inputClass,
  primaryButtonClass,
  ghostButtonClass,
  dangerButtonClass,
} from "../lib/ui-classes";

const UNCATEGORIZED_ID = "__uncategorized__";

const TABS = [
  { id: "photos", label: "照片" },
  { id: "blogs", label: "博客" },
  { id: "account", label: "账号" },
];

export default function Admin() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const token = localStorage.getItem("token");

  const tab = searchParams.get("tab") || "photos";

  function setTab(id) {
    searchParams.set("tab", id);
    setSearchParams(searchParams, { replace: true });
  }

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
      }
    });
  }, []);

  // ===== 登录检测中 =====
  if (checking) {
    return (
      <div className="w-screen h-screen bg-paper flex items-center justify-center text-ink-faint text-sm">
        Checking login...
      </div>
    );
  }

  return (
    <div className="relative w-screen min-h-screen bg-paper">
      <div className="relative z-10 max-w-6xl mx-auto px-6 py-16 page-enter">
        <div className="flex items-center gap-5 mb-10">
          <button
            onClick={() => navigate("/")}
            className="
              h-9 px-4
              flex items-center
              rounded-full
              border border-line
              text-sm text-ink-soft
              transition-all duration-300
              hover:text-clay-dark hover:border-clay/50
            "
          >
            ← 返回首页
          </button>
          <h1 className="text-2xl font-semibold tracking-tight">
            后台管理
          </h1>
        </div>

        {/* ===== Tab 导航 ===== */}
        <div className="flex gap-8 border-b border-line mb-12">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`
                pb-3 -mb-px text-sm border-b transition
                ${
                  tab === t.id
                    ? "text-ink border-clay"
                    : "text-ink-faint border-transparent hover:text-ink"
                }
              `}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "photos" && <PhotosAdmin />}
        {tab === "blogs" && <BlogAdmin />}
        {tab === "account" && <AccountAdmin />}
      </div>
    </div>
  );
}

// ==================== 照片 Tab ====================

function PhotosAdmin() {
  const toast = useToast();
  const { confirm } = useConfirm();
  const token = localStorage.getItem("token");

  const [albumData, setAlbumData] = useState({
    albums: [],
    uncategorized: null,
    all_photos: [],
  });
  const [selected, setSelected] = useState([]);
  const [filterAlbum, setFilterAlbum] = useState("all");
  const [search, setSearch] = useState("");

  const [deleting, setDeleting] = useState(false);

  // 上传
  const [uploadAlbumId, setUploadAlbumId] = useState(UNCATEGORIZED_ID);
  const [uploadItems, setUploadItems] = useState([]);

  // 专辑管理
  const [newAlbumName, setNewAlbumName] = useState("");
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [coverPickerId, setCoverPickerId] = useState(null);

  const allAlbums = [
    ...albumData.albums,
    ...(albumData.uncategorized ? [albumData.uncategorized] : []),
  ];

  // 照片文件夹 -> 所属专辑 id（用于筛选/徽标）
  const albumIdOfFolder = {};
  albumData.albums.forEach((a) =>
    a.photos.forEach((p) => {
      albumIdOfFolder[p.folder] = a.id;
    })
  );

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const res = await fetch("/api/Albums");
    setAlbumData(await res.json());
  }

  // ===== 并发上传（同时 3 张，逐张状态） =====
  async function uploadOne(item, albumId) {
    try {
      setUploadItems((up) =>
        up.map((u) =>
          u.id === item.id ? { ...u, status: "uploading", error: null } : u
        )
      );

      const formData = new FormData();
      formData.append("file", item.file);
      formData.append("album_id", albumId);

      const res = await fetch("/api/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.detail || "上传失败");

      setUploadItems((up) =>
        up.map((u) => (u.id === item.id ? { ...u, status: "done" } : u))
      );
      return true;
    } catch (err) {
      setUploadItems((up) =>
        up.map((u) =>
          u.id === item.id ? { ...u, status: "error", error: err.message } : u
        )
      );
      return false;
    }
  }

  async function handleFiles(e) {
    const files = [...e.target.files];
    e.target.value = "";
    if (!files.length) return;

    const stamp = Date.now();
    const items = files.map((f, i) => ({
      id: `${stamp}-${i}`,
      file: f,
      name: f.name,
      status: "waiting",
      error: null,
    }));
    setUploadItems((prev) => [...items, ...prev]);

    const albumId = uploadAlbumId;
    let index = 0;
    let ok = 0;
    let fail = 0;
    const next = () => (index < items.length ? items[index++] : null);

    const workers = Array.from(
      { length: Math.min(3, items.length) },
      async () => {
        while (true) {
          const item = next();
          if (!item) break;
          const success = await uploadOne(item, albumId);
          success ? ok++ : fail++;
        }
      }
    );

    await Promise.all(workers);
    load();
    toast(
      fail
        ? `上传完成：${ok} 张成功，${fail} 张失败`
        : `成功上传 ${ok} 张`,
      fail ? "error" : "success"
    );
  }

  async function handleRetry(item) {
    const success = await uploadOne(item, uploadAlbumId);
    if (success) {
      load();
      toast("重试成功", "success");
    } else {
      toast("重试失败", "error");
    }
  }

  function clearFinished() {
    setUploadItems((prev) => prev.filter((u) => u.status !== "done"));
  }

  // ===== 勾选 =====
  function toggleSelect(folder) {
    setSelected((prev) =>
      prev.includes(folder)
        ? prev.filter((f) => f !== folder)
        : [...prev, folder]
    );
  }

  function selectVisible() {
    setSelected(filtered.map((p) => p.folder));
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
      const d = await res.json();
      if (!res.ok) throw new Error(d.detail || "移动失败");

      toast(`已移动 ${folders.length} 张到「${targetName}」`, "success");
      setSelected([]);
      load();
    } catch (err) {
      toast(err.message, "error");
    }
  }

  // ===== 删除照片 =====
  async function handleDelete(folder) {
    const ok = await confirm({
      title: "删除照片",
      description: `确定删除「${folder}」？缩略图与大图会一并删除，不可恢复。`,
      confirmText: "删除",
    });
    if (!ok) return;

    try {
      const res = await fetch(`/api/delete?folder=${folder}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.detail || "删除失败");

      toast("已删除", "success");
      setSelected((prev) => prev.filter((f) => f !== folder));
      load();
    } catch (err) {
      toast(err.message, "error");
    }
  }

  async function handleBatchDelete() {
    if (!selected.length) return;

    const ok = await confirm({
      title: "批量删除照片",
      description: `确定删除选中的 ${selected.length} 张照片？不可恢复。`,
      confirmText: `删除 ${selected.length} 张`,
    });
    if (!ok) return;

    setDeleting(true);
    try {
      let fail = 0;
      for (const folder of selected) {
        const res = await fetch(`/api/delete?folder=${folder}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) fail++;
      }

      if (fail) {
        toast(`删除完成，${selected.length - fail} 张成功，${fail} 张失败`, "error");
      } else {
        toast(`已删除 ${selected.length} 张`, "success");
      }
      setSelected([]);
      load();
    } finally {
      setDeleting(false);
    }
  }

  // ===== 专辑管理 =====
  async function handleCreateAlbum() {
    const name = newAlbumName.trim();
    if (!name) return;

    setCreating(true);
    try {
      const res = await fetch("/api/Albums", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.detail || "创建失败");

      toast(`专辑「${name}」已创建`, "success");
      setNewAlbumName("");
      load();
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setCreating(false);
    }
  }

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
      const d = await res.json();
      if (!res.ok) throw new Error(d.detail || "重命名失败");

      toast(`已重命名为「${name}」`, "success");
      load();
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setEditingId(null);
    }
  }

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
      const d = await res.json();
      if (!res.ok) throw new Error(d.detail || "设置封面失败");

      toast("封面已更新", "success");
      load();
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setCoverPickerId(null);
    }
  }

  async function handleDeleteAlbum(albumId, name) {
    const ok = await confirm({
      title: "删除专辑",
      description: `确定删除专辑「${name}」？专辑内的照片将回到未分类，不会被删除。`,
      confirmText: "删除专辑",
    });
    if (!ok) return;

    try {
      const res = await fetch(`/api/Albums/${albumId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.detail || "删除失败");

      toast(`专辑「${name}」已删除`, "success");
      if (filterAlbum === albumId) setFilterAlbum("all");
      load();
    } catch (err) {
      toast(err.message, "error");
    }
  }

  // ===== 筛选后的照片 =====
  const filtered = albumData.all_photos.filter((p) => {
    const matchAlbum =
      filterAlbum === "all" ||
      albumIdOfFolder[p.folder] === filterAlbum ||
      (filterAlbum === UNCATEGORIZED_ID && !albumIdOfFolder[p.folder]);
    const matchSearch =
      !search || p.folder.toLowerCase().includes(search.toLowerCase());
    return matchAlbum && matchSearch;
  });

  const coverPickerAlbum = allAlbums.find((a) => a.id === coverPickerId);

  return (
    <div className="flex flex-col gap-14">
      {/* ===== 上传 ===== */}
      <section>
        <h2 className="text-sm font-medium text-ink uppercase tracking-widest mb-6">
          上传照片
        </h2>

        <div className="flex flex-col md:flex-row gap-4 items-start">
          <label
            className="px-4 py-2.5 rounded-xl border border-line text-sm text-ink hover:border-clay/50 hover:text-clay-dark transition cursor-pointer"
          >
            选择图片
            <input
              id="fileInput"
              type="file"
              multiple
              accept="image/*"
              onChange={handleFiles}
              className="hidden"
            />
          </label>

          <select
            value={uploadAlbumId}
            onChange={(e) => setUploadAlbumId(e.target.value)}
            className={`${inputClass} md:w-52`}
          >
            {allAlbums.map((a) => (
              <option key={a.id} value={a.id} className="bg-paper-raised">
                上传到：{a.name}
              </option>
            ))}
          </select>
        </div>

        {/* 逐张上传状态 */}
        {uploadItems.length > 0 && (
          <div className="mt-6 border border-line rounded-2xl divide-y divide-line">
            {uploadItems.map((u) => (
              <div
                key={u.id}
                className="flex items-center gap-4 px-4 py-2.5 text-sm"
              >
                <span className="flex-1 min-w-0 truncate text-ink">
                  {u.name}
                </span>

                {u.status === "waiting" && (
                  <span className="text-xs text-ink-faint">排队中</span>
                )}
                {u.status === "uploading" && (
                  <span className="text-xs text-ink-soft">上传中...</span>
                )}
                {u.status === "done" && (
                  <span className="text-xs text-ink-faint">完成</span>
                )}
                {u.status === "error" && (
                  <>
                    <span className="text-xs text-red-600 truncate max-w-[50%]">
                      {u.error}
                    </span>
                    <button
                      onClick={() => handleRetry(u)}
                      className={ghostButtonClass}
                    >
                      重试
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {uploadItems.some((u) => u.status === "done") && (
          <button
            onClick={clearFinished}
            className="mt-3 text-xs text-ink-faint hover:text-clay-dark transition"
          >
            清除已完成
          </button>
        )}
      </section>

      {/* ===== 图库管理 ===== */}
      <section>
        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
          <h2 className="text-sm font-medium text-ink uppercase tracking-widest">
            图库管理
          </h2>
          <div className="flex-1" />
          <select
            value={filterAlbum}
            onChange={(e) => setFilterAlbum(e.target.value)}
            className={`${inputClass} md:w-44 py-2`}
          >
            <option value="all" className="bg-paper-raised">
              全部专辑
            </option>
            {albumData.albums.map((a) => (
              <option key={a.id} value={a.id} className="bg-paper-raised">
                {a.name}
              </option>
            ))}
            <option value={UNCATEGORIZED_ID} className="bg-paper-raised">
              未分类
            </option>
          </select>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索文件名"
            className={`${inputClass} md:w-48 py-2`}
          />
        </div>

        {/* 吸顶批量操作栏 */}
        {selected.length > 0 && (
          <div
            className="
              sticky top-0 z-20 -mx-6 px-6 py-3 mb-4
              bg-paper/95 border-b border-line
              flex flex-wrap items-center gap-3
            "
          >
            <span className="text-sm text-ink">
              已选 {selected.length} 项
            </span>

            <select
              value=""
              onChange={(e) => {
                handleMove(selected, e.target.value);
                e.target.value = "";
              }}
              className="px-3 py-1.5 rounded-full bg-paper-raised border border-line text-xs text-ink outline-none"
            >
              <option value="" disabled className="bg-paper-raised">
                移动到...
              </option>
              {allAlbums.map((a) => (
                <option key={a.id} value={a.id} className="bg-paper-raised">
                  {a.name}
                </option>
              ))}
            </select>

            <button
              onClick={handleBatchDelete}
              disabled={deleting}
              className={dangerButtonClass}
            >
              {deleting ? "删除中..." : `批量删除 (${selected.length})`}
            </button>

            <button onClick={clearSelect} className={ghostButtonClass}>
              取消选择
            </button>

            <button
              onClick={selectVisible}
              className="text-xs text-ink-faint hover:text-clay-dark transition"
            >
              全选当前筛选（{filtered.length}）
            </button>
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="py-16 text-sm text-ink-faint text-center border border-dashed border-line rounded-2xl">
            {albumData.all_photos.length === 0 ? "暂无照片" : "没有匹配的照片"}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {filtered.map((p) => (
              <div
                key={p.folder}
                className="group relative rounded-xl overflow-hidden border border-line bg-paper-raised"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(p.folder)}
                  onChange={() => toggleSelect(p.folder)}
                  className="absolute top-2 left-2 z-10 w-4 h-4 accent-white cursor-pointer"
                />

                <img
                  src={p.thumb}
                  alt={p.folder}
                  loading="lazy"
                  className="object-cover aspect-square w-full"
                />

                <div className="absolute top-2 right-2 z-10 px-2 py-0.5 rounded-full bg-ink/80 border border-line text-[10px] text-ink max-w-[70%] truncate">
                  {albumIdOfFolder[p.folder]
                    ? allAlbums.find(
                        (a) => a.id === albumIdOfFolder[p.folder]
                      )?.name
                    : "未分类"}
                </div>

                {/* 悬浮操作 */}
                <div
                  className="
                    absolute inset-0 bg-ink/60
                    opacity-0 group-hover:opacity-100
                    flex flex-col items-center justify-center gap-2 p-2
                    transition
                  "
                >
                  <button
                    onClick={() => handleDelete(p.folder)}
                    className={dangerButtonClass}
                  >
                    删除
                  </button>

                  <select
                    value=""
                    onChange={(e) => {
                      if (e.target.value)
                        handleMove([p.folder], e.target.value);
                      e.target.value = "";
                    }}
                    className="px-2 py-1 rounded-full bg-paper-raised border border-line text-ink text-xs outline-none"
                  >
                    <option value="" disabled className="bg-paper-raised">
                      移动到...
                    </option>
                    {allAlbums
                      .filter(
                        (a) =>
                          (!albumIdOfFolder[p.folder] &&
                            a.id !== UNCATEGORIZED_ID) ||
                          albumIdOfFolder[p.folder] !== a.id
                      )
                      .map((a) => (
                        <option
                          key={a.id}
                          value={a.id}
                          className="bg-paper-raised"
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

      {/* ===== 专辑管理 ===== */}
      <section>
        <h2 className="text-sm font-medium text-ink uppercase tracking-widest mb-6">
          专辑管理
        </h2>

        <div className="flex flex-col md:flex-row gap-4 items-center mb-8">
          <input
            value={newAlbumName}
            onChange={(e) => setNewAlbumName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreateAlbum()}
            placeholder="新专辑名称"
            className={`${inputClass} flex-1 w-full`}
          />
          <button
            onClick={handleCreateAlbum}
            disabled={creating || !newAlbumName.trim()}
            className={`${primaryButtonClass} shrink-0`}
          >
            {creating ? "创建中..." : "创建专辑"}
          </button>
        </div>

        {allAlbums.length === 0 ? (
          <div className="py-12 text-sm text-ink-faint text-center border border-dashed border-line rounded-2xl">
            暂无专辑
          </div>
        ) : (
          <div className="divide-y divide-line border-y border-line/70">
            {allAlbums.map((a) => {
              const isUncategorized = a.id === UNCATEGORIZED_ID;
              return (
                <div
                  key={a.id}
                  className="flex items-center gap-4 py-3"
                >
                  {a.cover ? (
                    <img
                      src={a.cover.thumb}
                      alt={a.name}
                      className="w-12 h-12 rounded-lg object-cover border border-line shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg border border-dashed border-line flex items-center justify-center shrink-0 text-ink-faint text-xs">
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
                        className="w-full max-w-xs px-3 py-1.5 rounded-lg bg-paper-raised border border-line text-sm text-ink outline-none"
                      />
                    ) : (
                      <div className="text-sm text-ink truncate">
                        {a.name}
                      </div>
                    )}
                    <div className="text-xs text-ink-faint mt-0.5">
                      {a.photos.length} 张
                      {isUncategorized && " · 默认分组，不可删除"}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {editingId === a.id ? (
                      <>
                        <button
                          onClick={() => handleRename(a.id)}
                          className={primaryButtonClass + " px-4 py-1.5 text-xs"}
                        >
                          保存
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className={ghostButtonClass}
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
                          className={ghostButtonClass}
                        >
                          重命名
                        </button>
                        <button
                          disabled={isUncategorized || a.photos.length === 0}
                          onClick={() => setCoverPickerId(a.id)}
                          className={ghostButtonClass}
                        >
                          设封面
                        </button>
                        <button
                          disabled={isUncategorized}
                          onClick={() => handleDeleteAlbum(a.id, a.name)}
                          className={dangerButtonClass}
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
        )}
      </section>

      {/* ===== 封面选择弹窗 ===== */}
      <Dialog open={!!coverPickerId} onOpenChange={() => setCoverPickerId(null)}>
        <DialogContent className="z-50 bg-paper-raised border border-line rounded-2xl max-w-3xl max-h-[80vh] overflow-y-auto">
          <h3 className="text-base font-semibold text-ink mb-5">
            选择「{coverPickerAlbum?.name}」封面
          </h3>

          <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
            <button
              onClick={() => handleSetCover(coverPickerId, null)}
              className={`
                aspect-square rounded-xl border flex items-center justify-center
                text-xs text-ink-faint transition
                ${
                  !coverPickerAlbum?.cover
                    ? "border-clay text-ink"
                    : "border-line hover:border-clay/50"
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
                      ? "border-clay ring-1 ring-clay"
                      : "border-line hover:border-clay/50"
                  }`}
                >
                  <img
                    src={p.thumb}
                    alt={p.folder}
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
