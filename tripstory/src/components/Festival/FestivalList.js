import React, { useState, useEffect } from 'react';
import './Festival.css';
import festival from '../../assets/image/festival.jpg';

const FestivalCard = ({ festival }) => {
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="festival-card">
      <div className="festival-image">
        <img
          src={festival.imageUrl || 'https://via.placeholder.com/400x250?text=Festival'}
          alt={festival.title}
          loading="lazy"
        />
        <span className="festival-category-badge">{festival.category}</span>
      </div>

      <div className="festival-content">
        <h3 className="festival-title">{festival.title}</h3>
        <div className="festival-info">
          <p>📍 {festival.location}</p>
          <p>🗓️ {formatDate(festival.startDate)} ~ {formatDate(festival.endDate)}</p>
        </div>
        <p className="festival-description">{festival.description}</p>

        <div className="festival-extra">
          <p>📞 {festival.contact || '정보 없음'}</p>
          <p>🎟️ {festival.admission || '무료'}</p>
        </div>

        {festival.website && (
          <a
            href={festival.website}
            target="_blank"
            rel="noopener noreferrer"
            className="festival-link"
          >
            🔗 공식 사이트 바로가기 →
          </a>
        )}
      </div>
    </div>
  );
};

function FestivalList() {
  const [festivals, setFestivals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('불꽃축제');

  // ✅ 백엔드 API 주소
  const API_BASE = 'http://localhost:8080';

  useEffect(() => {
    const loadFestivals = async () => {
      setLoading(true);
      setError(null);

      try {
        // ✅ 백엔드 API 호출
        const url = `${API_BASE}/api/festivals/category/${encodeURIComponent(selectedCategory)}`;
        
        console.log('🔍 요청 URL:', url);

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        console.log('📡 응답 상태:', response.status);

        if (!response.ok) {
          throw new Error(`서버 응답 오류: ${response.status}`);
        }

        // Content-Type 확인
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          console.error('❌ 잘못된 Content-Type:', contentType);
          throw new Error('JSON 형식이 아닌 응답을 받았습니다.');
        }

        const result = await response.json();
        console.log('✅ 응답 데이터:', result);

        if (!result.success) {
          throw new Error(result.message || '데이터를 불러오는데 실패했습니다.');
        }

        // 날짜순 정렬 (최신순)
        const sorted = result.data.sort(
          (a, b) => new Date(b.startDate) - new Date(a.startDate)
        );
        
        setFestivals(sorted);
        
      } catch (err) {
        console.error('❌ 축제 데이터 로딩 오류:', err);
        setError(err.message || '축제 데이터를 불러오지 못했습니다.');
      } finally {
        setLoading(false);
      }
    };

    loadFestivals();
  }, [selectedCategory]);

  const categories = [
    '불꽃축제',
    '꽃축제',
    '빛 축제',
    '먹거리 축제',
    '음악·공연 축제',
    '체험형 축제'
  ];

  if (loading) {
    return (
      <div className="festival-loading-container">
        <div className="festival-loading-spinner"></div>
        <p>축제 정보를 불러오는 중입니다...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="festival-error-container">
        <p>⚠️ {error}</p>
        <button
          onClick={() => window.location.reload()}
          className="festival-retry-btn"
        >
          다시 시도
        </button>
      </div>
    );
  }

  return (
<div className="festival-container">
  <header className="festival-header">
    
    <h1>
      <img src={festival} alt="축제" style={{height:55}}/>
      &nbsp;전국 축제 정보&nbsp;
      <img src={festival} alt="축제" style={{height:55}}/>
    </h1>
    <p>여행 전 꼭 확인해야 할 대표 축제 모음</p>
  </header>

      <div className="festival-category-filter">
        {categories.map((category) => (
          <button
            key={category}
            className={`festival-category-btn ${
              selectedCategory === category ? 'active' : ''
            }`}
            onClick={() => setSelectedCategory(category)}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="festival-grid">
        {festivals.length === 0 ? (
          <div className="festival-no-data">
            <p>등록된 축제가 없습니다.</p>
          </div>
        ) : (
          festivals.map((festival, idx) => (
            <FestivalCard key={festival._id || festival.id || idx} festival={festival} />
          ))
        )}
      </div>
    </div>
  );
}

export default FestivalList;