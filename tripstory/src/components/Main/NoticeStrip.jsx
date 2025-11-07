// src/components/Main/NoticeStrip.jsx
import React, { useEffect, useState } from 'react';
import { fetchRecentNotices } from '../../assets/api/notice';

export default function NoticeStrip({ onOpen }) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    fetchRecentNotices(5).then(setItems).catch(console.error);
  }, []);

  if (!items.length) return null;

  return (
    <div className="notice-strip">
      <h3 className="notice-strip__title">📢 최근 공지</h3>
      <div className="notice-strip__list">
        {items.map((n) => (
          <button key={n._id} className="notice-pill" onClick={() => onOpen?.(n._id)}>
            {n.title}
          </button>
        ))}
      </div>
      <style>{`
        .notice-strip{margin:1rem 0;padding:1rem;border-radius:1rem;background:rgba(0,0,0,.04)}
        .notice-strip__list{display:flex;gap:.5rem;flex-wrap:wrap}
        .notice-pill{padding:.5rem .8rem;border-radius:999px;background:#fff;border:1px solid rgba(0,0,0,.08);cursor:pointer}
        .notice-pill:hover{transform:translateY(-1px)}
      `}</style>
    </div>
  );
}