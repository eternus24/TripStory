// src/services/userService.js — 통합본 (profileImage 일관, 멀티파트 업로드 포함)
import api from '../assets/api/index'; // 공용 axios 인스턴스(401→/auth/refresh 재시도)

// NOTE:
// - /auth/update : JSON 수정 (이름/닉네임/이메일/주소/비번 등)
// - /auth/updateFile : multipart/form-data (프로필 이미지 업로드 + 선택 필드 동시 수정)
//   - 파일 필드명: "upload"  ← 백엔드 routers/auth.js와 일치

const userService = {
  // 내 정보 조회
  async getUser() {
    const { data } = await api.get('/auth/me');
    return data.user;
  },

  // 텍스트 기반 정보 수정 (JSON)
  async updateMe(payload) {
    const { data } = await api.put('/auth/update', payload);
    return data.user;
  },

  // 이미지 포함 수정 (multipart/form-data)
  // payload: { name?, nickname?, email?, address?, password? }
  // file: File | Blob | undefined
  async updateFile(payload = {}, file) {
    const formData = new FormData();
    if (payload.name !== undefined) formData.append('name', payload.name);
    if (payload.nickname !== undefined) formData.append('nickname', payload.nickname);
    if (payload.email !== undefined) formData.append('email', payload.email);
    if (payload.address !== undefined) formData.append('address', payload.address);
    if (payload.password) formData.append('password', payload.password);
    if (file) formData.append('upload', file); // ← 백엔드와 필드명 일치

    const { data } = await api.put('/auth/updateFile', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.user;
  },

  // 로그아웃 (refresh 쿠키 제거)
  async logout() {
    const { data } = await api.post('/auth/logout');
    return data;
  },

  // 계정 삭제 (백엔드에 /auth/delete 라우터가 있어야 함)
  async deleteMe() {
    const { data } = await api.delete('/auth/delete');
    return data;
  },
};

export default userService;