import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/toast";
import { inputClass, primaryButtonClass } from "../lib/ui-classes";

export default function AccountAdmin() {
  // ===== 修改密码 =====
  const [oldPwd, setOldPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [changing, setChanging] = useState(false);
  const [pwdError, setPwdError] = useState("");

  // ===== 头像 =====
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [uploading, setUploading] = useState(false);

  const token = localStorage.getItem("token");
  const toast = useToast();

  // 加载当前头像
  useEffect(() => {
    fetch("/api/avatar")
      .then((res) => res.json())
      .then((d) => setAvatarUrl(d.url))
      .catch(() => {});
  }, []);

  // ===== 修改密码 =====
  async function handleChangePassword() {
    setPwdError("");

    if (newPwd.length < 6) {
      setPwdError("新密码至少 6 位");
      return;
    }
    if (newPwd !== confirmPwd) {
      setPwdError("两次输入的新密码不一致");
      return;
    }

    setChanging(true);
    try {
      const res = await fetch("/api/change-password", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          old_password: oldPwd,
          new_password: newPwd,
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.detail || "修改失败");

      toast("密码修改成功，下次登录请使用新密码", "success");
      setOldPwd("");
      setNewPwd("");
      setConfirmPwd("");
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setChanging(false);
    }
  }

  // ===== 上传头像 =====
  async function handleUploadAvatar(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/avatar", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.detail || "上传失败");

      setAvatarUrl(d.url);
      toast("头像已更新", "success");
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setUploading(false);
    }
  }

  return (
    <section className="flex flex-col lg:flex-row gap-14">
      {/* ===== 头像上传 ===== */}
      <div className="lg:w-1/3">
        <h2 className="text-sm font-medium text-ink uppercase tracking-widest mb-6">
          头像
        </h2>

        <div className="flex items-center gap-6">
          <div className="w-24 h-24 rounded-full overflow-hidden border border-line shrink-0 bg-paper-raised">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-ink-faint text-xs">
                未设置
              </div>
            )}
          </div>

          <label
            className={`
              px-4 py-2.5 rounded-xl text-xs cursor-pointer
              border border-line text-ink
              hover:border-clay/50 hover:text-clay-dark transition
              ${uploading ? "opacity-50 pointer-events-none" : ""}
            `}
          >
            {uploading ? "上传中..." : "选择图片上传"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleUploadAvatar}
            />
          </label>
        </div>

        <p className="mt-3 text-xs text-ink-faint">
          自动居中裁剪为正方形（400×400 WebP）
        </p>
      </div>

      {/* ===== 修改密码 ===== */}
      <div className="flex-1">
        <h2 className="text-sm font-medium text-ink uppercase tracking-widest mb-6">
          修改密码
        </h2>

        <div className="flex flex-col gap-3 max-w-sm">
          <input
            type="password"
            value={oldPwd}
            onChange={(e) => setOldPwd(e.target.value)}
            placeholder="当前密码"
            className={inputClass}
          />
          <input
            type="password"
            value={newPwd}
            onChange={(e) => setNewPwd(e.target.value)}
            placeholder="新密码（至少 6 位）"
            className={inputClass}
          />
          <input
            type="password"
            value={confirmPwd}
            onChange={(e) => setConfirmPwd(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleChangePassword()}
            placeholder="确认新密码"
            className={inputClass}
          />

          {pwdError && (
            <div className="text-xs text-red-600">{pwdError}</div>
          )}

          <button
            onClick={handleChangePassword}
            disabled={changing || !oldPwd || !newPwd || !confirmPwd}
            className={`${primaryButtonClass} self-start mt-2`}
          >
            {changing ? "修改中..." : "修改密码"}
          </button>
        </div>
      </div>
    </section>
  );
}
