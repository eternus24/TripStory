import React, { useState, useEffect } from 'react';
import './TravelStamp.css';
import { useNavigate,useLocation } from 'react-router-dom';
import stampService from '../../services/stampService';

/* props : initialStamps: Array | null (부모의 스탬프 목록)
mode: 'summary'(마이페이지) | 'full' (스탬프 전용페이지)*/

const TravelStamp = ({mode = 'full',initialStamps=null,refetchKey,onStampUdate}) => {
  const [stamps, setStamps] = useState(initialStamps || []);//사용자가 획득한 스탬프 목록(배열)
  const [selectedRegion, setSelectedRegion] = useState(null);//선택한 지역 정보 임시저장
  const [showModal, setShowModal] = useState(false);//스탬프 획득 여부

  const [visitCount,setVisitCount] = useState({})//지역별 방문 횟수
  const [userGrade,setUserGrade] = useState(null)//사용자 등급
  const [showGradeModal,setShowGradeModal] = useState(false)//등급 정보 모달
  const [showStampDetailModal,setShowStampDetailModal] = useState(false)//sum모드에서 스탬프 상세

  const navigate = useNavigate();
  const location = useLocation();

  // 지역 데이터
  const regions = [
    { id: 1, name: '서울특별시', emoji: '🏙️', color: '#ffb4cdff' },
    { id: 2, name: '부산광역시', emoji: '🌊', color: '#4ECDC4' },
    { id: 3, name: '대구광역시', emoji: '🍎', color: '#ff9a6be3' },
    { id: 4, name: '인천광역시', emoji: '✈️', color: '#95E1D3' },
    { id: 5, name: '광주광역시', emoji: '🎨', color: '#FFE66D' },
    { id: 6, name: '대전광역시', emoji: '🌆', color: '#A8E6CF' },
    { id: 7, name: '울산광역시', emoji: '🏭', color: '#FF8B94' },
    { id: 8, name: '세종특별자치시', emoji: '🏛️', color: '#C7CEEA' },
    { id: 9, name: '경기도', emoji: '🏘️', color: '#B4E7CE' },
    { id: 10, name: '강원도', emoji: '⛰️', color: '#A0CED9' },
    { id: 11, name: '충청북도', emoji: '🌳', color: '#ADF7B6' },
    { id: 12, name: '충청남도', emoji: '🌾', color: '#FCF5C7' },
    { id: 13, name: '전라북도', emoji: '🍚', color: '#FFC09F' },
    { id: 14, name: '전라남도', emoji: '🦐', color: '#FFAAA5' },
    { id: 15, name: '경상북도', emoji: '🏰', color: '#C4A8FF' },
    { id: 16, name: '경상남도', emoji: '🌸', color: '#FFD3DE' },
    { id: 17, name: '제주특별자치도', emoji: '🏝️', color: '#7FCDCD' }
  ];

  const gradeInfo = [
    {level:0, name:'여행 새싹', color:'#9e9e9e',icon:'🌱'},
    {level:1,name:'여행 탐험가',color:'#4caf50', icon:'🌿'},
    {level:2,name:'여행 마스터',color:'#2196f3',icon:'⭐'},
    {level:3,name:'여행 전문가',color:'#9c27b0',icon:'👑'},
    {level:4,name:'여행 레전드',color:'#ffd700',icon:'🏆'}
  ]
  // 컴포넌트 마운트 시 동작:
  //부모가 initialStamps를 주지 않았다면(=스탬프 전용 페이지일 때) 서버에서 가져온다.
  //부모가 initialStamps를 준다면(=MyPage 요약) 그것을 그대로 사용한다.

  //렌더링 될때 실행 (내가 획득한 스탬프 목록)
  useEffect(() => {
    window.scrollTo(0,0)//스크롤 항상 맨위 배치!
    if (!initialStamps) {//initialStamps가 없으면(full 모드나 독립 페이지) 서버에서 가져옴
      fetchStamps();//스탬프, 방문횟수, 등급
      fetchVisitCount();
      fetchUserGrade();
    } else {//initialStamps (사용자 획득 스탬프)
      setStamps(initialStamps);// 부모가 준 initialStamps가 바뀔 때 반영
    }// initialStamps가 바뀌면 다시 실행되도록 dependency에 포함
  }, [initialStamps,refetchKey]);

  //이동 시 모달 자동 열기
  useEffect(()=>{
    if(location.state?.openGradeModal){
      setShowGradeModal(true)//자동으로 모달 창 띄움

      //뒤로 가기 할 경우 뜨지 않게 state초기화
      navigate('/mypage/stamp',{replace:true})
    }

    if(location.state?.triggerRefetch){
      fetchVisitCount()
      fetchStamps()
      fetchUserGrade()
      navigate('/mypage/stamp',{replace:true})
    }
  },[location.state,navigate])

  // ========== 사용자가 이미 획득한 스탬프 목록 ==========
  const fetchStamps = async () => {
    try {
      const data = await stampService.getStamps()
      setStamps(data)
    }catch(error){
      console.error('스탬프 불러오기 실패:',error)
    }
}
  // ========== 지역별 방문 횟수 ==========
  const fetchVisitCount = async()=>{
    try{
      const data = await stampService.getVisitCount()
      setVisitCount(data)
    }catch(error){
      console.error('방문 횟수 불러오기 실패:',error)
    }
  }
  // ========== 사용자 등급 ==========
  const fetchUserGrade = async()=>{
    try{
      const data = await stampService.getUserGrade()
      setUserGrade(data)
    }catch(error){
      console.error('등급 조회 실패: ',error)
    }
  }
    
  //주어진 지역 이름이 목록에 있는지 확인 
  const hasStamp = (regionName) => stamps.some(stamp => stamp.location === regionName)
  //특정 지역의 방문 횟수 공식
  const getVisitCount = (regionName) => visitCount[regionName] || 0
  //사용자가 지역카드를 클릭할 경우
  const handleRegionClick = (region) => {
    setSelectedRegion(region)//데이터 저장
    if(mode==='summary'){//요약(summary)모드에서 지역카드 클릭 시 상세페이지 이동
      navigate('/mypage/stamp')
      return
    }
    setShowModal(true)//호출하여, 모달창 띄움
  }

  //스탬프 획득 요청(post 요청)
  const handleAddStamp = async() => {
    if(!selectedRegion) return //스탬프 추가는 상세 페이지에서 가능
    if(hasStamp(selectedRegion.name)){
      alert('이미 획득한 스탬프입니다.')
      return
    }
    //방문 횟수가 5회 미만일 경우 안내문구
    const currentCount = getVisitCount(selectedRegion.name)
    if(currentCount<5){
      alert(`${selectedRegion.name}을(를) ${5-currentCount}번 더 방문해야 스탬프를 획득할 수 있습니다.`)
      return
    }

  try{//스탬프 추가 요청 보내기
    const payload = {
        location:selectedRegion.name,//선택한 지역정보 저장
        regionCode: selectedRegion.id.toString(),//지역코드
        date: new Date().toISOString().split('T')[0]//스탬프 기록 날짜, T는 날짜 시간 분리
    }

    const result = await stampService.addStamp(payload)
    if(!result.error){//성공 시 : 최신목록 불러오기, 모달창 닫기, 알림 표시
      await fetchStamps()
      await fetchUserGrade()
      setShowModal(false)
      alert(`${selectedRegion.name} 스탬프를 획득했습니다! 🎉`);
      onStampUdate?.()
    }else{
      alert(result.message)
      }
    } catch(error){
      console.error('스탬프 추가 실패: ',error)
      alert('스탬프 추가에 실패하였습니다.')
    }
  }

  //최근 스탬프 클릭 시 Mytrip으로 이동
  const handleStampClick = (location)=>{
    navigate('/mypage/mytrip', {state:{filterLocation:location}})
  }

  //달성률 계산 (획득한 스탬프 수 / 전체 지역 수) * 100
  const completionRate = Math.round((stamps.length / regions.length) * 100)

  return ( //jsx - 실제 화면 구조
//============ 상단 제목 부분 ============
// summary : 마이페이지 내 보여지는 간단한 카드 / full : 전체지역카드 + 모달
  <div className="travel-stamp-no-map mypage-section-card">
    <div className="stamp-header-nm">
    <div className="header-content-nm">
      <h2 className="stamp-title-nm">나의 여행 스탬프</h2>
      <p className="stamp-subtitle-nm">🚀 전국 17개 시·도를 여행하고 스탬프를 모아보세요!</p>
    </div>
  </div>

{/* ============ 달성률 부분 ============ */}
  <div className="stamp-stats-nm">
    <div className="stat-card-nm progress-stat">
      <div className="progress-circle-nm">
{/* 원 그래프 달성률 표시 - 내부 숫자는 %로 표시 */}
        <svg width="120" height="120" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="54" fill="none" stroke="#E3F2FD" strokeWidth="8" />
          <circle
                cx="60" cy="60" r="54" fill="none" stroke="url(#gradient)" strokeWidth="8"
                strokeDasharray={`${completionRate * 3.39} 339`}
                strokeLinecap="round"
                transform="rotate(-90 60 60)"
                className="progress-bar-nm"
              />
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1976D2" />
              <stop offset="100%" stopColor="#64B5F6" />
            </linearGradient>
          </defs>
        </svg>
        <div className="progress-text-nm">
          <div className="progress-number-nm">{completionRate}%</div>
          <div className="progress-label-nm">달성률</div>
        </div>
      </div>
    </div>
{/* ============ 획득 스탬프 갯수 ============ */}
    <div className="stat-card-nm" onClick={() => mode === 'summary' ? setShowStampDetailModal(true) : null} style={{cursor: mode === 'summary' ? 'pointer' : 'default'}}>
        <div className="stat-icon-nm">🎯</div>
        <div className="stat-info-nm">
          <div className="stat-number-nm">{stamps.length}</div>
          <div className="stat-label-nm">나의 스탬프</div>
        </div>
      </div>
    {/* summary모드에서도 등급 모달 표시 */}
    <div className='stat-card-nm grade-card' onClick={()=> navigate('/mypage/stamp',{state:{openGradeModal:true}})} style={{cursor:'pointer'}}>
          <div className='stat-icon-nm' style={{fontSize:'2rem'}}>
            {userGrade?.currentGrade?.icon ||'🌱'}
          </div>
          <div className='stat-info-nm'>
            <div className='stat-number-nm' style={{
              color:userGrade?.currentGrade?.color || '#9e9e9e',
              fontSize: '1rem'}}>
              {userGrade?.currentGrade?.name || '여행 새싹'}
            </div>
            <div className='stat-label-nm'>사용자 등급</div>
          </div>
        </div>
      </div>

{/* ============ summary 모드일 경우 간단한 항목만 확인가능 - 제한된 항목 ============ */}
{mode === 'summary' ? (
  <>
    <button className="btn-empty-add" onClick={() => navigate('/mypage/stamp')}>
      📸 스탬프 추가 / 전체 스탬프 </button>
  </>
    ):(
      <>
{/* ============ 지역 카드 목록 - stamp 페이지 ============ */}
  <div className="regions-grid-nm">
      {regions.map(region => {
        const isStamped = hasStamp(region.name);
        const visitCount = getVisitCount(region.name);
        return (
          <div key={region.id}
//해당 영역이 true일 경우 색상 강조
          className={`region-card-nm ${isStamped ? 'stamped' : ''} ${visitCount >= 5 && !isStamped ? 'ready' : ''}`}
//클릭할 경우 모달창 열림
          onClick={() => handleRegionClick(region)}
          style={{
            '--region-color': region.color,
            '--region-color-light': region.color + '20'
          }}>
          <div className="region-emoji-nm">{region.emoji}</div>
          <div className="region-name-nm">{region.name}</div>
          <div className='visit-count-badge'>{visitCount}/5</div>
          {isStamped && (
            <div className="stamp-badge-nm">
              <span className="check-mark-nm">✓</span>
            </div>
          )}
          <div className="region-overlay-nm">
            <span className="click-text-nm">
              {isStamped ? '획득 완료!' : visitCount >= 5 ? '클릭하여 획득' : `${5-visitCount}회 더 필요`}
            </span>
          </div>
        </div>
      );
    })}
  </div>

{/* ============ 최근 획득한 스탬프 (아직 결과 미확인!!!!) ============ */}
{/* 지역/이름 날짜 표시 - 최근 5개만 표시 */}
  {stamps.length > 0 && (
      <div className="recent-stamps-nm">
        <h3 className="recent-title-nm">최근 획득한 스탬프</h3>
        <div className="recent-grid-nm">
          {stamps.slice(0, 5).map(stamp => {const region = regions.find(r => r.name === stamp.location);
            return (
              <div key={stamp._id} className="recent-stamp-item-nm" onClick={() => handleStampClick(stamp.location)}style={{cursor: 'pointer'}}>
                <div className="recent-emoji-nm">{region?.emoji || '📍'}</div>
                <div className="recent-info-nm">
                  <div className="recent-location-nm">{stamp.location}</div>
                  <div className="recent-date-nm">{stamp.date}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    )}

{/* true값일 경우에만 화면 보임 */}
  {showModal && (
    <div className="modal-overlay-nm" onClick={() => setShowModal(false)}>
      <div className="modal-content-nm" onClick={e => e.stopPropagation()}>
        <div className="modal-region-icon-nm">{selectedRegion?.emoji}</div>
        <h3 className="modal-title-nm">{selectedRegion?.name}</h3>
        {hasStamp(selectedRegion?.name) ? (
          <div className="modal-completed-nm">
            <div className="completed-icon-nm">✓</div>
            <p className="modal-text-nm">이미 획득한 스탬프입니다!</p>
            <p className="stamp-date-info-nm">
              {stamps.find(s => s.location === selectedRegion?.name)?.date}
            </p>
          </div>
        ) : (
          <>
          <div className='modal-visit-info'>
            <p className='modal-visit-count'>
              현재 방문 횟수 : <strong>{getVisitCount(selectedRegion?.name)}/5</strong>
            </p>
          </div>
          {getVisitCount(selectedRegion?.name) >=5 ? (
            <>
            <p className='modal-text-nm'>
              축하합니다!<br/>{selectedRegion?.name}의 스탬프를 획득할 수 있습니다.
            </p>
            <button className="btn-confirm-nm" onClick={handleAddStamp}>
              🎉 스탬프 획득하기
            </button>
          </>
          ):(
            <p className="modal-text-nm">
              {5-getVisitCount(selectedRegion?.name)}번 더 여행하시면, <br/>스탬프를 획득할 수 있습니다.
            </p>
          )}
          </>
        )}
        <button className="btn-cancel-nm" onClick={() => setShowModal(false)}>
          닫기
        </button>
      </div>
    </div>
  )}

  {/* ===== 하단 버튼 ===== */}
    <div style={{display:'flex', gap:'10px', marginTop:'20px'}}>
      <button className='btn-empty-add2' onClick={() => navigate('/mypage/main')} style={{flex:1}}>
        나의 정보
      </button>
    </div>
  </>
  )}

{/* ========== summary용 스템프 상세 모달 ========== */}
{showStampDetailModal && mode === 'summary' && (
    <div className='modal-overlay-nm' onClick={()=>setShowStampDetailModal(false)}>
      <div className='modal-content-nm' onClick={e=>e.stopPropagation()}>
        <h3 className='modal-title-nm'>최근 획득한 스탬프</h3>
        <div className='recent-grid-nm' style={{marginTop:'20px'}}>
          {stamps.slice(0, 5).map(stamp => {
            const region = regions.find(r => r.name === stamp.location);
            return (
              <div key={stamp._id} className='recent-stamp-item-nm'>
                <div className='recent-emoji-nm'>{region?.emoji || '📍'}</div>
                <div className='recent-info-nm'>
                  <div className='recent-location-nm'>{stamp.location}</div>
                  <div className='recent-date-nm'>{stamp.date}</div>
                </div>
              </div>
            );
          })}
        </div>
        <button className='btn-cancel-nm' onClick={()=>setShowStampDetailModal(false)} style={{marginTop:'20px'}}>
          닫기
        </button>
      </div>
    </div>
  )}

{/* ============ 사용자 등급 안내문 ============ */}
  {showGradeModal && (
        <div className='modal-overlay-nm' onClick={()=>setShowGradeModal(false)}>
          <div className='modal-content-nm grade-modal' onClick={e=>e.stopPropagation()}>
            <h3 className='modal-title-nm'>사용자 등급 안내</h3>
            <div className='current-grade-info'>
              <div className='grade-icon-large' style={{color:userGrade?.currentGrade?.color}}>
                {userGrade?.currentGrade?.icon}
              </div>
              <h4 style={{color:userGrade?.currentGrade?.color}}>
                {userGrade?.currentGrade?.name}
              </h4>
              <p> 현재 스탬프: {userGrade?.stampCount}개</p>
              {userGrade?.nextGradeStamps && (
                <p className='next-grade-info'>
                  다음 등급까지 {userGrade.nextGradeStamps - userGrade.stampCount}개 필요
                </p>
              )}
            </div>
            <div className='grade-list'>
              {gradeInfo.map(grade =>(
                <div key={grade.level} className={`grade-item ${userGrade?.currentGrade?.level===grade.level? 'current' :''}`}>
                  <span className='grade-icon' style={{color:grade.color}}>{grade.icon}</span>
                  <span className='grade-name'>{grade.name}</span>
                </div>
              ))}
            </div>
            <button className='btn-cancel-nm' onClick={()=>setShowGradeModal(false)}>
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TravelStamp;