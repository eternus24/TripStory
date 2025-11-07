// TripStorySearch.js (실시간 검색 버전)
import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { searchStories } from "../../assets/api/tripStoryApi";
import StoryCard from "./StoryCard";

const SearchContainer = styled.div`
  padding: 30px;
  background: #f8fafc;
  min-height: 100vh;
`;

const SearchBox = styled.div`
  max-width: 600px;
  margin: 0 auto 40px;
  display: flex;
  gap: 12px;
`;

const SearchInput = styled.input`
  flex: 1;
  padding: 12px 16px;
  border: 2px solid #cbd5e1;
  border-radius: 10px;
  font-size: 1rem;
  transition: border-color 0.2s ease;

  &:focus {
    outline: none;
    border-color: #4f46e5;
  }
`;

const SearchButton = styled.button`
  padding: 12px 24px;
  background: #4f46e5;
  color: white;
  border: none;
  border-radius: 10px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s ease;

  &:hover {
    background: #3730a3;
  }

  &:disabled {
    background: #94a3b8;
    cursor: not-allowed;
  }
`;

const ResultsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 24px;
  margin-top: 30px;
`;

const NoResults = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: #64748b;
  font-size: 1.1rem;
`;

const SearchInfo = styled.p`
  text-align: center;
  color: #64748b;
  margin-bottom: 20px;
  font-size: 0.95rem;
`;

function TripStorySearch({ user }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  // ✅ 실시간 검색 (500ms 딜레이)
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setSearched(false);
      return;
    }

    const timer = setTimeout(() => {
      handleSearch();
    }, 500); // 타이핑 멈춘 후 0.5초 뒤 검색

    return () => clearTimeout(timer);
  }, [query]);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setSearched(true);
    try {
      const data = await searchStories(query);
      setResults(data);
    } catch (err) {
      console.error('검색 실패:', err);
      alert('검색에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <SearchContainer>
      <h2 style={{ textAlign: 'center', marginBottom: '30px', color: '#1e293b' }}>
        🔍 여행 스토리 검색
      </h2>
      
      <SearchBox>
        <SearchInput
          type="text"
          placeholder="지역, 제목, 내용으로 검색... (실시간 검색)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={handleKeyPress}
        />
        <SearchButton 
          onClick={handleSearch}
          disabled={loading}
        >
          {loading ? '검색 중...' : '검색'}
        </SearchButton>
      </SearchBox>

      {/* ✅ 검색 중 표시 */}
      {loading && (
        <SearchInfo>🔄 검색 중...</SearchInfo>
      )}

      {/* ✅ 검색 결과 */}
      {searched && !loading && (
        <>
          {results.length > 0 ? (
            <>
              <SearchInfo>
                "{query}" 검색 결과: {results.length}개의 스토리
              </SearchInfo>
              <ResultsGrid>
                {results.map((story) => (
                  <StoryCard 
                    key={story._id} 
                    story={story} 
                    user={user} 
                  />
                ))}
              </ResultsGrid>
            </>
          ) : (
            <NoResults>
              "{query}" 검색 결과가 없습니다 😢
              <br />
              <small>다른 키워드로 검색해보세요</small>
            </NoResults>
          )}
        </>
      )}
    </SearchContainer>
  );
}

export default TripStorySearch;