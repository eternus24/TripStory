// src/admin/ProtectedAdminRoute.jsx
import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { AdminAuth } from './AdminApi';

export default function ProtectedAdminRoute({ children }) {
  const [state, setState] = useState({ loading: true, ok: false });

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        await AdminAuth.me();     // 토큰 유효 + admin 권한 확인
        if (live) setState({ loading: false, ok: true });
      } catch {
        if (live) setState({ loading: false, ok: false });
      }
    })();
    return () => { live = false; };
  }, []);

  if (state.loading) return null; // 스켈레톤/로더 넣어도 됨
  if (!state.ok) return <Navigate to="/admin/login" replace />;
  return children;
}