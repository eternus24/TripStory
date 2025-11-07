import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './EditProfile.css';
import userService from '../../services/userService';

const EditProfile = ({current,onUpdate}) => {//사용자 수정 페이지
//current:현재 사용자 정보객체, onupdate:프로필 수정완료 시 실행함수
    
    const navigate = useNavigate()

    const [user,setUser] = useState({
      userId:'',
      name:'',
      password:'',
      email:'',
      nickname:'',
      address:'',
      profileImage: '/image/profile-placeholder.png'//기본 파일 이미지
    })

    //선택한 파일
    const [selectedFile, setSelectedFile] = useState(null)

    //미리보기 이미지
    const [previewImage,setPreviewImage] = useState('/image/profile-placeholder.png')
  
    //current가 없을 경우 /auth/me로 사용자 정보 가져오기
    useEffect(() => {
      window.scrollTo(0,0)//스크롤 항상 맨위 배치!
      const fetchUser = async() => {
        try{
        const fetched = await userService.getUser()

        setUser({
          userId: fetched.userId || '',
          name: fetched.name || '',
          password: '',
          email: fetched.email || '',
          nickname: fetched.nickname || '',
          address: fetched.address || '',
          profileImage: fetched.profileImage|| '/image/profile-placeholder.png'
        });

        //기존 프로필 이미지 미리보기 설정
        setPreviewImage(fetched.profileImage || '/image/profile-placeholder.png' )

      } catch (err) {
        console.error('사용자 정보 불러오기 실패:', err);
        alert('사용자 정보를 불러올 수 없습니다. 다시 로그인해주세요.');
        navigate('/login');
      }
    }

    if (current) {
      setUser({
        userId: current.userId || '',
        name: current.name || '',
        password: '',
        email: current.email || '',
        nickname: current.nickname || '',
        address: current.address || '',
        profileImage: current.profileImage || '/image/profile-placeholder.png'
      });
      setPreviewImage(current.profileImage || '/image/profile-placeholder.png')
    } else {
      fetchUser()
    }
  }, [current, navigate])
   
    // 입력 변경
    const changeInput = (evt) => {
      const { name, value } = evt.target;
    setUser((prev) => ({ ...prev, [name]: value }));
  };

  //파일 선택
  const handleFileChange = (evt) => {
    const file = evt.target.files[0]//선택한 파일
    
    if(file) {
      //파일 크기 
      if(file.size >5 * 1024 *1024){
        alert('파일 크기는 5MB 이하 권장')
        return
      }
      //이미지 파일 형식
      const allowedTypes = ['image/jpeg','image/png','image/gif']
      if(!allowedTypes.includes(file.type)){
        alert('이미지 파일만 업로드 가능합니다. (jpg,png,gif)')
        return
      }
      setSelectedFile(file)

      //미리보기 이미지 생성
      const reader = new FileReader()
      reader.onloadend = ()=> {
        setPreviewImage(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  // 수정 취소 버튼 클릭 시
  const cancelEdit = ()=>{
    if(window.confirm('수정을 취소하시겠습니까? 변경 내용은 저장되지 않습니다.')){
      navigate('/mypage/main')
    }
  }

  //프로필 수정 요청
  const onSubmit = async (evt) => {
    evt.preventDefault();

      try{
        let updateUser

        //파일이 선택되었는지 확인
        if(selectedFile){
          updateUser = await userService.updateFile(
            {
              name: user.name,
              nickname : user.nickname,
              email: user.email,
              address: user.address,
              password: user.password || undefined
            },
            selectedFile//파일 객체 전달
          )
        }else{
          //파일이 없을 경우 기존 update 사용
          updateUser = await userService.updateMe({
            email: user.email,
            nickname: user.nickname,
            address: user.address,
            password: user.password || undefined
          })
        }
        alert('프로필이 성공적으로 수정되었습니다.');
        if (onUpdate) onUpdate(updateUser)
        navigate('/mypage/main');
      } catch (err) {
        console.error('프로필 수정 오류:', err);
        alert('프로필 수정 중 오류가 발생했습니다.');
      }
  }

    return (
    <div className="editprofile-wrapper">
      <div className="editprofile-card">
        <h2>프로필 수정</h2>

{/* 프로필 사진 미리보기 */}
      <div style={{textAlign:'center', marginBottom:'20px'}}>
        <img src={previewImage} alt='프로필 미리보기' 
        style={{
          width:'150px',height:'150px',borderRadius:'50%',objectFit:'cover',border:'3px solid #ddd'}}/>
      </div>
{/* 파일 업로드  */}
      <div className='form-group'>
        <label>프로필 사진</label>
        <div className='profile-upload-wrapper'>
          <input type='file' id='profileImage' accept='image/*' onChange={handleFileChange} className='profile-file-input'/>
        <small className='file-hint'>이미지 파일만 가능(최대 5MB)</small>
        </div>
      </div>

      {/* ✏️ 사용자 수정 폼 */}
      <form className="editprofile-form" onSubmit={onSubmit}>
        {/* 아이디 (읽기 전용) */}
        <div className="form-group">
          <label>사용자 ID</label>
          <input type="text" name="userId" value={user.userId} readOnly />
        </div>

      {/* 이름 */}
      <div className="form-group">
        <label>이름</label>
        <input name="name" value={user.name} onChange={changeInput} />
      </div>

      {/* 비밀번호 */}
      <div className="form-group">
        <label>비밀번호</label>
        <input type="password" name="password" value={user.password} onChange={changeInput}
          placeholder="변경 시에만 입력" />
      </div>

      {/* 이메일 */}
      <div className="form-group">
        <label>이메일</label>
        <input type="email" name="email" value={user.email} onChange={changeInput} />
      </div>

      {/* 별명 */}
      <div className="form-group">
        <label>별명</label>
        <input type="text" name="nickname" value={user.nickname} onChange={changeInput} />
      </div>
      
      {/* 주소 */}
      <div className="form-group">
        <label>주소</label>
        <input type="text" name="address" value={user.address} onChange={changeInput} />
      </div>

      {/* 버튼 */}
      <div className="button-area">
        <button type="submit" className="btn-primary">수 정 완 료 </button>
        <button type="button" className="btn-secondary" onClick={cancelEdit}>수 정 취 소</button>
      </div>
    </form>
    </div>
  </div>
  );
};

export default EditProfile;