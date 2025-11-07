// AiTripInput.js - 입력 섹션 컴포넌트
import React from 'react';
import { FaMapMarkerAlt, FaMagic, FaExclamationCircle, FaPalette, FaCalendarAlt, FaUsers, FaWonSign, FaCar } from 'react-icons/fa';
import {
  Card, SectionHeader, SectionTitle,
  InputContainer, Input, Button, Spinner,
  ErrorBox, PopularSection, PopularLabel,
  PopularButtons, PopularButton,
  FilterSection, FilterGroup, FilterLabel,
  FilterOptions, FilterOption
} from './AiTripInputCss';

function AiTripInput({ 
  region, 
  setRegion, 
  onGenerate, 
  isLoading, 
  error,
  filters,
  setFilters
}) {
  const popularRegions = ['부산', '제주도', '강릉', '경주', '전주', '여수'];

  const filterOptions = {
    style: [
      { value: 'healing', label: '🏖️ 휴양/힐링' },
      { value: 'activity', label: '🏃 액티비티' },
      { value: 'culture', label: '📸 관광/문화' },
      { value: 'food', label: '🍽️ 맛집 투어' }
    ],
    duration: [
      { value: 'day', label: '당일치기' },
      { value: '1night', label: '1박 2일' },
      { value: '2nights', label: '2박 3일' },
      { value: '3nights', label: '3박 4일+' }
    ],
    people: [
      { value: '1', label: '1명' },
      { value: '2', label: '2명' },
      { value: '3-4', label: '3-4명' },
      { value: '5+', label: '5명 이상' }
    ],
    budget: [
      { value: 'low', label: '10만원 이하' },
      { value: 'mid', label: '10-30만원' },
      { value: 'high', label: '30-50만원' },
      { value: 'luxury', label: '50만원+' }
    ],
    transport: [
      { value: 'public', label: '🚇 대중교통' },
      { value: 'car', label: '🚗 자가용/렌트카' }
    ]
  };

  const handleFilterChange = (category, value) => {
    setFilters(prev => ({
      ...prev,
      [category]: prev[category] === value ? null : value
    }));
  };

  return (
    <Card>
      <SectionHeader>
        <FaMapMarkerAlt color="#9333ea" size={24} />
        <SectionTitle>어디로 떠나시나요?</SectionTitle>
      </SectionHeader>

      <InputContainer>
        <Input
          type="text"
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && onGenerate()}
          placeholder="예: 부산, 제주도, 강릉"
          disabled={isLoading}
        />
        <Button onClick={onGenerate} disabled={!region.trim() || isLoading}>
          {isLoading ? (
            <>
              <Spinner />
              생성중...
            </>
          ) : (
            <>
              <FaMagic size={16} />
              AI 추천받기
            </>
          )}
        </Button>
      </InputContainer>

      {error && (
        <ErrorBox>
          <FaExclamationCircle size={20} />
          {error}
        </ErrorBox>
      )}

      <PopularSection>
        <PopularLabel>🔥 인기 여행지</PopularLabel>
        <PopularButtons>
          {popularRegions.map((r) => (
            <PopularButton
              key={r}
              onClick={() => setRegion(r)}
              disabled={isLoading}
            >
              {r}
            </PopularButton>
          ))}
        </PopularButtons>
      </PopularSection>

      {/* 필터 옵션 */}
      <FilterSection>
        {/* 여행 스타일 */}
        <FilterGroup>
          <FilterLabel>
            <FaPalette size={14} />
            여행 스타일
          </FilterLabel>
          <FilterOptions>
            {filterOptions.style.map(option => (
              <FilterOption
                key={option.value}
                $active={filters.style === option.value}
                onClick={() => handleFilterChange('style', option.value)}
                disabled={isLoading}
              >
                {option.label}
              </FilterOption>
            ))}
          </FilterOptions>
        </FilterGroup>

        {/* 여행 기간 */}
        <FilterGroup>
          <FilterLabel>
            <FaCalendarAlt size={14} />
            여행 기간
          </FilterLabel>
          <FilterOptions>
            {filterOptions.duration.map(option => (
              <FilterOption
                key={option.value}
                $active={filters.duration === option.value}
                onClick={() => handleFilterChange('duration', option.value)}
                disabled={isLoading}
              >
                {option.label}
              </FilterOption>
            ))}
          </FilterOptions>
        </FilterGroup>

        {/* 인원수 */}
        <FilterGroup>
          <FilterLabel>
            <FaUsers size={14} />
            인원수
          </FilterLabel>
          <FilterOptions>
            {filterOptions.people.map(option => (
              <FilterOption
                key={option.value}
                $active={filters.people === option.value}
                onClick={() => handleFilterChange('people', option.value)}
                disabled={isLoading}
              >
                {option.label}
              </FilterOption>
            ))}
          </FilterOptions>
        </FilterGroup>

        {/* 예산 */}
        <FilterGroup>
          <FilterLabel>
            <FaWonSign size={14} />
            예산
          </FilterLabel>
          <FilterOptions>
            {filterOptions.budget.map(option => (
              <FilterOption
                key={option.value}
                $active={filters.budget === option.value}
                onClick={() => handleFilterChange('budget', option.value)}
                disabled={isLoading}
              >
                {option.label}
              </FilterOption>
            ))}
          </FilterOptions>
        </FilterGroup>

        {/* 교통수단 */}
        <FilterGroup>
          <FilterLabel>
            <FaCar size={14} />
            교통수단
          </FilterLabel>
          <FilterOptions>
            {filterOptions.transport.map(option => (
              <FilterOption
                key={option.value}
                $active={filters.transport === option.value}
                onClick={() => handleFilterChange('transport', option.value)}
                disabled={isLoading}
              >
                {option.label}
              </FilterOption>
            ))}
          </FilterOptions>
        </FilterGroup>
      </FilterSection>
    </Card>
  );
}

export default AiTripInput;