import { createContext, useCallback, useContext, useRef, useState } from "react";

const ToastContext = createContext(() => {});

/**
 * 轻量 Toast：右下角弹出、自动消失
 * 用法：const toast = useToast(); toast("已保存", "success")
 * type: "success" | "error" | "info"
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const toast = useCallback((message, type = "info") => {
    const id = ++idRef.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  return (
    <ToastContext.Provider value={toast}>
      {children}

      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none max-w-[90vw]">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`
              toast-item pointer-events-auto
              px-4 py-2.5 rounded-xl text-sm
              bg-paper-raised border shadow-lg
              ${
                t.type === "success"
                  ? "border-ink/20 text-ink"
                  : t.type === "error"
                  ? "border-red-300 text-red-700"
                  : "border-line text-ink-soft"
              }
            `}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  return useContext(ToastContext);
}
