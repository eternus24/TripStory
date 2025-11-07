import React, { useState, useEffect } from 'react';
import TravelSiteCard from './TravelSiteCard';
import travelSitesData from '../../assets/api/travelSites.json';
import './TravelSite.css';

const TravelSiteList = () => {
  const [sites, setSites] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('전체');
  const [expandedIds, setExpandedIds] = useState(() => new Set()); // ✅ 여러 개 동시 확장

  useEffect(() => {
    setSites(travelSitesData);
    const unique = ['전체', ...new Set(travelSitesData.map(s => s.category))];
    setCategories(unique);
  }, []);

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    const next = (category === '전체')
      ? travelSitesData
      : travelSitesData.filter(s => s.category === category);
    setSites(next);

    // 필터 후에도 보이는 카드만 유지 (보이지 않는 카드 id는 제거)
    setExpandedIds(prev => {
      const kept = new Set();
      const visibleIds = new Set(next.map(s => s._id));
      prev.forEach(id => { if (visibleIds.has(id)) kept.add(id); });
      return kept;
    });
  };

  const toggleExpand = (id) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="travel-site-container">
      <div className="travel-site-header">
        <h1>💰 여행 사이트 모음</h1>
        <p className="subtitle">여행 준비에 필요한 모든 사이트를 한곳에!</p>
      </div>

      <div className="category-nav">
        {categories.map((category) => (
          <button
            key={category}
            className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
            onClick={() => handleCategoryChange(category)}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="sites-grid">
        {sites.length > 0 ? (
          sites.map((site) => (
            <TravelSiteCard
              key={site._id}
              site={site}
              isExpanded={expandedIds.has(site._id)}   // ✅ 여러 장 동시 확장
              onToggle={() => toggleExpand(site._id)}  // ✅ 개별 토글
            />
          ))
        ) : (
          <div className="no-results">
            <p>해당 카테고리에 사이트가 없습니다</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TravelSiteList;
