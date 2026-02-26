
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
          // token 合法 → 跳后台
          window.location.href = "/admin";
        } else {
          // token 失效 → 清除
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
      <div className="w-screen h-screen bg-neutral-950 flex items-center justify-center text-neutral-400">
        Verifying token...
      </div>
    );
  }

  return (
    <div className="relative w-screen min-h-screen bg-neutral-950 overflow-hidden flex items-center justify-center px-4">
      
      {/* 背景光晕 */}
      <div className="absolute inset-0">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-blue-500/20 rounded-full blur-3xl" />
      </div>

      {/* 登录卡片 */}
      <div className="relative z-10 w-full max-w-md bg-white/5 backdrop-blur-3xl border border-white/15 rounded-3xl p-10 shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
        
        <h1 className="text-2xl font-semibold text-neutral-100 mb-8 text-center">
          后台登录
        </h1>

        <form onSubmit={handleLogin} className="flex flex-col gap-5">
          
          <input
            type="text"
            placeholder="用户名"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="px-4 py-3 rounded-xl bg-white/10 border border-white/10 text-neutral-100 focus:outline-none focus:ring-2 focus:ring-white/30"
          />

          <input
            type="password"
            placeholder="密码"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="px-4 py-3 rounded-xl bg-white/10 border border-white/10 text-neutral-100 focus:outline-none focus:ring-2 focus:ring-white/30"
          />

          {error && (
            <div className="text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-4 py-3 rounded-full bg-white/90 text-neutral-900 font-semibold shadow-lg hover:bg-white hover:scale-105 transition disabled:opacity-50"
          >
            {loading ? "登录中..." : "登录"}
          </button>
        </form>
      </div>
    </div>
  );
}

