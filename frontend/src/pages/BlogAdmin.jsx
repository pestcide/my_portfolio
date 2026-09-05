import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function BlogAdmin() {
  const [data, setData] = useState({ columns: [], posts: [] });
  const [msg, setMsg] = useState("");

  const [newTitle, setNewTitle] = useState("");
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [newColumnName, setNewColumnName] = useState("");
  const [creatingColumn, setCreatingColumn] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");

  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const authHeaders = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const res = await fetch("/api/Columns");
    setData(await res.json());
  }

  // ===== 新建文章 =====
  async function handleCreate() {
    const title = newTitle.trim();
    if (!title) return;

    setCreating(true);
    setMsg("");
    try {
      const res = await fetch("/api/Blogs", {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ title }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.detail || "创建失败");

      setNewTitle("");
      // 直接进入编辑器
      navigate(`/editor?folder=${encodeURIComponent(d.folder)}`);
    } catch (err) {
      setMsg(err.message);
    } finally {
      setCreating(false);
    }
  }

  // ===== 删除文章 =====
  async function handleDeletePost(folder) {
    if (!confirm(`确定删除文章「${folder}」？文章内的配图会一并删除。`)) return;

    setDeleting(true);
    setMsg("");
    try {
      const res = await fetch(`/api/Blogs/${encodeURIComponent(folder)}`, {
        method: "DELETE",
        headers: authHeaders,
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.detail || "删除失败");
      setMsg("删除成功 🗑️");
      load();
    } catch (err) {
      setMsg(err.message);
    } finally {
      setDeleting(false);
    }
  }

  // ===== 归入专栏 =====
  async function handleAssign(folder, columnId) {
    if (!columnId) return;
    try {
      const res = await fetch(`/api/Columns/${columnId}/posts`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ folders: [folder] }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.detail || "归入失败");
      setMsg("已归入专栏 ✅");
      load();
    } catch (err) {
      setMsg(err.message);
    }
  }

  // ===== 移出专栏 =====
  async function handleRemoveFromColumn(folder, columnId) {
    try {
      const res = await fetch(`/api/Columns/${columnId}/posts`, {
        method: "DELETE",
        headers: authHeaders,
        body: JSON.stringify({ folders: [folder] }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.detail || "移出失败");
      setMsg("已移出专栏 ✅");
      load();
    } catch (err) {
      setMsg(err.message);
    }
  }

  // ===== 新建专栏 =====
  async function handleCreateColumn() {
    const name = newColumnName.trim();
    if (!name) return;

    setCreatingColumn(true);
    setMsg("");
    try {
      const res = await fetch("/api/Columns", {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ name }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.detail || "创建失败");
      setMsg(`专栏「${name}」创建成功 ✅`);
      setNewColumnName("");
      load();
    } catch (err) {
      setMsg(err.message);
    } finally {
      setCreatingColumn(false);
    }
  }

  // ===== 重命名专栏 =====
  async function handleRenameColumn(columnId) {
    const name = editName.trim();
    if (!name) {
      setEditingId(null);
      return;
    }
    try {
      const res = await fetch(`/api/Columns/${columnId}`, {
        method: "PATCH",
        headers: authHeaders,
        body: JSON.stringify({ name }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.detail || "重命名失败");
      setMsg(`已重命名为「${name}」✅`);
      load();
    } catch (err) {
      setMsg(err.message);
    } finally {
      setEditingId(null);
    }
  }

  // ===== 删除专栏 =====
  async function handleDeleteColumn(columnId, name) {
    if (!confirm(`确定删除专栏「${name}」？文章不会被删除。`)) return;
    try {
      const res = await fetch(`/api/Columns/${columnId}`, {
        method: "DELETE",
        headers: authHeaders,
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.detail || "删除失败");
      setMsg(`专栏「${name}」已删除 🗑️`);
      load();
    } catch (err) {
      setMsg(err.message);
    }
  }

  const sectionClass =
    "bg-white/5 backdrop-blur-3xl border border-white/15 rounded-3xl p-10 shadow-[0_20px_60px_rgba(0,0,0,0.6)]";

  return (
    <>
      {/* ===== 新建文章 ===== */}
      <section className={sectionClass}>
        <h2 className="text-xl font-semibold text-neutral-100 mb-6">
          新建文章
        </h2>

        <div className="flex flex-col md:flex-row gap-4 items-center">
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            placeholder="文章标题（将作为文件夹名）"
            className="flex-1 w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-neutral-200 placeholder:text-neutral-500 outline-none focus:border-purple-400/40"
          />
          <button
            onClick={handleCreate}
            disabled={creating || !newTitle.trim()}
            className="px-6 py-2.5 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 text-white text-sm font-semibold hover:opacity-90 transition disabled:opacity-40 shrink-0"
          >
            {creating ? "创建中..." : "创建并编辑"}
          </button>
        </div>

        {msg && <div className="mt-4 text-sm text-neutral-300">{msg}</div>}
      </section>

      {/* ===== 文章管理 ===== */}
      <section className={sectionClass}>
        <h2 className="text-xl font-semibold text-neutral-100 mb-6">
          文章管理
        </h2>

        {data.posts.length === 0 ? (
          <div className="text-neutral-400 text-sm">暂无文章</div>
        ) : (
          <div className="flex flex-col gap-3">
            {data.posts.map((p) => (
              <div
                key={p.folder}
                className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="text-sm text-neutral-100 truncate">
                      {p.title}
                    </div>
                    {p.column && (
                      <span className="shrink-0 px-2 py-0.5 rounded-full bg-purple-500/15 border border-purple-400/30 text-[10px] text-purple-300">
                        {p.column}
                      </span>
                    )}
                  </div>
                  {p.description && (
                    <div className="text-xs text-neutral-500 truncate mt-0.5">
                      {p.description}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* 归入专栏 */}
                  <select
                    value=""
                    onChange={(e) => {
                      if (e.target.value === "__none__" && p.column_id) {
                        handleRemoveFromColumn(p.folder, p.column_id);
                      } else if (e.target.value) {
                        handleAssign(p.folder, e.target.value);
                      }
                      e.target.value = "";
                    }}
                    className="px-2.5 py-1.5 rounded-full bg-white/10 border border-white/10 text-xs text-neutral-300 outline-none max-w-[130px]"
                  >
                    <option value="" disabled className="bg-neutral-900">
                      {p.column ? p.column : "归入专栏"}
                    </option>
                    {p.column_id && (
                      <option value="__none__" className="bg-neutral-900">
                        移出专栏
                      </option>
                    )}
                    {data.columns
                      .filter((c) => c.id !== p.column_id)
                      .map((c) => (
                        <option
                          key={c.id}
                          value={c.id}
                          className="bg-neutral-900"
                        >
                          {c.name}
                        </option>
                      ))}
                  </select>

                  <button
                    onClick={() =>
                      navigate(
                        `/editor?folder=${encodeURIComponent(p.folder)}`
                      )
                    }
                    className="px-3 py-1.5 rounded-full bg-white/10 text-neutral-300 text-xs hover:bg-white/20"
                  >
                    编辑
                  </button>

                  <button
                    disabled={deleting}
                    onClick={() => handleDeletePost(p.folder)}
                    className="px-3 py-1.5 rounded-full bg-red-500/90 text-white text-xs hover:bg-red-500 disabled:opacity-40"
                  >
                    删除
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ===== 专栏管理 ===== */}
      <section className={sectionClass}>
        <h2 className="text-xl font-semibold text-neutral-100 mb-6">
          专栏管理
        </h2>

        <div className="flex flex-col md:flex-row gap-4 items-center mb-8">
          <input
            value={newColumnName}
            onChange={(e) => setNewColumnName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreateColumn()}
            placeholder="新专栏名称"
            className="flex-1 w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-neutral-200 placeholder:text-neutral-500 outline-none focus:border-purple-400/40"
          />
          <button
            onClick={handleCreateColumn}
            disabled={creatingColumn || !newColumnName.trim()}
            className="px-6 py-2.5 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 text-white text-sm font-semibold hover:opacity-90 transition disabled:opacity-40 shrink-0"
          >
            {creatingColumn ? "创建中..." : "创建专栏"}
          </button>
        </div>

        {data.columns.length === 0 ? (
          <div className="text-neutral-400 text-sm">暂无专栏</div>
        ) : (
          <div className="flex flex-col gap-3">
            {data.columns.map((c) => (
              <div
                key={c.id}
                className="flex items-center gap-4 p-3 rounded-2xl bg-white/5 border border-white/10"
              >
                <div className="flex-1 min-w-0">
                  {editingId === c.id ? (
                    <input
                      autoFocus
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleRenameColumn(c.id);
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      className="w-full max-w-xs px-3 py-1.5 rounded-lg bg-white/10 border border-white/15 text-sm text-neutral-100 outline-none"
                    />
                  ) : (
                    <div className="text-sm text-neutral-100 truncate">
                      {c.name}
                    </div>
                  )}
                  <div className="text-xs text-neutral-500 mt-0.5">
                    {c.posts.length} 篇
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {editingId === c.id ? (
                    <>
                      <button
                        onClick={() => handleRenameColumn(c.id)}
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
                        onClick={() => {
                          setEditingId(c.id);
                          setEditName(c.name);
                        }}
                        className="px-3 py-1.5 rounded-full bg-white/10 text-neutral-300 text-xs hover:bg-white/20"
                      >
                        重命名
                      </button>
                      <button
                        onClick={() => handleDeleteColumn(c.id, c.name)}
                        className="px-3 py-1.5 rounded-full bg-red-500/90 text-white text-xs hover:bg-red-500"
                      >
                        删除
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
