// src/assets/api/notice.js
// 공지/댓글/좋아요 관련 API
// (일반 유저든 관리자든, 같은 axios 인스턴스 api 사용)

import api from '../api';

// 최근 공지 목록 불러오기
export const fetchRecentNotices = async (limit = 5) => {
  const { data } = await api.get(`/notices`, { params: { limit } });
  return data?.notices || data?.items || data?.list || [];
};

// 공지 상세
export const fetchNoticeDetail = async (id) => {
  const { data } = await api.get(`/notices/${id}`);
  return data?.notice;
};

// 좋아요 토글
export const toggleLike = async (id) => {
  const { data } = await api.post(`/notices/${id}/like`, {});
  return data; // { ok, liked, likesCount }
};

// 댓글 등록
export const addComment = async (id, content) => {
  const { data } = await api.post(`/notices/${id}/comments`, { content });
  return data?.comments || [];
};

/* ── 관리자 전용 (필요 시 사용) ───────────────────────── */

export const adminListNotices = async ({ page = 1, size = 20, q = '' } = {}) => {
  const { data } = await api.get(`/admin/notices`, {
    params: { page, size, q },
  });
  return data;
};

export const adminCreateNotice = async (payload) => {
  const { data } = await api.post(`/admin/notices`, payload);
  return data;
};

export const adminUpdateNotice = async (id, payload) => {
  const { data } = await api.patch(`/admin/notices/${id}`, payload);
  return data?.notice;
};

export const adminDeleteNotice = async (id) => {
  const { data } = await api.delete(`/admin/notices/${id}`);
  return !!data?.ok;
};