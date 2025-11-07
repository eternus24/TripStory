// src/admin/InlineRefreshControl.jsx — 🆕 신규 (디자인 무영향)
import React, { useCallback } from 'react';
import AdminApi, { manualRefresh } from '../assets/api/admin';
import useAdminTokenTimer from './useAdminTokenTimer';

export default function InlineRefreshControl({ onFailRefresh, render }) {
  // render(mm, ss, onManualRefresh) 형태의 렌더-프롭으로
  // "남은시간"이 이미 그려지는 기존 자리에서 그 모양 그대로 사용 가능
  const leftSec = useAdminTokenTimer(AdminApi.getAccessToken, null);

  const doRefresh = useCallback(async () => {
    try {
      await manualRefresh();
    } catch (e) {
      onFailRefresh?.(e);
    }
  }, [onFailRefresh]);

  const mm = leftSec != null ? String(Math.floor(leftSec / 60)).padStart(2, '0') : '--';
  const ss = leftSec != null ? String(leftSec % 60).padStart(2, '0') : '--';

  // 디자인을 손대지 않기 위해, 모양/구조는 부모가 책임짐.
  // 부모가 기존의 "남은시간 텍스트" 자리를 그대로 렌더-프롭으로 정의하면 끝.
  return render(mm, ss, doRefresh);
}