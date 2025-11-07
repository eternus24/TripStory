// TripStoryDetail.js (수정본)
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styled from "styled-components";
import { getStory } from "../../assets/api/tripStoryApi";
import TripStoryComments from "./TripStoryComments";
import LikeButton from "./LikeButton";
import { updateStory, deleteStory } from "../../assets/api/tripStoryApi";

const Container = styled.div`
  max-width: 900px;
  margin: 0 auto;
  padding: 40px 20px;
  background: #f8fafc;
  min-height: 100vh;
`;

const BackButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  color: #475569;
  cursor: pointer;
  margin-bottom: 24px;
  transition: background 0.2s ease;

  &:hover {
    background: #f1f5f9;
  }
`;

const Card = styled.div`
  background: white;
  border-radius: 18px;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08);
  overflow: hidden;
`;

const HeroImage = styled.img`
  width: 100%;
  height: 500px;
  object-fit: cover;
`;

const WebtoonImage = styled.img`
  width: 100%;
  object-fit: cover;
  margin-bottom: 10px;
`;

const Content = styled.div`
  padding: 32px;
`;

const Title = styled.h1`
  font-size: 2rem;
  color: #1e293b;
  margin: 0 0 16px;
`;

const Meta = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
  font-size: 0.9rem;
  color: #64748b;
`;

const Badge = styled.span`
  background: #f1f5f9;
  padding: 4px 12px;
  border-radius: 16px;
  color: #475569;
  font-weight: 500;
`;

const StoryText = styled.div`
  font-size: 1.1rem;
  line-height: 1.8;
  color: #334155;
  margin-bottom: 32px;
  white-space: pre-wrap;
`;

const InteractionBar = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px 0;
  border-top: 1px solid #e2e8f0;
  border-bottom: 1px solid #e2e8f0;
  margin-bottom: 24px;
`;

const Loading = styled.div`
  text-align: center;
  padding: 60px 20px;
  font-size: 1.2rem;
  color: #64748b;
`;

const ErrorMessage = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: #dc2626;
  font-size: 1.1rem;
`;

function TripStoryDetail({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [story, setStory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

    // ✅ 이미지 경로 자동 보정 함수 (Feed와 동일)
  const getImageUrl = (url) => {
    if (!url) return '/img/noimage.png';
    if (url.startsWith('http')) return url;
    return `${process.env.REACT_APP_API_URL || 'http://localhost:8080'}${url}`;
  };

  // ✅ 수정
  const handleEdit = async () => {
    const newTitle = prompt('새 제목을 입력하세요', story.title);
    if (!newTitle) return;
    try {
      await updateStory(story._id, { title: newTitle });
      alert('✅ 스토리가 수정되었습니다.');
      const updated = await getStory(story._id);
      setStory(updated);
    } catch (err) {
      console.error(err);
      alert('❌ 수정 실패');
    }
  };

  // ✅ 삭제
  const handleDelete = async () => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;
    try {
      await deleteStory(story._id);
      alert('🗑 스토리가 삭제되었습니다.');
      navigate('/tripstory/feed');
    } catch (err) {
      console.error(err);
      alert('❌ 삭제 실패');
    }
  };

  // ✅ 작성자 확인 함수 (개선됨)
  const isAuthor = () => {
    if (!user || !story) return false;
    
    const userId = (user._id || user.id)?.toString();
    const authorId = story.author?._id 
      ? story.author._id.toString() 
      : story.author?.toString();
    
    return userId === authorId;
  };

  useEffect(() => {
    const loadStory = async () => {
      try {
        setLoading(true);
        const data = await getStory(id);
        setStory(data);
      } catch (err) {
        console.error('스토리 로드 실패:', err);
        setError('스토리를 불러올 수 없습니다.');
      } finally {
        setLoading(false);
      }
    };

    loadStory();
  }, [id]);

  if (loading) {
    return (
      <Container>
        <Loading>
          <div>📖 스토리를 불러오는 중...</div>
        </Loading>
      </Container>
    );
  }

  if (error || !story) {
    return (
      <Container>
        <ErrorMessage>
          <div>😢 {error || '스토리를 찾을 수 없습니다.'}</div>
          <BackButton onClick={() => navigate('/tripstory/feed')}>
            ← 목록으로 돌아가기
          </BackButton>
        </ErrorMessage>
      </Container>
    );
  }

  return (
    <Container>
      <BackButton onClick={() => navigate('/tripstory/feed')}>
        ← 목록으로
      </BackButton>

      <Card>
        {story.imageUrls && story.imageUrls.length > 0 ? (
          <div>
            {story.imageUrls.map((url, index) => (
              <WebtoonImage key={index} src={getImageUrl(url)} alt={`${story.title} - cut ${index + 1}`} />
            ))}
          </div>
        ) : (
          <HeroImage src={getImageUrl(story.imageUrl || story.image_url)} alt={story.title} />
        )}
        
        <Content>
          <Title>{story.title}</Title>
          
          <Meta>
            <Badge>📍 {story.region}</Badge>
            <Badge>✨ {story.mood}</Badge>
            {story.keywords && story.keywords.length > 0 && (
              <span>🏷️ {story.keywords.join(', ')}</span>
            )}
          </Meta>

          <StoryText>{story.content}</StoryText>

          <InteractionBar>
            <LikeButton 
              storyId={story._id} 
              initialLikes={story.likes || []} 
              user={user} 
            />
            <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
              {story.createdAt && new Date(story.createdAt).toLocaleDateString('ko-KR')}
            </span>

            {/* ✅ 작성자 본인만 수정/삭제 버튼 표시 (개선됨) */}
            {isAuthor() && (
              <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px' }}>
                <button
                  onClick={handleEdit}
                  style={{
                    padding: '6px 12px',
                    background: '#facc15',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                  }}
                >
                  ✏ 수정
                </button>

                <button
                  onClick={handleDelete}
                  style={{
                    padding: '6px 12px',
                    background: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                  }}
                >
                  🗑 삭제
                </button>
              </div>
            )}
          </InteractionBar>

          {/* 댓글 섹션 */}
          <TripStoryComments storyId={story._id} user={user} />
        </Content>
      </Card>
    </Container>
  );
}

export default TripStoryDetail;