import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import ImageGenerateModal from './Imagegeneratemodal';

// ===================================
// 🎨 Styled Components
// ===================================

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease;

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

const ModalContainer = styled.div`
  background: white;
  border-radius: 20px;
  padding: 40px 35px;
  width: 90%;
  max-width: 700px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  animation: slideUp 0.3s ease;
  position: relative;

  @keyframes slideUp {
    from { 
      opacity: 0;
      transform: translateY(30px);
    }
    to { 
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* 스크롤바 스타일 */
  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 10px;
  }

  &::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 10px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: 20px;
  right: 20px;
  background: none;
  border: none;
  font-size: 28px;
  color: #94a3b8;
  cursor: pointer;
  transition: color 0.2s;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    color: #64748b;
  }
`;

const Title = styled.h2`
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 10px;
`;

const Subtitle = styled.p`
  font-size: 14px;
  color: #64748b;
  margin-bottom: 30px;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: #94a3b8;

  .icon {
    font-size: 64px;
    margin-bottom: 20px;
  }

  .text {
    font-size: 16px;
    margin-bottom: 10px;
  }

  .subtext {
    font-size: 14px;
    color: #cbd5e1;
  }
`;

const LoadingState = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: #64748b;
  font-size: 16px;
  animation: pulse 1.5s ease-in-out infinite;

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`;

const TripList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const TripCard = styled.div`
  background: ${props => props.$selected ? '#eef2ff' : '#f8fafc'};
  border: 2px solid ${props => props.$selected ? '#6366f1' : '#e2e8f0'};
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: #6366f1;
    transform: translateX(4px);
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.1);
  }
`;

const TripHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: start;
  margin-bottom: 12px;
`;

const TripTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
  flex: 1;
`;

const SelectBadge = styled.div`
  background: #6366f1;
  color: white;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
`;

const TripMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 12px;
  font-size: 14px;
  color: #64748b;

  span {
    display: flex;
    align-items: center;
    gap: 4px;
  }
`;

const TripContent = styled.p`
  font-size: 14px;
  color: #475569;
  line-height: 1.6;
  margin: 0 0 12px 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const TripTags = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;

const Tag = styled.span`
  background: #e0e7ff;
  color: #4f46e5;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #e2e8f0;
`;

const Button = styled.button`
  flex: 1;
  padding: 14px 20px;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;

  ${props => props.$primary ? `
    background: #4f46e5;
    color: white;

    &:hover {
      background: #4338ca;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
    }

    &:disabled {
      background: #94a3b8;
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
    }
  ` : `
    background: #f1f5f9;
    color: #475569;

    &:hover {
      background: #e2e8f0;
    }
  `}
`;

// ===================================
// 🎒 MyTripSelectModal Component
// ===================================

function MyTripSelectModal({ onClose, user, trips = [] }) {
  // ✅ trips를 props로 받음 (여행기록 담당자가 전달)
  const [loading, setLoading] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);

  // 여행기록 선택
  const handleSelectTrip = (trip) => {
    setSelectedTrip(trip);
  };

  // 이미지 생성하기
  const handleGenerateImage = () => {
    if (!selectedTrip) {
      alert('여행기록을 선택해주세요.');
      return;
    }
    setShowImageModal(true);
  };

  // ImageGenerateModal 닫기
  const handleCloseImageModal = () => {
    setShowImageModal(false);
    onClose(); // 선택 모달도 함께 닫기
  };

  return (
    <>
      {/* 여행기록 선택 모달 */}
      {!showImageModal && (
        <Overlay onClick={onClose}>
          <ModalContainer onClick={(e) => e.stopPropagation()}>
            <CloseButton onClick={onClose}>×</CloseButton>
            
            <Title>🎒 내 여행기록 선택</Title>
            <Subtitle>이미지로 만들고 싶은 여행기록을 선택하세요</Subtitle>

            {loading ? (
              <LoadingState>
                🔄 여행기록을 불러오는 중...
              </LoadingState>
            ) : trips.length === 0 ? (
              <EmptyState>
                <div className="icon">🧳</div>
                <div className="text">아직 기록된 여행이 없습니다</div>
                <div className="subtext">먼저 여행기록을 작성해보세요!</div>
              </EmptyState>
            ) : (
              <>
                <TripList>
                  {trips.map(trip => (
                    <TripCard
                      key={trip._id}
                      $selected={selectedTrip?._id === trip._id}
                      onClick={() => handleSelectTrip(trip)}
                    >
                      <TripHeader>
                        <TripTitle>{trip.title}</TripTitle>
                        {selectedTrip?._id === trip._id && (
                          <SelectBadge>✓ 선택됨</SelectBadge>
                        )}
                      </TripHeader>

                      <TripMeta>
                        <span>📍 {trip.location}</span>
                        <span>📅 {trip.date}</span>
                      </TripMeta>

                      {trip.content && (
                        <TripContent>{trip.content}</TripContent>
                      )}

                      {trip.hashtags && trip.hashtags.length > 0 && (
                        <TripTags>
                          {trip.hashtags.map((tag, idx) => (
                            <Tag key={idx}>#{tag}</Tag>
                          ))}
                        </TripTags>
                      )}
                    </TripCard>
                  ))}
                </TripList>

                <ButtonGroup>
                  <Button onClick={onClose}>취소</Button>
                  <Button 
                    $primary 
                    onClick={handleGenerateImage}
                    disabled={!selectedTrip}
                  >
                    🎨 이미지 생성하기
                  </Button>
                </ButtonGroup>
              </>
            )}
          </ModalContainer>
        </Overlay>
      )}

      {/* 이미지 생성 모달 */}
      {showImageModal && selectedTrip && (
        <ImageGenerateModal
          tripData={selectedTrip}
          user={user}
          onClose={handleCloseImageModal}
        />
      )}
    </>
  );
}

export default MyTripSelectModal;