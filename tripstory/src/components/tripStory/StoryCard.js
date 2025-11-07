// StoryCard.js (최적화 버전 - 댓글 컴포넌트 제거)
import React from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import LikeButton from "./LikeButton";

const Card = styled.div`
  position: relative;
  border-radius: 18px;
  overflow: hidden;
  background: #fff;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  cursor: pointer;

  &:hover {
    transform: translateY(-6px);
    box-shadow: 0 8px 18px rgba(0, 0, 0, 0.12);
  }
`;

const Image = styled.img`
  width: 100%;
  height: 260px;
  object-fit: cover;
`;

const Info = styled.div`
  padding: 18px 20px;

  h3 {
    margin: 0 0 10px;
    font-size: 1.2rem;
    color: #1e293b;
  }

  p {
    font-size: 0.95rem;
    color: #475569;
    line-height: 1.6;
    margin-bottom: 12px;
  }

  span {
    font-size: 0.85rem;
    color: #64748b;
  }
`;

const MetaRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #f1f5f9;
`;

const CommentCount = styled.span`
  font-size: 0.85rem;
  color: #64748b;
  display: flex;
  align-items: center;
  gap: 4px;
`;

function StoryCard({ story, user }) {
  const navigate = useNavigate();

  const handleCardClick = (e) => {
    // 좋아요 버튼 클릭 시 상세 페이지 이동 방지
    if (e.target.tagName === 'BUTTON' || e.target.closest('button')) {
      return;
    }
    navigate(`/tripstory/${story._id}`);
  };

  
  // ✅ 이미지 경로 자동 보정 함수
  const getImageUrl = (url) => {
    if (!url) return '/img/noimage.png';
    if (url.startsWith('http')) return url;
    return `${process.env.REACT_APP_API_URL || 'http://localhost:8080'}${url}`;
  };

  return (
    <Card onClick={handleCardClick}>
      <Image
        src={getImageUrl((story.imageUrls && story.imageUrls.length > 0) ? story.imageUrls[0] : (story.imageUrl || story.image_url))}
        alt={story.title}
      />
      <Info>
        <h3>{story.title}</h3>
        <span>{story.region} · {story.mood}</span>
        <p>{story.content.slice(0, 120)}...</p>
        
        <MetaRow>
          {/* 좋아요 버튼 */}
          <LikeButton 
            storyId={story._id} 
            initialLikes={story.likes || []} 
            user={user} 
          />

          {/* 댓글 개수만 표시 (API 호출 없이) */}
          <CommentCount>
            💬 {story.comments?.length || 0}개의 댓글
          </CommentCount>
        </MetaRow>
      </Info>
    </Card>
  );
}

export default StoryCard;