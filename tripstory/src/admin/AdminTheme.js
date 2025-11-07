import { createGlobalStyle } from 'styled-components';

export const AdminGlobal = createGlobalStyle`
  :root {
    --admin-bg-top: #0e1a2b;
    --admin-bg-bottom: #1e385a;
    --admin-panel: #1f2f47;
    --admin-text: #e8f1ff;
    --admin-muted: #9eb2cc;
    --admin-accent: #22d4b9;     /* 메인 민트 */
    --admin-accent-hover: #1ab9a0;
    --admin-danger: #ff6b6b;
  }

  .admin-shell {
    min-height: 100vh;   /* 화면 전체를 채움 */
    display: grid;
    grid-template-rows: auto 1fr auto; /* 헤더 - 내용 - 푸터 구조 유지 */
    background: linear-gradient(180deg, var(--admin-bg-top) 0%, var(--admin-bg-bottom) 100%) !important;
  }

  .admin-shell {
    min-height: 100vh;
    display: grid;
    grid-template-rows: 64px 1fr;
  }

  .admin-topbar {
    display:flex;
    align-items:center;
    justify-content:space-between;
    padding:0 24px;
    background: linear-gradient(90deg, rgba(18,35,55,.8), rgba(30,56,90,.8));
    border-bottom: 1px solid rgba(255,255,255,.08);
    color: var(--admin-text);
    backdrop-filter: blur(8px);
  }

  .admin-brand {
    font-weight: 800;
    letter-spacing: .3px;
    color: var(--admin-text);
  }

  .admin-container {
    display: grid;
    place-items: center;
    padding: 60px 16px;
  }

  .admin-card {
    width: 100%;
    max-width: 560px;
    background: var(--admin-panel);
    border-radius: 18px;
    border: 1px solid rgba(255,255,255,.07);
    box-shadow: 0 12px 40px rgba(0,0,0,.4);
    padding: 32px 28px;
  }

  .admin-title {
    font-size: 1.5rem;
    font-weight: 700;
    margin-bottom: 10px;
    color: #ffffff;
  }

  .admin-desc {
    color: var(--admin-muted);
    margin-bottom: 20px;
  }

  .admin-field {
    display: grid;
    gap: 8px;
    margin-bottom: 16px;
  }

  .admin-field label {
    color: var(--admin-muted);
    font-size: .9rem;
  }

  .admin-field input {
    background: #15263c;
    border: 1px solid rgba(255,255,255,.15);
    color: var(--admin-text);
    border-radius: 10px;
    padding: 12px 14px;
    font-size: .95rem;
    outline: none;
    transition: border-color .2s;
  }
  .admin-field input:focus {
    border-color: var(--admin-accent);
    box-shadow: 0 0 0 3px rgba(34,212,185,.25);
  }

  .admin-actions {
    display: flex;
    justify-content: flex-end;   /* 오른쪽 정렬 */
    align-items: center;
    gap: 10px;
    margin-top: 10px;
    flex-wrap: wrap;              /* 줄바꿈은 허용하지만 자연스럽게 */
  }

  .btn {
    border: none;
    border-radius: 10px;
    padding: 10px 18px;
    font-weight: 600;
    cursor: pointer;
    transition: all .2s ease;
    white-space: nowrap;         /* 글자 줄바꿈 방지 */
    flex-shrink: 0;              /* 버튼이 눌려서 폭 줄어드는 현상 방지 */
    height: 42px;                /* 통일된 높이 */
  }

  .btn-primary {
    background: var(--admin-accent);
    color: #0d1c2d;
  }
  .btn-primary:hover {
    background: var(--admin-accent-hover);
  }

  .btn-secondary {
    background: #14273d;
    color: var(--admin-text);
    border: 1px solid rgba(255,255,255,.15);
  }
  .btn-secondary:hover {
    background: #1b3351;
  }

  .btn-danger {
    background: var(--admin-danger);
    color: #fff;
  }

  .admin-note {
    font-size: .9rem;
    color: var(--admin-muted);
    margin-top: 10px;
  }

  .admin-row {
    display:flex;
    justify-content: space-between;
    gap:10px;
  }
`;