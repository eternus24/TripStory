// src/components/mypage/MyCoupons.js
import './MyCoupons.css';
import { useNavigate } from 'react-router-dom';
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import api from '../../assets/api/index';
import './MyPage.css';

export default function MyCoupons() {
  // 상태: 로딩/목록/오류
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [list, setList] = useState([]);
  const [error, setError] = useState('');

  // 필터/정렬/표시 상태
  const [activeTab, setActiveTab] = useState('all'); // all, active, used, expired
  const [sortBy, setSortBy] = useState('newest'); // newest, dueDate, discountDesc
  const [isExpanded, setIsExpanded] = useState(false);

  // 접힘 관련 측정
  const listWrapRef = useRef(null);
  const listRef = useRef(null);
  const [isCollapsible, setIsCollapsible] = useState(false);       // 2줄 이상?
  const [collapsedMax, setCollapsedMax] = useState(null);          // 한 줄 높이(px)

  // 내 쿠폰 불러오기
  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/api/coupons/me');
      setList(Array.isArray(data) ? data : (data?.coupons || []));
      setError('');
    } catch (e) {
      console.error('[MyCoupons] fetch error:', e?.response?.data || e.message);
      setError('쿠폰을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 쿠폰 사용 처리
  const redeem = async (couponId) => {
    if (!couponId) return;
    if (!window.confirm('이 쿠폰을 사용 처리할까요? 사용 후에는 복구할 수 없습니다.')) return;
    try {
      await api.post(`/api/coupons/${couponId}/redeem`);
      await fetchCoupons();
    } catch (e) {
      console.error('[MyCoupons] redeem error:', e?.response?.data || e.message);
      alert('사용 처리에 실패했어요.');
    }
  };

  // 마운트 시 로드 + (선택) 발급 이벤트 응답
  useEffect(() => {
    fetchCoupons();
    const onIssued = () => fetchCoupons();
    window.addEventListener('coupon:issued', onIssued);
    return () => window.removeEventListener('coupon:issued', onIssued);
  }, []);

  // 남은 일수 계산
  const remainDays = (iso) => {
    if (!iso) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(iso);
    due.setHours(0, 0, 0, 0);
    const diff = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
    return diff;
  };

  // 통계
  const stats = useMemo(() => {
    const total = list.length;
    const active = list.filter(c => c.status === 'active').length;
    const used = list.filter(c => c.status === 'used').length;
    const expired = list.filter(c => c.status === 'expired').length;
    return { total, active, used, expired };
  }, [list]);

  // 필터링/정렬 목록
  const filteredList = useMemo(() => {
    let filtered = [...list];

    // 탭 필터
    if (activeTab !== 'all') {
      filtered = filtered.filter(c => c.status === activeTab);
    }

    // 정렬
    if (sortBy === 'newest') {
      filtered.sort((a, b) => {
        const dateA = a.createdAt || a._id;
        const dateB = b.createdAt || b._id;
        return String(dateB).localeCompare(String(dateA));
      });
    } else if (sortBy === 'dueDate') {
      filtered.sort((a, b) => {
        if (!a.validUntil) return 1;
        if (!b.validUntil) return -1;
        return new Date(a.validUntil) - new Date(b.validUntil);
      });
    } else if (sortBy === 'discountDesc') {
      filtered.sort((a, b) => {
        const da = Number.isFinite(+a.discount) ? +a.discount : -1;
        const db = Number.isFinite(+b.discount) ? +b.discount : -1;
        if (db !== da) return db - da;
        const dateA = a.createdAt || a._id;
        const dateB = b.createdAt || b._id;
        return String(dateB).localeCompare(String(dateA));
      });
    }

    return filtered;
  }, [list, activeTab, sortBy]);

  // 탭/정렬 변경 시 접기 초기화
  useEffect(() => {
    setIsExpanded(false);
  }, [activeTab, sortBy]);

  // 한 줄 높이 측정 + 2줄 이상 여부 판단
  const measure = () => {
    const wrap = listWrapRef.current;
    const listEl = listRef.current;
    if (!wrap || !listEl) return;

    const cards = Array.from(listEl.children).filter(
      (n) => n.nodeType === 1
    );
    if (cards.length === 0) {
      setIsCollapsible(false);
      setCollapsedMax(null);
      return;
    }

    // 첫 번째 행(top)과 두 번째 행의 시작 지점 찾기
    const topY = cards[0].offsetTop;
    const secondRowCard = cards.find((c) => c.offsetTop > topY);
    if (!secondRowCard) {
      // 전부 한 줄 → 접히지 않음
      setIsCollapsible(false);
      setCollapsedMax(null);
      return;
    }

    // 한 줄이 차지하는 실제 높이(px) 계산
    const listTop = listEl.offsetTop;
    const oneRowHeight = secondRowCard.offsetTop - listTop;

    setIsCollapsible(true);
    setCollapsedMax(oneRowHeight);
  };

  // 목록/레이아웃 변화 시 측정
  useLayoutEffect(() => {
    measure();
    // 리사이즈에 반응 (반응형 그리드 대응)
    const onResize = () => measure();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [filteredList.length]);

  const handleToggleExpand = () => setIsExpanded((v) => !v);

  return (
    <div className="mypage-section-card my-coupons-wrapper">
      <h2 className="my-coupons-title">
        <span>내 쿠폰함</span>
        <span className="emoji">🎫</span>
      </h2>

      <p className="my-coupons-sub">
        스탬프를 모으면 <b>마켓별 지급률</b>로 할인 쿠폰이 발급됩니다.
      </p>

      {loading ? (
        <div className="coupon-empty">불러오는 중...</div>
      ) : error ? (
        <div className="coupon-error">{error}</div>
      ) : list.length === 0 ? (
        <div className="coupon-empty">
          아직 쿠폰이 없어요. 여행을 기록하고 스탬프를 모아보세요! ✨
        </div>
      ) : (
        <>
          {/* 컨트롤 (탭 + 정렬) */}
          <div className="coupon-controls">
            <div className="coupon-tabs">
              <button
                className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
                onClick={() => setActiveTab('all')}
              >
                전체 ({stats.total})
              </button>
              <button
                className={`tab-btn ${activeTab === 'active' ? 'active' : ''}`}
                onClick={() => setActiveTab('active')}
              >
                사용가능 ({stats.active})
              </button>
              <button
                className={`tab-btn ${activeTab === 'used' ? 'active' : ''}`}
                onClick={() => setActiveTab('used')}
              >
                사용완료 ({stats.used})
              </button>
              <button
                className={`tab-btn ${activeTab === 'expired' ? 'active' : ''}`}
                onClick={() => setActiveTab('expired')}
              >
                만료 ({stats.expired})
              </button>
            </div>

            <select
              className="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="newest">최신순</option>
              <option value="dueDate">만료임박순</option>
              <option value="discountDesc">할인율 높은순</option>
            </select>
          </div>

          {/* 목록 */}
          <div
            ref={listWrapRef}
            className={`coupon-list-wrapper ${isExpanded ? 'expanded' : 'collapsed'}`}
            data-collapsible={isCollapsible ? 'true' : 'false'}
            style={
              !isExpanded && isCollapsible && collapsedMax
                ? { ['--collapsed-max']: `${collapsedMax}px` }
                : undefined
            }
            aria-expanded={isExpanded}
          >
            <div ref={listRef} className="coupon-list">
              {filteredList.map((c) => {
                const left = remainDays(c.validUntil);
                const disabled = c.status !== 'active';
                const dueSoon = typeof left === 'number' && left >= 0 && left <= 3;
                const discountPercent = Number.isFinite(+c.discount) ? +c.discount : 0;

                return (
                  <div key={c._id} className={`coupon-card${dueSoon ? ' due-soon' : ''}`}>
                    {/* 상태 뱃지 */}
                    <div
                      className={`coupon-badge ${
                        c.status === 'expired'
                          ? 'expired'
                          : c.status === 'used'
                          ? 'used'
                          : ''
                      }`}
                    >
                      {c.status === 'active'
                        ? '사용 가능'
                        : c.status === 'used'
                        ? '사용됨'
                        : '만료'}
                    </div>

                    {/* 지역 + 할인율 */}
                    <div className="coupon-region">
                      <b>{c.region}</b>{' '}
                      <span>
                        {discountPercent > 0 ? `${discountPercent}%` : '지급률 미설정'}
                      </span>
                    </div>

                    {/* 메타 정보 */}
                    <div className="coupon-meta">
                      유효기간: {c.validUntil ? c.validUntil.slice(0, 10) : '-'}
                      {typeof left === 'number' && left >= 0 ? ` (D-${left})` : ''}
                    </div>

                    {/* 추천 생산자 */}
                    {c.producer?.name && (
                      <div className="coupon-meta">
                        🏅 {c.producer.badge ? `${c.producer.badge} · ` : ''}
                        {c.producer.name}
                      </div>
                    )}

                    {/* 특산물 */}
                    {Array.isArray(c.products) && c.products.length > 0 && (
                      <div className="coupon-meta">🌾 {c.products.slice(0, 3).join(' · ')}</div>
                    )}

                    {/* 액션 버튼 */}
                    <div className="coupon-actions">
                    <button
                     className="coupon-btn"
                        disabled={disabled}
                        onClick={() => {
                          if (disabled) return;
                          const q = c.region ? `?region=${encodeURIComponent(c.region)}` : '';
                          window.scrollTo({ top: 0, left: 0, behavior: 'auto' }); // 선택사항
                          navigate(`/market${q}`);
                        }}
                        title={disabled ? '사용 불가 상태' : '사용 처리'}
                      >
                        {disabled ? '사용 완료' : '사용하기'}
                      </button>
                      {c.producer?.link && (
                        <a
                          className="coupon-btn"
                          href={c.producer.link}
                          onClick={(e) => e.stopPropagation()}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          특산물 보러가기
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 펼치기/접기 버튼 — "2줄 이상일 때만" 노출 */}
          {isCollapsible && (
            <button
              className={`toggle-expand-btn ${isExpanded ? 'expanded' : ''}`}
              onClick={handleToggleExpand}
              aria-controls="coupon-list"
              aria-expanded={isExpanded}
            >
              {isExpanded ? (
                <>
                  접기 <span className="arrow">▼</span>
                </>
              ) : (
                <>
                  전체보기 ({filteredList.length}개) <span className="arrow">▼</span>
                </>
              )}
            </button>
          )}
        </>
      )}
    </div>
  );
}
