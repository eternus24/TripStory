import styled, { createGlobalStyle } from 'styled-components';

const schemes = {
  theme: {
    headerBg: "linear-gradient(90deg, #1a2980 0%, #26d0ce 100%)",
    headerText: "#e9fcff",
    accent: "#b5f8ff",
    footerBg: "linear-gradient(180deg, #1e3c72 0%, #2a5298 100%)",
    footerText: "#c8e3f2"
  }
};

// 👉 여기 한 줄만 바꿔서 테마 전환
const scheme = schemes.theme;

// MainStyled.js 에 추가하면 깔끔
export const GlobalStyle = createGlobalStyle`
  html, body, #root { min-height: 100vh; height: auto; margin: 0; 
    display: flex;          /* ✅ 추가 */
    flex-direction: column; /* ✅ 추가 */}
  body {
    margin: 0;
    font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans KR", sans-serif;

    /* 🤍 흰색 중심, 부드러운 민트/하늘빛 그라데이션 */
    background:
      radial-gradient(circle at 20% 25%, rgba(210, 255, 250, 0.7) 0%, rgba(255, 255, 255, 0.6) 55%),
      radial-gradient(circle at 80% 15%, rgba(220, 240, 255, 0.6) 0%, rgba(255, 255, 255, 0.7) 65%),
      linear-gradient(180deg, #ffffff 0%, #f7ffff 25%, #effdff 55%, #e3f9ff 80%, #dcf8ff 100%);
    background-attachment: fixed;
    color: #043344;
  }
  :focus-visible { outline: 2px solid rgba(38,198,218,.6); outline-offset: 2px; }
`;

export const HeaderWrap = styled.header`
  position: sticky;
  top: 0;
  z-index: 1000;
  height: 80px;
  left: 0;
  right: 0;
  background: ${scheme.headerBg};
  color: ${scheme.headerText};
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  padding: 0 40px;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.06);
`;


export const Logo = styled.h1`
  font-size: 1.5rem;
  font-weight: bold;
  margin: 0;
  justify-self: start;
  cursor: pointer;
`;

export const Nav = styled.nav`
  justify-self: center;
  min-width: 0;        /* ← 이거 없으면 2줄로 밀림 */
  overflow: visible;   /* ✅ 드롭다운이 밖으로 자연스럽게 펼쳐지게 */

  ul {
    display: flex;
    align-items: center;
    gap: clamp(10px, 1.6vw, 24px); /* 화면에 따라 부드럽게 줄어드는 간격 */
    flex-wrap: nowrap;             /* 절대 줄바꿈 X */
    min-width: 0;
    list-style: none;
    margin: 0;
    padding: 0;
  }

  li {
    position: relative;
    cursor: pointer;
    font-size: 0.95rem;
    transition: color .2s ease;
    padding: 12px 10px;
    border-radius: 6px;
    white-space: nowrap;
  }

  li:hover {
    color: ${scheme.accent};
    background: rgba(255,255,255,0.10);
  }

    .dropdown {
    position: relative;
    padding-bottom: 15px; /* hover 유지 영역 확보 */
  }

  /* ▼ 드롭다운 메뉴 */
  .dropdown-menu {
    position: absolute;
    top: calc(100% - 5px); /* 살짝 겹치게 */
    left: 0;
    min-width: 150px;
    margin: 0;
    padding: 6px 0;
    list-style: none;

    background: rgba(230, 245, 255, 0.9);  /* 은은한 하늘빛 유리톤 */
    color: #1a2a4a;
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 1px solid rgba(255,255,255,0.3);
    border-radius: 10px;
    box-shadow: 0 6px 12px rgba(0,0,0,0.12);

    display: block;
    opacity: 0;
    pointer-events: none;
    transform: translateY(-4px);
    transition: opacity .18s ease, transform .18s ease;
    z-index: 2000;      /* ✅ 어떤 카드/지도보다 위로 */
  }

  /* hover 유지 + 자연스러운 등장 */
  .dropdown:hover .dropdown-menu {
    opacity: 1;
    transform: translateY(0);
    pointer-events: auto;
  }

  /* 세모(삼각형) 살짝 작게 + 더 자연스럽게 */
  .dropdown-menu::before {
    content: '';
    position: absolute;
    top: -6px;
    left: 22px;
    width: 10px; height: 10px;
    background: rgba(230, 245, 255, 0.9);
    transform: rotate(45deg);
    border-radius: 2px;
    border-top: 1px solid rgba(255,255,255,0.3);
    border-left: 1px solid rgba(255,255,255,0.3);
  }

  .dropdown-menu li {
    padding: 8px 14px;
    border-radius: 6px;
    white-space: nowrap;
    transition: background .15s ease, transform .08s ease, color .15s ease;
  }

  .dropdown-menu li:hover {
    background: linear-gradient(90deg, #26c6da 0%, #1a8ed0 100%);
    color: #fff;
    transform: translateX(2px);
  }
`;

export const RightArea = styled.div`
  justify-self: end;
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const LoginBtn = styled.button`
  appearance: none;
  border: 1px solid ${scheme.accent};
  background: transparent;
  color: ${scheme.headerText};
  border-radius: 999px;
  padding: 8px 18px;
  font-size: 0.9rem;
  font-weight: 600;
  line-height: 1;
  cursor: pointer;
  transition: background .2s ease, color .2s ease, transform .12s ease;

  &:hover {
    background: ${scheme.accent};
    color: #0b1020;
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }
`;

export const FooterWrap = styled.footer`
  width: 100%;
  background: ${scheme.footerBg};
  color: ${scheme.footerText};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
  height: 80px;

  /* ✅ 핵심 부분 */
  margin-top: auto;       /* 푸터를 아래로 밀기 */
`;
