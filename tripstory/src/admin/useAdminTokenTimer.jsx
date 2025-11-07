// src/admin/useAdminTokenTimer.jsx — 🆕 신규
import { useEffect, useMemo, useState } from 'react';

function decodeJwt(token) {
  try {
    const payload = token.split('.')[1];
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decodeURIComponent(escape(json)));
  } catch {
    return null;
  }
}

export default function useAdminTokenTimer(getToken, onExpire) {
  const [leftSec, setLeftSec] = useState(null);

  const exp = useMemo(() => {
    const tk = getToken?.();
    if (!tk) return null;
    const p = decodeJwt(tk);
    return p?.exp ? p.exp * 1000 : null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getToken?.(), Date.now() % 2]); // 토큰 바뀌면 다시 계산되도록 유도

  useEffect(() => {
    if (!exp) { setLeftSec(null); return; }
    const tick = () => {
      const now = Date.now();
      const left = Math.max(0, Math.floor((exp - now) / 1000));
      setLeftSec(left);
      if (left === 0 && onExpire) onExpire();
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [exp, onExpire]);

  return leftSec;
}