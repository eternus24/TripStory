// AITripCourse.js - 메인 컴포넌트 (로직 + 레이아웃)
import React, { useState } from 'react';
import { FaMagic } from 'react-icons/fa';
import { getAiTrip } from '../../assets/api/aiApi';
import { Container, MaxWidthContainer, Header, HeaderIconContainer, Title, Subtitle } from './AiTripCourseCss';
import AiTripInput from './AiTripInput';
import AiTripResult from './AiTripResult';

function AITripCourse() {
  const [region, setRegion] = useState('');
  const [result, setResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    style: null,      // 여행 스타일
    duration: null,   // 여행 기간
    people: null,     // 인원수
    budget: null,     // 예산
    transport: null   // 교통수단
  });

  const handleGenerate = async () => {
    if (!region.trim()) {
      setError('여행지를 입력해주세요');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      // 필터 정보를 포함해서 API 호출
      const requestData = {
        region,
        ...filters
      };
      
      const plan = await getAiTrip(requestData);
      setResult(plan);
    } catch (err) {
      setError('여행 코스를 생성하는데 실패했습니다. 다시 시도해주세요.');
      console.error('AI Trip Generation Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setResult('');
    setError('');
  };

  return (
    <Container>
      <MaxWidthContainer>
        {/* 헤더 */}
        <Header>
          <HeaderIconContainer>
            <FaMagic color="#9333ea" size={32} />
            <Title>AI 여행 코스 추천</Title>
          </HeaderIconContainer>
          <Subtitle>인공지능이 추천하는 맞춤형 여행 코스를 받아보세요</Subtitle>
        </Header>

        {/* 입력 섹션 */}
        <AiTripInput
          region={region}
          setRegion={(value) => {
            setRegion(value);
            setError('');
          }}
          onGenerate={handleGenerate}
          isLoading={isLoading}
          error={error}
          filters={filters}
          setFilters={setFilters}
        />

        {/* 결과 섹션 (결과 or 안내 카드) */}
        {!isLoading && (
          <AiTripResult
            result={result}
            onReset={handleReset}
          />
        )}
      </MaxWidthContainer>
    </Container>
  );
}

export default AITripCourse;