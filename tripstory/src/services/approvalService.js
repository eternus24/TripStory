import api from '../assets/api/index';        // 유저용 (baseURL :8080, /auth/* 토큰)
import { http as adminHttp } from '../assets/api/admin'; // 관리자 전용 (필요한 곳에서만 사용)
// admin에서 해당 경로 파악 (변동x)

const approvalService = {
  // 제출(유저)
  async submitTrip(payload) {
    const { data } = await api.post('/approval/submit', payload);
    return data;
  },

  // 내 승인 대기/완료/거부 목록(유저)
  async getMyPending() {
    const { data } = await api.get('/approval/myPending');
    return data;
  },

  // 거부된 항목 재전송 전에 기존 거부건 삭제(유저)
  async deleteRejectedTrip(id) {
    const { data } = await api.delete(`/approval/rejected/${id}`);
    return data;
  },

  // ===== 아래 두 개는 "관리자 화면" 전용 =====
  //관리자: 승인 대기 목록 전체 조회
  async getPendingList() {
    const { data } = await adminHttp.get('/approval/pendingList');
    return data;
  },
  
  async approveTrip(id) {
    const { data } = await adminHttp.post(`/approval/approve/${id}`);
    return data;
  },

  async rejectTrip(id, reason) {
    const { data } = await adminHttp.post(`/approval/reject/${id}`, { reason });
    return data;
  },
};

export default approvalService;
