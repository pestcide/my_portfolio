import { createContext, useCallback, useContext, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "./dialog";

const ConfirmContext = createContext(null);

/**
 * 强确认弹窗：替代原生 confirm()
 * 用法：const { confirm } = useConfirm();
 *      const ok = await confirm({ title: "删除专辑", description: "...", confirmText: "删除", danger: true });
 */
export function ConfirmProvider({ children }) {
  const [req, setReq] = useState(null);

  const confirm = useCallback((opts) => {
    return new Promise((resolve) => setReq({ ...opts, resolve }));
  }, []);

  const settle = (ok) => {
    req?.resolve(ok);
    setReq(null);
  };

  const danger = req?.danger !== false;

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}

      <Dialog open={!!req} onOpenChange={(open) => !open && settle(false)}>
        <DialogContent className="z-[90] bg-paper-raised border border-line rounded-2xl max-w-md p-6">
          <DialogTitle className="text-base font-semibold text-ink pr-6">
            {req?.title || "确认操作"}
          </DialogTitle>

          <p className="text-sm text-ink-soft leading-relaxed mt-1">
            {req?.description || "该操作不可恢复，确定继续？"}
          </p>

          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={() => settle(false)}
              className="px-4 py-2 rounded-full text-sm text-ink-soft hover:text-ink border border-transparent hover:border-line transition"
            >
              取消
            </button>
            <button
              onClick={() => settle(true)}
              className={`
                px-4 py-2 rounded-full text-sm font-medium transition
                ${
                  danger
                    ? "bg-red-600 text-paper hover:bg-red-700"
                    : "bg-ink text-paper hover:bg-clay-dark"
                }
              `}
            >
              {req?.confirmText || "确认"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </ConfirmContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useConfirm() {
  return useContext(ConfirmContext);
}
