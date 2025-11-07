import React from 'react';
import './Festival.css';

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

export default FestivalCard;