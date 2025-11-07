// src/services/adminStatsService.js — 2025-10-28
import api from '../assets/api/index';

const adminStatsService = {
  // 기존 기능 유지
  getTodayVisitors: () => api.get('/admin-stats/today-visitors').then(r => r.data),
  getLast7Days:     () => api.get('/admin-stats/last7days').then(r => r.data),
  getTotalUsers:    () => api.get('/admin-stats/total-users').then(r => r.data),
  getMasterCount:   () => api.get('/admin-stats/master-count').then(r => r.data),

  // ✅ 추가: 스탬프 등급 분포
  getStampStats:    () => api.get('/admin-stats/stamp-stats').then(r => r.data),
};

export default adminStatsService;