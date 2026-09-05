import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/toast";
import { useConfirm } from "@/components/ui/confirm-dialog";
import {
  inputClass,
  primaryButtonClass,
  ghostButtonClass,
  dangerButtonClass,
} from "../lib/ui-classes";

const ALL_ID = "__all__";

export default function BlogAdmin() {
  const [data, setData] = useState({ columns: [], posts: [] });
  const [filterColumn, setFilterColumn] = useState(ALL_ID);
  const [search, setSearch] = useState("");

  const [newTitle, setNewTitle] = useState("");
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [newColumnName, setNewColumnName] = useState("");
  const [creatingColumn, setCreatingColumn] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");

  const navigate = useNavigate();
  const toast = useToast();
  const { confirm } = useConfirm();
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
    try {
      const res = await fetch("/api/Blogs", {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ title }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.detail || "创建失败");

      toast(`文章「${title}」已创建`, "success");
      setNewTitle("");
      navigate(`/editor?folder=${encodeURIComponent(d.folder)}`);
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setCreating(false);
    }
  }

  // ===== 删除文章 =====
  async function handleDeletePost(folder) {
    const ok = await confirm({
      title: "删除文章",
      description: `确定删除「${folder}」？文章内容与配图会一并删除，不可恢复。`,
      confirmText: "删除",
    });
    if (!ok) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/Blogs/${encodeURIComponent(folder)}`, {
        method: "DELETE",
        headers: authHeaders,
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.detail || "删除失败");

      toast("文章已删除", "success");
      load();
    } catch (err) {
      toast(err.message, "error");
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

      toast("已归入专栏", "success");
      load();
    } catch (err) {
      toast(err.message, "error");
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

      toast("已移出专栏", "success");
      load();
    } catch (err) {
      toast(err.message, "error");
    }
  }

  // ===== 新建专栏 =====
  async function handleCreateColumn() {
    const name = newColumnName.trim();
    if (!name) return;

    setCreatingColumn(true);
    try {
      const res = await fetch("/api/Columns", {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ name }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.detail || "创建失败");

      toast(`专栏「${name}」已创建`, "success");
      setNewColumnName("");
      load();
    } catch (err) {
      toast(err.message, "error");
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

      toast(`已重命名为「${name}」`, "success");
      load();
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setEditingId(null);
    }
  }

  // ===== 删除专栏 =====
  async function handleDeleteColumn(columnId, name) {
    const ok = await confirm({
      title: "删除专栏",
      description: `确定删除专栏「${name}」？文章不会被删除，仅脱离该专栏。`,
      confirmText: "删除专栏",
    });
    if (!ok) return;

    try {
      const res = await fetch(`/api/Columns/${columnId}`, {
        method: "DELETE",
        headers: authHeaders,
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.detail || "删除失败");

      toast(`专栏「${name}」已删除`, "success");
      if (filterColumn === columnId) setFilterColumn(ALL_ID);
      load();
    } catch (err) {
      toast(err.message, "error");
    }
  }

  // ===== 筛选后的文章 =====
  const filtered = data.posts.filter((p) => {
    const matchColumn =
      filterColumn === ALL_ID || p.column_id === filterColumn;
    const matchSearch =
      !search || p.title.toLowerCase().includes(search.toLowerCase());
    return matchColumn && matchSearch;
  });

  return (
    <div className="flex flex-col gap-14">
      {/* ===== 新建文章 ===== */}
      <section>
        <h2 className="text-sm font-medium text-ink uppercase tracking-widest mb-6">
          新建文章
        </h2>

        <div className="flex flex-col md:flex-row gap-4 items-start">
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            placeholder="文章标题（将作为文件夹名）"
            className={`${inputClass} flex-1 w-full`}
          />
          <button
            onClick={handleCreate}
            disabled={creating || !newTitle.trim()}
            className={`${primaryButtonClass} shrink-0`}
          >
            {creating ? "创建中..." : "创建并编辑"}
          </button>
        </div>
      </section>

      {/* ===== 文章管理 ===== */}
      <section>
        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
          <h2 className="text-sm font-medium text-ink uppercase tracking-widest">
            文章管理
          </h2>
          <div className="flex-1" />
          <select
            value={filterColumn}
            onChange={(e) => setFilterColumn(e.target.value)}
            className={`${inputClass} md:w-44 py-2`}
          >
            <option value={ALL_ID} className="bg-paper-raised">
              全部专栏
            </option>
            {data.columns.map((c) => (
              <option key={c.id} value={c.id} className="bg-paper-raised">
                {c.name}
              </option>
            ))}
            <option value="__none__" className="bg-paper-raised">
              未归入专栏
            </option>
          </select>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索标题"
            className={`${inputClass} md:w-48 py-2`}
          />
        </div>

        {filtered.length === 0 ? (
          <div className="py-16 text-sm text-ink-faint text-center border border-dashed border-line rounded-2xl">
            {data.posts.length === 0 ? "暂无文章" : "没有匹配的文章"}
          </div>
        ) : (
          <div className="divide-y divide-line border-y border-line/70">
            {filtered.map((p) => (
              <div key={p.folder} className="flex items-center gap-4 py-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5">
                    <div className="text-sm text-ink truncate">
                      {p.title}
                    </div>
                    {p.column && (
                      <span className="shrink-0 px-2 py-0.5 rounded-full border border-line text-[10px] text-ink-soft">
                        {p.column}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-ink-faint mt-0.5 flex gap-3">
                    <span className="tabular-nums">{p.date}</span>
                    {p.description && (
                      <span className="truncate">{p.description}</span>
                    )}
                  </div>
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
                    className="px-2.5 py-1.5 rounded-full bg-paper-raised border border-line text-xs text-ink-soft outline-none max-w-[120px]"
                  >
                    <option value="" disabled className="bg-paper-raised">
                      {p.column ? p.column : "归入专栏"}
                    </option>
                    {p.column_id && (
                      <option value="__none__" className="bg-paper-raised">
                        移出专栏
                      </option>
                    )}
                    {data.columns
                      .filter((c) => c.id !== p.column_id)
                      .map((c) => (
                        <option
                          key={c.id}
                          value={c.id}
                          className="bg-paper-raised"
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
                    className={ghostButtonClass}
                  >
                    编辑
                  </button>

                  <button
                    disabled={deleting}
                    onClick={() => handleDeletePost(p.folder)}
                    className={dangerButtonClass}
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
      <section>
        <h2 className="text-sm font-medium text-ink uppercase tracking-widest mb-6">
          专栏管理
        </h2>

        <div className="flex flex-col md:flex-row gap-4 items-center mb-8">
          <input
            value={newColumnName}
            onChange={(e) => setNewColumnName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreateColumn()}
            placeholder="新专栏名称"
            className={`${inputClass} flex-1 w-full`}
          />
          <button
            onClick={handleCreateColumn}
            disabled={creatingColumn || !newColumnName.trim()}
            className={`${primaryButtonClass} shrink-0`}
          >
            {creatingColumn ? "创建中..." : "创建专栏"}
          </button>
        </div>

        {data.columns.length === 0 ? (
          <div className="py-12 text-sm text-ink-faint text-center border border-dashed border-line rounded-2xl">
            暂无专栏
          </div>
        ) : (
          <div className="divide-y divide-line border-y border-line/70">
            {data.columns.map((c) => (
              <div key={c.id} className="flex items-center gap-4 py-3">
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
                      className="w-full max-w-xs px-3 py-1.5 rounded-lg bg-paper-raised border border-line text-sm text-ink outline-none"
                    />
                  ) : (
                    <div className="text-sm text-ink truncate">
                      {c.name}
                    </div>
                  )}
                  <div className="text-xs text-ink-faint mt-0.5">
                    {c.posts.length} 篇
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {editingId === c.id ? (
                    <>
                      <button
                        onClick={() => handleRenameColumn(c.id)}
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
                        onClick={() => {
                          setEditingId(c.id);
                          setEditName(c.name);
                        }}
                        className={ghostButtonClass}
                      >
                        重命名
                      </button>
                      <button
                        onClick={() => handleDeleteColumn(c.id, c.name)}
                        className={dangerButtonClass}
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
    </div>
  );
}
