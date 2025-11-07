// src/context/AuthContext.jsx
import React, { createContext, useCallback, useEffect, useState } from 'react';
import { Auth } from '../assets/api/index'; // 일반 유저용
import axios from 'axios';

export const AuthContext = createContext({
  user: null,
  loading: true,
  reload: async () => {},
});

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    try {
      // 현재 로그인 쿠키를 보고 일반/관리자 판단
      const isAdmin = document.cookie.includes('admin_refresh');

      if (isAdmin) {
        // ✅ 관리자 토큰 갱신 시도
        await axios.post('/admin-auth/refresh', {}, { withCredentials: true }).catch(() => {});
        const res = await axios.get('/admin-auth/me', {
          withCredentials: true,
          headers: {
            Authorization: `Bearer ${localStorage.getItem('adminAccessToken') || ''}`,
          },
        });
        if (res.data?.user) {
          setUser(res.data.user);
          return;
        }
      } else {
        // ✅ 일반 유저 토큰 갱신 및 정보 요청
        await Auth.bootRefresh().catch(() => {});
        const me = await Auth.me();
        setUser(me || null);
        return;
      }
    } catch (err) {
      console.error('[AuthContext] reload error:', err);
      setUser(null);
    }
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await reload();
      setLoading(false);
    })();
  }, [reload]);

  return (
    <AuthContext.Provider value={{ user, loading, reload }}>
      {children}
    </AuthContext.Provider>
  );
}