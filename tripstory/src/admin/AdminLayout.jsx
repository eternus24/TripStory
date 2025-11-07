// src/admin/AdminLayout.jsx — 헤더에 가려짐 해결판 (전체 교체본)
import React, { useEffect, useState } from "react";
import { Outlet, NavLink, useLocation } from "react-router-dom";
import {
  LuMenu,
  LuLayoutDashboard,
  LuUsers,
  LuMegaphone,
  LuRefreshCw
} from "react-icons/lu";
import { manualRefresh } from "./AdminApi";

// 공통 헤더(TripStory 헤더)가 fixed라서, 전체 래퍼에 헤더 높이만큼 top padding을 준다.
const HEADER_H = 0; // 필요하면 64/80 등으로 미세조정

export default function AdminLayout({ children }) {
  const [open, setOpen] = useState(true);
  const { pathname } = useLocation();

  // ⏱ 토큰 남은 시간 표시
  const [tokenLeft, setTokenLeft] = useState("-");
  const ACCESS_KEY = "adminAccess";

  useEffect(() => {
    const decodeJwtExp = (token) => {
      try {
        const b64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
        const pad = "=".repeat((4 - (b64.length % 4)) % 4);
        const json = atob(b64 + pad);
        const payload = JSON.parse(json);
        return payload?.exp ? Number(payload.exp) : null;
      } catch {
        return null;
      }
    };

    const tick = () => {
      const tk = localStorage.getItem(ACCESS_KEY);
      if (!tk) return setTokenLeft("-");
      const exp = decodeJwtExp(tk);
      if (!exp) return setTokenLeft("-");
      const left = Math.max(0, Math.floor((exp * 1000 - Date.now()) / 1000));
      const mm = String(Math.floor(left / 60)).padStart(2, "0");
      const ss = String(left % 60).padStart(2, "0");
      setTokenLeft(`${mm}:${ss}`);
    };

    tick();
    const id = setInterval(tick, 1000);
    const onStorage = (e) => { if (e.key === ACCESS_KEY) tick(); };
    window.addEventListener("storage", onStorage);
    return () => { clearInterval(id); window.removeEventListener("storage", onStorage); };
  }, []);

  const pageMeta = {
    "/admin": { title: "관리자 대시보드", desc: "운영 현황과 주요 지표를 한눈에 확인하세요" },
    "/admin/users": { title: "유저 관리", desc: "회원 정보, 상태를 관리합니다" },
    "/admin/notice": { title: "공지사항 추가", desc: "메인 페이지에 노출될 공지를 등록하세요" },
  };
  const meta = pageMeta[pathname] || pageMeta["/admin"];

  return (
    <div style={styles.shell}>
      {/* ===== 사이드바 ===== */}
      <aside style={{ ...styles.sidebar, width: open ? 230 : 70 }}>
        <div style={styles.sidebarSticky}>
          <div style={styles.brand}>
            <button aria-label="Toggle sidebar" onClick={() => setOpen(!open)} style={styles.burgerBtn}>
              <LuMenu size={22} />
            </button>
            {open && <span style={styles.brandText}>Admin Console</span>}
          </div>

          <nav style={styles.nav}>
            <SideItem to="/admin" icon={<LuLayoutDashboard size={18} />} label="대시보드" open={open} />
            <SideItem to="/admin/users" icon={<LuUsers size={18} />} label="유저 관리" open={open} />
            <SideItem to="/admin/notice" icon={<LuMegaphone size={18} />} label="공지사항 추가" open={open} />
            <SideItem to="/admin/approval" icon={<LuMegaphone size={18} />} label="알림" open={open} />
          </nav>

          <div style={styles.sidebarFooter}>
            {open ? <small style={{ opacity: 0.85 }}>v1.0 • 운영중</small> : <small>v1</small>}
          </div>
        </div>
      </aside>

      {/* ===== 메인 컨텐츠 ===== */}
      <main style={styles.main}>
        {/* 상단 제목 카드 */}
        <header style={styles.headerCard}>
          <div>
            <h1 style={styles.pageTitle}>{meta.title}</h1>
            <p style={styles.pageDesc}>{meta.desc}</p>
          </div>
          <div style={{ display: "flex", gap: 8 }} />
        </header>

        {/* 실제 페이지 내용 */}
        <section style={{ padding: "8px 4px" }}>{children ?? <Outlet />}</section>

        {/* 하단 토큰 표시 + 재발급 */}
        <footer style={styles.bottomBar}>
          <span style={{ color: "#5d6b83", fontSize: 13 }}>⏱ 남은 토큰: {tokenLeft}</span>
          <button
            onClick={async () => {
              const tk = await manualRefresh();
              alert(tk ? "🔄 토큰 재발급 완료!" : "재발급 실패");
            }}
            style={{ ...styles.refreshBtn, marginLeft: 10 }}
            aria-label="토큰 재발급"
          >
            <LuRefreshCw size={16} style={{ marginRight: 6 }} />
            재발급
          </button>
        </footer>
      </main>
    </div>
  );
}

/* ===== 사이드 메뉴 항목 ===== */
function SideItem({ to, icon, label, open }) {
  const base = {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "12px 14px",
    borderRadius: 10,
    textDecoration: "none",
    color: "#2b3a4e",
    fontWeight: 600,
    transition: "background .18s ease, transform .12s ease",
  };
  const active = {
    background: "linear-gradient(90deg, #1a73e8 0%, #26d0ce 100%)",
    boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.3)",
    color: "#fff",
  };
  const hover = { background: "rgba(255,255,255,0.45)" };

  return (
    <NavLink
      to={to}
      end
      style={({ isActive }) => (isActive ? { ...base, ...active } : base)}
      onMouseEnter={(e) => Object.assign(e.currentTarget.style, hover)}
      onMouseLeave={(e) => Object.assign(e.currentTarget.style, base)}
    >
      <span aria-hidden="true">{icon}</span>
      {open && <span>{label}</span>}
    </NavLink>
  );
}

/* ===== 스타일 ===== */
const styles = {
  shell: {
    display: "grid",
    gridTemplateColumns: "auto 1fr",
    minHeight: "100vh",
    background: "linear-gradient(180deg, #f7f9fc 0%, #f2f6fb 100%)",
    paddingTop: 0,        // ⬅️ 헤더에 안 가리도록 전체를 아래로 내림
    boxSizing: "border-box",
  },
  sidebar: {
    padding: 16,
    borderRight: "1px solid rgba(0,0,0,0.06)",
    background: "linear-gradient(180deg, #e8ebef 0%, #d7dbe0 100%)",
    color: "#2b3a4e",
    boxShadow: "4px 0 12px rgba(0,0,0,0.05)",
  },
  // 래퍼(shell)가 내려갔으니 sticky 기준은 top:0 이 맞다
  sidebarSticky: { position: "sticky", top: 0 },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "8px 8px 16px",
    borderBottom: "1px solid rgba(0,0,0,0.08)",
    marginBottom: 8,
  },
  burgerBtn: {
    display: "grid",
    placeItems: "center",
    width: 40,
    height: 40,
    borderRadius: 10,
    border: "none",
    background: "rgba(0,0,0,0.08)",
    color: "#2b3a4e",
    cursor: "pointer",
  },
  brandText: { fontWeight: 900, letterSpacing: 0.3, fontSize: 16, color: "#2b3a4e" },
  nav: { display: "grid", gap: 6, marginTop: 8 },
  sidebarFooter: {
    marginTop: "auto",
    paddingTop: 12,
    borderTop: "1px solid rgba(0,0,0,0.08)",
    color: "#5a677d",
  },
  // 상단 여백은 shell에서 줬으니 여기선 일반 패딩만
  main: {
    position: "relative",
  },
  headerCard: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    background: "linear-gradient(90deg, #22a7f0 0%, #26d0ce 100%)",
    borderRadius: 14,
    padding: "20px 24px",
    color: "#fff",
    boxShadow: "0 6px 14px rgba(0,0,0,0.1)",
    marginBottom: 20,
    zIndex: 1,
  },
  pageTitle: { margin: 0, fontSize: 22, fontWeight: 800 },
  pageDesc: { margin: "6px 0 0", fontSize: 13, opacity: 0.9 },
  bottomBar: {
    position: "sticky",
    bottom: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    height: 40,
    background: "linear-gradient(180deg, #f9fbff 0%, #eef3f9 100%)",
    borderRadius: 10,
    boxShadow: "0 -4px 8px rgba(0,0,0,0.04)",
    padding: "8px 16px",
    color: "#444",
  },
  refreshBtn: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    height: 36,
    padding: "0 14px",
    borderRadius: 10,
    border: "none",
    background: "#fff",
    color: "#1a73e8",
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 4px 10px rgba(26,115,232,.15)",
  },
};