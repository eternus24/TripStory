import React from 'react';

const TravelSiteCard = ({ site, isExpanded, onToggle }) => {
  const handleLinkClick = (e) => {
    e.preventDefault();
    window.open(site.link, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className={`site-card ${isExpanded ? 'expanded' : ''}`}>
      {/* 헤더 */}
      <div className="site-card-header">
        <span className="site-icon">{site.icon}</span>
        <h3 className="site-name">{site.siteName}</h3>
        <span className="category-badge">{site.category}</span>
      </div>

      {/* 평점 */}
      <div className="site-rating">
        <span className="stars">⭐</span>
        <span className="rating-number">{site.rating}</span>
        {site.reviewCount && (
          <span className="review-count">(사용자 {site.reviewCount.toLocaleString()}명 평가)</span>
        )}
      </div>

      {/* 설명 + 추천 */}
      <div className="description-recommend-box">
        <div className="description-section">
          <p>💡 {site.description}</p>
          <hr/>
          <strong>추천:</strong> {site.recommendFor}
        </div>
      </div>

      {/* 주요 혜택 */}
      {site.benefits && (
        <div className="benefits-box">
          <span className="benefit-icon">🎁</span>
          <strong>주요 혜택:</strong>
          <p>{site.benefits}</p>
        </div>
      )}

      {/* 특징 태그 */}
      {site.features && site.features.length > 0 && (
        <div className="features-section">
          <div className="feature-tags">
            {site.features.map((feature, index) => (
              <span key={index} className="feature-tag">
                {feature}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 지역 정보 */}
      <div className="region-info">
        <span className="region-icon">🌏</span>
        <span>
          {site.regionScope || '전국'} / 주요지역: {site.regions.join(', ')}
        </span>
      </div>

      {/* 토글 버튼 */}
      <button className="toggle-button" onClick={onToggle}>
        {isExpanded ? '간략히 보기 ▲' : '자세히 보기 ▼'}
      </button>

      {/* 장단점 (펼쳤을 때만 표시) */}
      {isExpanded && (
        <div className="pros-cons-section">
          <div className="pros-section">
            <h4 className="section-title">✅ 장점</h4>
            <ul className="pros-list">
              {site.pros.map((pro, index) => (
                <li key={index}>{pro}</li>
              ))}
            </ul>
          </div>

          <div className="cons-section">
            <h4 className="section-title">⚠️ 단점</h4>
            <ul className="cons-list">
              {site.cons.map((con, index) => (
                <li key={index}>{con}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* 바로가기 버튼 */}
      <div className="site-card-footer">
        <button className="visit-button" onClick={handleLinkClick}>
          🔗 바로가기
        </button>
      </div>
    </div>
  );
};

export default TravelSiteCard;
