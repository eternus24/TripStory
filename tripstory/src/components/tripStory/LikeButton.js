// LikeButton.js (수정본 - ObjectId 비교 개선)
import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { toggleLike } from "../../assets/api/tripStoryApi";

const Button = styled.button`
  background: none;
  border: none;
  color: ${props => props.$liked ? '#e11d48' : '#94a3b8'};
  cursor: pointer;
  font-size: 1rem;
  transition: transform 0.2s ease;
  display: flex;
  align-items: center;
  gap: 4px;

  &:hover {
    transform: scale(1.15);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
`;

function LikeButton({ storyId, initialLikes = [], user }) {
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(0);

  // 초기 좋아요 상태 설정 - 수정됨
  useEffect(() => {
    if (user && initialLikes) {
      // ✅ ObjectId 비교를 위해 toString() 사용
      const userId = (user._id || user.id)?.toString();
      const isLiked = initialLikes.some(id => 
        (typeof id === 'object' ? id.toString() : id) === userId
      );
      setLiked(isLiked);
      setCount(initialLikes.length);
    } else if (initialLikes) {
      setCount(initialLikes.length);
    }
  }, [initialLikes, user]);

  const handleLike = async (e) => {
    // ✅ 이벤트 버블링 방지 (StoryCard 클릭 이벤트와 충돌 방지)
    e.stopPropagation();
    
    if (!user) {
      alert("로그인 후 이용하세요");
      return;
    }

    try {
      const { liked: newLiked, likeCount } = await toggleLike(storyId);
      setLiked(newLiked);
      setCount(likeCount);
    } catch (err) {
      console.error('좋아요 처리 실패:', err);
      alert('좋아요 처리에 실패했습니다.');
    }
  };

  return (
    <Button 
      onClick={handleLike} 
      $liked={liked}
    >
      {liked ? '❤️' : '🤍'} {count > 0 && count}
    </Button>
  );
}

export default LikeButton;