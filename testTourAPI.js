// ✅ popularPlaces_kakao.js
require('dotenv').config();
const axios = require('axios');
const fs = require('fs');

const KAKAO_KEY = process.env.KAKAO_REST_KEY;
const HEADERS = { Authorization: `KakaoAK ${KAKAO_KEY}` };
const ENDPOINT = 'https://dapi.kakao.com/v2/local/search/category.json';

// ✅ 도시 좌표
const cities = [
  { name: '부산',   x: 129.0756, y: 35.1796 },
  { name: '제주도', x: 126.5312, y: 33.4996 },
  { name: '강릉',   x: 128.8785, y: 37.7519 },
  { name: '경주',   x: 129.2247, y: 35.8562 },
  { name: '전주',   x: 127.1480, y: 35.8219 },
  { name: '여수',   x: 127.6610, y: 34.7604 },
];

// ✅ 카테고리 그룹 코드 (tour=관광, stay=숙박, food=음식)
const categories = [
  { code: 'AT4', key: 'tour' },
  { code: 'AD5', key: 'stay' },
  { code: 'FD6', key: 'food' },
];

// ✅ 카카오 API 호출 함수
async function fetchCategory({ x, y }, category_group_code, radius = 5000) {
  let page = 1;
  const results = [];
  try {
    while (true) {
      const params = {
        category_group_code,
        x,
        y,
        radius,
        page,
        size: 15,
        sort: 'distance'
      };
      const { data } = await axios.get(ENDPOINT, { params, headers: HEADERS });
      results.push(...data.documents);
      if (data.meta.is_end) break;
      page++;
      await new Promise(r => setTimeout(r, 150)); // 과호출 방지
    }
    return results.map(d => ({
      id: d.id,
      name: d.place_name,
      category: d.category_name,
      address: d.road_address_name || d.address_name,
      phone: d.phone || '-',
      url: d.place_url,
      x: d.x,
      y: d.y
    }));
  } catch (err) {
    console.error(`❌ 오류(${category_group_code}):`, err.response?.status, err.response?.statusText || err.message);
    return [];
  }
}

// ✅ 전체 실행
(async () => {
  const all = {};
  for (const city of cities) {
    all[city.name] = {};
    for (const c of categories) {
      console.log(`📍 ${city.name} / ${c.key} 수집중...`);
      const items = await fetchCategory(city, c.code);
      all[city.name][c.key] = items;
      console.log(`✅ ${city.name} / ${c.key} : ${items.length}개`);
    }
  }
  fs.writeFileSync('popularPlaces_kakao.json', JSON.stringify(all, null, 2), 'utf-8');
  console.log('🎉 popularPlaces_kakao.json 저장 완료!');
})();
