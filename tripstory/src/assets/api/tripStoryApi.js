// ================================
// 📁 /assets/api/tripStoryApi.js
// ✅ React proxy 기반 완전형 (토큰 자동 포함 + 자동 재시도 + 로그 표시)
// ================================

import axios from 'axios';

// ✅ axios 인스턴스 생성
// React의 package.json에 "proxy": "http://localhost:8080" 이 설정되어 있어야 합니다.
const api = axios.create({
  baseURL: '/api/tripstory', // ✅ proxy를 통해 자동으로 8080으로 라우팅됨
  withCredentials: true,  // ✅ 쿠키 기반 refresh 토큰 포함
  timeout: 120000,
});

// ==================================================
// 📤 요청 인터셉터 - 매 요청마다 토큰 자동 추가
// ==================================================
api.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem('token') ||
      localStorage.getItem('accessToken');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log(`📤 [요청] ${config.method?.toUpperCase()} ${config.url} → 토큰 포함 ✅`);
    } else {
      console.warn(`⚠️ [요청] ${config.method?.toUpperCase()} ${config.url} → 토큰 없음`);
    }

    return config;
  },
  (error) => {
    console.error('❌ [요청 인터셉터 오류]', error);
    return Promise.reject(error);
  }
);

// ==================================================
// 🔄 응답 인터셉터 - 401 발생 시 자동 토큰 갱신
// ==================================================
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

async function refreshToken() {
  console.log('📡 [토큰 갱신 요청] POST /auth/refresh');
  const res = await api.post('/auth/refresh', {});
  const newToken = res.data?.accessToken || res.data?.token;
  if (!newToken) throw new Error('새 토큰을 받지 못했습니다.');
  localStorage.setItem('token', newToken);
  localStorage.setItem('accessToken', newToken);
  console.log('✅ [토큰 갱신 성공] 새로운 토큰 저장 완료');
  return newToken;
}

api.interceptors.response.use(
  (response) => {
    console.log(`✅ [응답 성공] ${response.config.method?.toUpperCase()} ${response.config.url} (${response.status})`);
    return response;
  },
  async (error) => {
    const original = error.config;

    if (!error.response || error.response.status !== 401 || original._retry || original.url.includes('/auth/refresh')) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      console.log('⏳ [대기열 추가] 다른 요청이 토큰 갱신 중...');
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          console.log('🔁 [재시도] 대기 중이던 요청 재실행:', original.url);
          return api(original);
        })
        .catch((err) => Promise.reject(err));
    }

    original._retry = true;
    isRefreshing = true;

    try {
      const newToken = await refreshToken();
      processQueue(null, newToken);
      original.headers.Authorization = `Bearer ${newToken}`;
      console.log('🔁 [재시도] 원래 요청 재실행:', original.url);
      return api(original);
    } catch (refreshError) {
      processQueue(refreshError, null);
      console.error('🚨 [토큰 갱신 실패]', refreshError.message);
      localStorage.removeItem('token');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      alert('로그인이 만료되었습니다. 다시 로그인해주세요.');
      window.location.href = '/login';
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

// ==================================================
// 🧩 API 함수 모음
// ==================================================

// ✅ AI 스토리 생성
export const getAiStory = async ({ title, region, mood, keywords }) => {
  console.log('🚀 [getAiStory] 호출:', { title, region, mood, keywords });
  const res = await api.post(`/ai/story`, { title, region, mood, keywords });
  console.log('✅ [getAiStory] 완료:', res.data);
  return res.data;
};

// ✅ 전체 스토리 목록
export const fetchStories = async () => {
  console.log('📋 [fetchStories] 호출');
  const res = await api.get(`/all`);
  console.log('✅ [fetchStories] 완료:', res.data.length, '개');
  return res.data;
};

// ✅ 단일 스토리 조회
export const getStory = async (id) => {
  console.log('📖 [getStory] 호출:', id);
  const res = await api.get(`/${id}`);
  console.log('✅ [getStory] 완료');
  return res.data;
};

// ✅ 스토리 검색
export const searchStories = async (query) => {
  console.log('🔍 [searchStories] 호출:', query);
  const res = await api.get(`/search`, { params: { q: query } });
  console.log('✅ [searchStories] 완료:', res.data.length, '개');
  return res.data;
};

// ✅ 댓글 작성
export const addComment = async (storyId, commentData) => {
  console.log('💬 [addComment] 호출:', storyId, commentData);
  const res = await api.post(`/${storyId}/comment`, commentData);
  console.log('✅ [addComment] 완료');
  return res.data;
};

// ✅ 댓글 목록
export const fetchComments = async (storyId) => {
  console.log('💬 [fetchComments] 호출:', storyId);
  const res = await api.get(`/${storyId}/comments`);
  console.log('✅ [fetchComments] 완료:', res.data.length, '개');
  return res.data;
};

// ✅ 댓글 수정
export const updateComment = async (storyId, commentId, updateData) => {
  console.log("✏️ [updateComment] 호출:", storyId, commentId, updateData);
  const res = await api.put(`/${storyId}/comment/${commentId}`, updateData);
  console.log("✅ [updateComment] 완료:", res.data);
  return res.data;
};

// ✅ 댓글 삭제
export const deleteComment = async (storyId, commentId) => {
  console.log("🗑️ [deleteComment] 호출:", storyId, commentId);
  const res = await api.delete(`/${storyId}/comment/${commentId}`);
  console.log("✅ [deleteComment] 완료");
  return res.data;
};

// ✅ 좋아요 토글
export const toggleLike = async (storyId) => {
  console.log('❤️ [toggleLike] 호출:', storyId);
  const res = await api.post(`/${storyId}/like`);
  console.log('✅ [toggleLike] 완료:', res.data);
  return res.data;
};

// ✅ 스토리 수정
export const updateStory = async (storyId, updateData) => {
  console.log('✏️ [updateStory] 호출:', storyId, updateData);
  const res = await api.put(`/${storyId}`, updateData);
  console.log('✅ [updateStory] 완료');
  return res.data;
};

// ✅ 스토리 삭제
export const deleteStory = async (storyId) => {
  console.log('🗑️ [deleteStory] 호출:', storyId);
  const res = await api.delete(`/${storyId}`);
  console.log('✅ [deleteStory] 완료');
  return res.data;
};

export default {
  getAiStory,
  fetchStories,
  getStory,
  searchStories,
  addComment,
  fetchComments,
  toggleLike,
  updateStory,
  deleteStory,
};
