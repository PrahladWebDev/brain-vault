import { useEffect } from 'react';

export function useKeyboardShortcut(
  keyCombo: { key: string; meta?: boolean; ctrl?: boolean },
  callback: () => void
) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const metaOk = keyCombo.meta ? e.metaKey || e.ctrlKey : true;
      const ctrlOk = keyCombo.ctrl ? e.ctrlKey || e.metaKey : true;
      if (e.key.toLowerCase() === keyCombo.key.toLowerCase() && metaOk && ctrlOk) {
        e.preventDefault();
        callback();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [keyCombo.key, keyCombo.meta, keyCombo.ctrl, callback]);
}
