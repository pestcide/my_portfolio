
import { useState, useEffect } from "react";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(true);

  // ===== 检测 token 合法性 =====
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      setChecking(false);
      return;
    }

    fetch("/api/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (res.ok) {
          window.location.href = "/admin";
        } else {
          localStorage.removeItem("token");
          setChecking(false);
        }
      })
      .catch(() => {
        localStorage.removeItem("token");
        setChecking(false);
      });
  }, []);

  // ===== 登录 =====
  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "登录失败");
      }

      localStorage.setItem("token", data.token);
      window.location.href = "/admin";
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // ===== 检测中 =====
  if (checking) {
    return (
      <div className="w-screen h-screen bg-paper flex items-center justify-center text-ink-faint text-sm">
        Verifying token...
      </div>
    );
  }

  return (
    <div className="w-screen min-h-screen bg-paper text-ink flex items-center justify-center px-4 page-enter">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-2xl font-semibold text-ink tracking-tight mb-1">
          后台登录
        </h1>
        <p className="text-xs text-ink-faint mb-10">
          Golem 的摄影与博客 · 管理入口
        </p>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="用户名"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="px-4 py-3 rounded-xl bg-paper-raised border border-line text-sm text-ink placeholder:text-ink-faint outline-none focus:border-clay/60 transition"
          />

          <input
            type="password"
            placeholder="密码"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="px-4 py-3 rounded-xl bg-paper-raised border border-line text-sm text-ink placeholder:text-ink-faint outline-none focus:border-clay/60 transition"
          />

          {error && (
            <div className="text-red-600 text-xs">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-4 py-3 rounded-full bg-ink text-paper text-sm font-semibold hover:bg-clay-dark transition disabled:opacity-40"
          >
            {loading ? "登录中..." : "登录"}
          </button>
        </form>
      </div>
    </div>
  );
}
