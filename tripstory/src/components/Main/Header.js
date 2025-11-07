import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { HeaderWrap, Logo, Nav, LoginBtn, RightArea } from "./MainStyled";
import logo from "../../assets/image/Logo.png";
import { AuthContext } from "../../context/AuthContext";
import { AdminContext } from "../../context/AdminContext";
import { Auth } from "../../assets/api/index";
import AdminApi from "../../assets/api/admin";

const Header = () => {
  const navigate = useNavigate();

  const { user, loading: userLoading, reload: userReload } =
    useContext(AuthContext) || {};
  const { admin, loading: adminLoading, reload: adminReload } =
    useContext(AdminContext) || {};

  const [loggingOut, setLoggingOut] = useState(false);

  // 관리자 판별(상단엔 관리자 메뉴 1개만)
  const isAdmin =
    (user && user.role === "admin") || (admin && admin.role === "admin");

  // ✅ 로그아웃: 관리자/일반 모두 종료 + 하드 리다이렉트
  const onLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await Promise.allSettled([AdminApi.logout(), Auth.logout()]);
      try { localStorage.removeItem("adminAccess"); } catch {}
      try { localStorage.removeItem("accessToken"); } catch {}
      await Promise.allSettled([userReload?.(), adminReload?.()]);
      window.location.replace("/");
      setTimeout(() => window.location.reload(), 0);
    } finally {
      setLoggingOut(false);
    }
  };

  if (userLoading || adminLoading) return null;

  // ✅ 이름/아이디 길이 제한
  const displayNameRaw =
    user?.nickname ||
    user?.name ||
    admin?.name ||
    user?.userId ||
    admin?.userId ||
    "사용자";

  // 12자 이상이면 ... 처리
  const displayName =
    displayNameRaw.length > 12
      ? displayNameRaw.slice(0, 9) + "..."
      : displayNameRaw;

  return (
    <HeaderWrap>
      <Logo>
        <img
          src={logo}
          alt="TripStory"
          style={{ height: 60, cursor: "pointer" }}
          onClick={() => navigate("/")}
        />
      </Logo>

      <Nav>
        <ul>
          <li className="dropdown">
            여행 가이드
            <ul className="dropdown-menu">
              <li onClick={() => navigate("/theme")}>Trip Theme</li>
              <li onClick={() => navigate("/festival")}>Trip Festival</li>
              <li onClick={() => navigate("/site")}>Trip Site</li>
              <li onClick={() => navigate("/weather")}>Trip Map</li>
            </ul>
          </li>
          <li onClick={() => navigate("/aitrip")}>AI 추천 여행</li>
          <li onClick={() => navigate("/tripstory/feed")}>TripStory</li>
          <li onClick={() => navigate("/reviews")}>여행 후기</li>
          <li onClick={() => navigate("/market")}>여행자 혜택관</li>
        </ul>
      </Nav>

      <RightArea>
        {user || admin ? (
          <>
            <span
              style={{
                marginRight: 8,
                maxWidth: 120,
                display: "inline-block",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                verticalAlign: "middle",
              }}
              title={displayNameRaw + " 님"}
            >
              {displayName} 님
            </span>
            <LoginBtn onClick={() => navigate("/mypage/main")}>내정보</LoginBtn>
            <LoginBtn onClick={onLogout} disabled={loggingOut}>
              {loggingOut ? "로그아웃 중..." : "로그아웃"}
            </LoginBtn>
          </>
        ) : (
          <LoginBtn onClick={() => navigate("/login")}>로그인</LoginBtn>
        )}
      </RightArea>
    </HeaderWrap>
  );
};

export default Header;