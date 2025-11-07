import React from "react";
import { Crown } from "lucide-react"; // 👑 왕관 아이콘 (lucide-react에서 가져옴)

/*
  AdminBadge (검은 반투명 + 왕관 버전)
  - 관리자일 때만 "검은 반투명 배경 + 왕관 아이콘 + '관리자'" 라벨을 보여준다.
  - forceAdmin === true 면 user 정보에 role이 없어도 무조건 뱃지를 렌더한다.
*/

const AdminBadge = ({ user, forceAdmin = false }) => {
  if (!user && !forceAdmin) return null;

  const isAdminByUser =
    user &&
    (
      user.role === "admin" ||
      (Array.isArray(user.roles) && user.roles.includes("admin")) ||
      user.isAdmin === true
    );

  const isAdmin = forceAdmin || isAdminByUser;
  if (!isAdmin) return null;

  return (
    <span
      className="admin-badge-dark"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        marginLeft: "6px",
        padding: "4px 8px",
        borderRadius: "8px",
        fontSize: "12px",
        fontWeight: 600,
        backgroundColor: "rgba(0,0,0,0.6)",
        color: "#fff",
        lineHeight: 1.2,
        letterSpacing: "0.3px",
        boxShadow: "0 0 6px rgba(0,0,0,0.25)",
      }}
    >
      <Crown
        size={13}
        strokeWidth={2}
        style={{
          color: "#ffd54f",
          filter: "drop-shadow(0 0 4px rgba(255,213,79,0.7))",
        }}
      />
      <span>관리자</span>
    </span>
  );
};

export default AdminBadge;