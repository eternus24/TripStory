// 관리자 승인 페이지
import React from "react";
import approvalService from "../services/approvalService";
import './AdminApproval.css';
import { useState } from "react";
import { useEffect } from "react";

const AdminApproval = ({onTripUpdate}) =>{
    const [selectedTrip, setSelectedTrip] = useState(null);//사용자:클릭한 승인요청 카드확인
    const [loading, setLoading] = useState(false);//서버 통신 (승인,거부 처리)
    
    const [showImageModal, setShowImageModal] = useState(false);//이미지 확대모달
    const [selectedImage, setSelectedImage] = useState('');//확대해서 보여줄 이미지 url경로

    const [pendingList, setPendingList] = useState([]);//관리자:승인 대기 여행 목록
    const [showRejectModal, setShowRejectModal] = useState(false);//관리자:거부 사유 입력 모달창
    const [rejectReason, setRejectReason] = useState('');//관리자:입력한 거부 사유

    const [showDetailModal,setShowDetailModal] = useState(false)//상세 보기 모달
    const [detailTrip,setDetailTrip] = useState(null)
    
    // 지역 이모지
    const getRegionEmoji = (location) => {
    const emojiMap = {
      '서울특별시': '🏙️', '부산광역시': '🌊', '제주특별자치도': '🏝️', '강원도': '⛰️',
      '경기도': '🏘️', '인천광역시': '✈️', '대전광역시': '🌆', '광주광역시': '🎨',
      '대구광역시': '🍎', '울산광역시': '🏭', '세종특별자치시': '🏛️', '충청북도': '🌳',
      '충청남도': '🌾', '전라북도': '🍚', '전라남도': '🦐', '경상북도': '🏰', '경상남도': '🌸'
    }
    return emojiMap[location] || '📍';
  }

  //날짜 포멧
  const formatDate = (dateStr) =>{
    if(!dateStr) return '-'//유효성 검사
    try{
        const d = new Date(dateStr)//날짜 객체 변환
        return `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')}`//연도(4자리).월.일.순서
    }catch{
        return dateStr
    }
  }
  //승인 대기 목록 불러오기
  const fetchPendingList = async() => {
    setLoading(true)
    try{
        const data = await approvalService.getPendingList()
        setPendingList(data)
    }catch(err){
        console.error('승인 대기 목록 불러오기 실패: ',err)
        alert('승인 대기 목록을 불러오는데 실패했습니다.')
    }finally{
        setLoading(false)
    }
  }
  useEffect(()=>{
    fetchPendingList()
  },[])

  //이미 선택한 카드인지 구분하기 위해 id사용
  const handleTripClick = (trip) => {
    setDetailTrip(trip)
    setShowDetailModal(true)
  }

  //이미지 확대
  const handleImageClick = (imageUrl) =>{
    setSelectedImage(imageUrl)
    setShowImageModal(true)
  }

  // ========== 승인 및 거부 처리 누를 경우 사용자에게도 값 반환! ==========
  // 여행 승인 처리
const handleApprove = async (trip) => {
  if (!window.confirm(`'${trip.title}' 여행을 승인하시겠습니까?`)) return;

  try {
    await approvalService.approveTrip(trip._id)
    alert('✅ 여행 승인이 완료되었습니다.')//단순 관리자 확인용 알림
    
    //상세 모달 닫기
    setShowDetailModal(false)
    setDetailTrip(null)
    //승인 대기 목록 새로고침
    await fetchPendingList()

  } catch (error) {
    console.error('승인 처리 실패:', error);
    alert('승인 처리에 실패했습니다.');
  }
};
  //거부 모달 열기
  const openRejectModal = (trip) => {
    setSelectedTrip(trip)
    setRejectReason('')
    setShowDetailModal(false)//상세 모달 닫기
    setShowRejectModal(true)
  }

  //거부 처리
  const handleReject = async() => {
    if(!rejectReason.trim()){
        alert('거부 사유를 입력해주세요')
        return
    }
    try{
        await approvalService.rejectTrip(selectedTrip._id,rejectReason)
        alert('거부처리가 완료되었습니다. 사용자에게 알림이 전송됩니다.')
        setPendingList(prev=>prev.filter(t => t._id !== selectedTrip._id))
        setShowRejectModal(false)
        setSelectedTrip(null)
        setRejectReason('')
    }catch(err){
        console.error('거부 처리 실패: ',err)
        alert('거부 처리에 실패했습니다.')
    }
  }

  return (
    <div className="admin-approval-container">
        {/* 헤더 부분 */}
        <div className="approval-header">
            <h2 className="approval-title">🔔 여행 승인 관리</h2>
            <div className="approval-badge">
                대기 중 : {pendingList.length}건
            </div>
        </div>
        {/* 로딩 */}
        {loading && (
            <div style={{textAlign:'center',padding:'40px',color:'#6b7a90'}}>
                불러오는 중...
            </div>
        )}
        {/* 빈 상태 */}
        {!loading && pendingList.length === 0 && (
            <div className="approval-empty">
                <div className="approval-empty-icon">📭</div>
                <p className="approval-empty-text">현재 승인 대기 중인 여행이 없습니다.</p>
            </div>
        )}
{/* ============ 카드 클릭 시 상세 모달 표시 ============ */}
        {!loading && pendingList.length > 0 && (
            <div className="approval-grid">
                {pendingList.map((trip)=>(
                    <div key={trip._id} className='approval-card' onClick={()=>handleTripClick(trip)}>
                        {/* 카드 헤더 */}
                        <div className="approval-card-header">
                            <div className="approval-user-info">
                                👤 {trip.userId}
                            </div>
                            <div className="approval-date">
                                {formatDate(trip.createdAt)}
                            </div>
                        </div>

                        {/* 지역 */}
                        <div className="approval-location">
                            {getRegionEmoji(trip.location)} {trip.location}
                        </div>

                        {/* 제목 */}
                        <h4 className="approval-card-title">{trip.title}</h4>
                        
                        {/* 날짜 */}
                        <p style={{color:'#757575',fontSize:'0.9em',marginBottom:'12px'}}>📅 {trip.date}</p>

                        {/* 내용 미리보기 */}
                        {trip.content && (
                            <p className="approval-content">{trip.content}</p>
                        )}

                        {/* 해시태그 */}
                        {trip.hashtags && trip.hashtags.length > 0 && (
                            <div className="approval-hashtags">
                                {trip.hashtags.map((tag,idx)=>(
                                    <span key={idx} className="approval-hashtag">
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        )}

        {/* ============ 추가: 승인 대기 여행 상세보기 모달 ============ */}
        {showDetailModal && detailTrip && (
            <div className='modal-overlay' onClick={() => setShowDetailModal(false)}>
                <div className='approval-detail-modal-content' onClick={(e) => e.stopPropagation()}>
                    <div className='approval-detail-modal-header'>
                        <h3>🔍 여행 승인 상세</h3>
                        <button className='modal-close' onClick={() => setShowDetailModal(false)}>×</button>
                    </div>
                    <div className='approval-detail-modal-body'>
                        {/* 사용자 정보 */}
                        <div className='approval-detail-user'>
                            <span className='user-icon'>👤</span>
                            <span className='user-id'>{detailTrip.userId}</span>
                            <span className='submit-date'>제출일: {formatDate(detailTrip.createdAt)}</span>
                        </div>

                        {/* 지역 */}
                        <div className='approval-detail-location'>
                            {getRegionEmoji(detailTrip.location)} {detailTrip.location}
                        </div>

                        {/* 제목 */}
                        <h2 className='approval-detail-title'>{detailTrip.title}</h2>
                        
                        {/* 날짜 */}
                        <p className='approval-detail-date'>📅 {detailTrip.date}</p>

                        {/* 내용 */}
                        {detailTrip.content && (
                            <div className='approval-detail-content'>
                                <h4>💭 여행 내용</h4>
                                <p>{detailTrip.content}</p>
                            </div>
                        )}

                        {/* 해시태그 */}
                        {detailTrip.hashtags && detailTrip.hashtags.length > 0 && (
                            <div className='approval-detail-hashtags'>
                                <h4>🏷️ 해시태그</h4>
                                <div className='approval-hashtags'>
                                    {detailTrip.hashtags.map((tag, idx) => (
                                        <span key={idx} className='approval-hashtag'>
                                            #{tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* 증빙자료 */}
                        <div className='approval-detail-proof-section'>
                            <h4>📎 증빙자료</h4>
                            <img 
                                src={detailTrip.proofImage} 
                                alt="증빙자료" 
                                className='approval-detail-proof-image' 
                                onClick={(e) => {
                                    e.stopPropagation()
                                    handleImageClick(detailTrip.proofImage)
                                }}
                            />
                        </div>

                        {/* 액션 버튼 */}
                        <div className='approval-detail-actions'>
                            <button className='btn-approve' onClick={(e) => {
                                e.stopPropagation()
                                handleApprove(detailTrip)
                            }}>
                                ✅ 승인하기
                            </button>
                            <button className='btn-reject' onClick={(e)=>{
                                e.stopPropagation()
                                openRejectModal(detailTrip)
                            }}>
                                ❌ 거부하기
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* 이미지 확대 모달 */}
        {showImageModal && (
            <div className="image-modal-overlay" onClick={()=>setShowImageModal(false)}>
                <div className="image-modal-content" onClick={(e)=>e.stopPropagation()}>
                    <button className="image-modal-close" onClick={()=>setShowImageModal(false)}>×</button>
                    <img src={selectedImage} alt="증빙자료 확대"/>
                </div>
            </div>
        )}

        {/* 거부 사유 입력 */}
        {showRejectModal && (
            <div className="reject-modal-overlay" onClick={()=>setShowRejectModal(false)}>
                <div className="reject-modal-content" onClick={(e)=>e.stopPropagation()}>
                    <div className="reject-modal-header">거부 사유 입력</div>
                    <textarea 
                        className="reject-modal-textarea" 
                        value={rejectReason} 
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="증빙자료가 부적합한 이유를 입력해주세요.&#10;예: 영수증이 불명확합니다. 날짜가 일치하지 않습니다 등"
                    />
                    <div className="reject-modal-actions">
                        <button className="btn-reject-cancel" onClick={()=>setShowRejectModal(false)}>
                            취소
                        </button>
                        <button className="btn-reject-confirm" onClick={handleReject}>
                            거부하기
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
    )
    }

export default AdminApproval