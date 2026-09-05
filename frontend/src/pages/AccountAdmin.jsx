import { useEffect, useState } from "react";

export default function AccountAdmin() {
  // ===== 修改密码 =====
  const [oldPwd, setOldPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [changing, setChanging] = useState(false);
  const [pwdMsg, setPwdMsg] = useState("");

  // ===== 头像 =====
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [avatarMsg, setAvatarMsg] = useState("");

  const token = localStorage.getItem("token");

  // 加载当前头像
  useEffect(() => {
    fetch("/api/avatar")
      .then((res) => res.json())
      .then((d) => setAvatarUrl(d.url))
      .catch(() => {});
  }, []);

  // ===== 修改密码 =====
  async function handleChangePassword() {
    if (newPwd.length < 6) {
      setPwdMsg("新密码至少 6 位");
      return;
    }
    if (newPwd !== confirmPwd) {
      setPwdMsg("两次输入的新密码不一致");
      return;
    }

    setChanging(true);
    setPwdMsg("");
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

      setPwdMsg("密码修改成功 ✅ 请下次登录使用新密码");
      setOldPwd("");
      setNewPwd("");
      setConfirmPwd("");
    } catch (err) {
      setPwdMsg(err.message);
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
    setAvatarMsg("");
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
      setAvatarMsg("头像已更新 ✅ 刷新首页即可看到");
    } catch (err) {
      setAvatarMsg(err.message);
    } finally {
      setUploading(false);
    }
  }

  const sectionClass =
    "bg-white/5 backdrop-blur-3xl border border-white/15 rounded-3xl p-10 shadow-[0_20px_60px_rgba(0,0,0,0.6)]";

  const inputClass =
    "flex-1 w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-neutral-200 placeholder:text-neutral-500 outline-none focus:border-purple-400/40";

  return (
    <section className={sectionClass}>
      <h2 className="text-xl font-semibold text-neutral-100 mb-6">
        账号设置
      </h2>

      <div className="flex flex-col lg:flex-row gap-10">
        {/* ===== 头像上传 ===== */}
        <div className="lg:w-1/3">
          <h3 className="text-sm font-semibold text-neutral-300 mb-4">
            头像
          </h3>

          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-full overflow-hidden border border-white/20 shrink-0 bg-white/5">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-neutral-500 text-xs">
                  未设置
                </div>
              )}
            </div>

            <label
              className={`
                px-4 py-2.5 rounded-full text-xs cursor-pointer
                bg-white/10 border border-white/10 hover:bg-white/20
                transition text-neutral-300
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

          <p className="mt-3 text-xs text-neutral-500">
            自动居中裁剪为正方形（400×400 WebP）
          </p>

          {avatarMsg && (
            <div className="mt-2 text-xs text-neutral-300">{avatarMsg}</div>
          )}
        </div>

        {/* ===== 修改密码 ===== */}
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-neutral-300 mb-4">
            修改密码
          </h3>

          <div className="flex flex-col gap-3">
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

            <button
              onClick={handleChangePassword}
              disabled={changing || !oldPwd || !newPwd || !confirmPwd}
              className="self-start px-6 py-2.5 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 text-white text-sm font-semibold hover:opacity-90 transition disabled:opacity-40"
            >
              {changing ? "修改中..." : "修改密码"}
            </button>

            {pwdMsg && (
              <div className="text-xs text-neutral-300">{pwdMsg}</div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
