import React from 'react';
import { useNavigate } from 'react-router-dom';
import userService from '../../services/userService';
import './MyProfile.css';

const MyProfile = ({ login }) => {
  const navigate = useNavigate();

  if (!login) return null;

  const { profileImage, email, address, roles, role } = login;
  
  const displayName = //표시될 이름 지정
  // (login.name && login.name.trim()) ||
  (login.nickname && login.nickname.trim()) ||
  login.userId ||
  login.email;

  //사용자 권한 표시 (관리자,일반 사용자 등)
  // ✅ role(단일)과 roles(배열) 둘 다 고려해서 관리자 우선 표기
  const isAdmin =
    role === 'admin' ||
    (Array.isArray(roles) && roles.includes('admin'));
  const rolesText = isAdmin
    ? 'admin'
    : (Array.isArray(roles) && roles.length ? roles.join(', ') : (roles || 'user'));

  const handleDeleteAccount = async () => {
  if (!window.confirm("정말 탈퇴하시겠습니까? 탈퇴 후 복구가 불가능합니다.")) return;

  try {
    await userService.deleteMe(); // 서버에서 계정 삭제
    alert("계정이 성공적으로 삭제되었습니다.");

    // ✅ accessToken 제거
    localStorage.removeItem("accessToken");

    // ✅ 로그인 상태 초기화
    window.location.href = "/login"; // or navigate("/login");
  } catch (err) {
    console.error("회원 탈퇴 오류:", err);
    alert("회원 탈퇴 중 문제가 발생했습니다.");
  }
};


  return (
    <div className="myprofile-card">
      <img src={profileImage || '/img/profile-placeholder.png'} alt="프로필 사진" 
      style={{
        width:'160px',height:'160px',borderRadius:'50%',objectFit:'cover',marginBottom:'20px'
      }}/>
      <h2 className='profile-nickname'>{displayName || '-'}</h2>
      <div className="profile-info">
          <div className="profile-info-item">
          <span className="profile-label">이메일</span>
          <span className="profile-value">{email || '-'}</span>
        </div>
          <div className="profile-info-item">
          <span className="profile-label">주 소</span>
          <span className="profile-value">{address || '-'}</span>
        </div>
          <div className="profile-info-item">
          <span className="profile-label">권 한</span>
          <span className="profile-value">{rolesText}</span>
        </div>
      </div>
      <div className="button-group">
        <button onClick={() => navigate('/mypage/edit')}>정보 수정</button>
        <button onClick={handleDeleteAccount}>회원 탈퇴</button>
      </div>
    </div>
  );
};

export default MyProfile;
