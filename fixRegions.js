// scripts/fixRegions.js
// 목적: Vendor.region 값을 17개 표준 행정명으로 일괄 정규화
// 사용: node scripts/fixRegions.js
require('dotenv').config();
const mongoose = require('mongoose');

// 프로젝트 구조에 맞게 경로 확인
const Vendor = require('./models/Vendor');

const MONGO = process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/tripstory';

// ✅ 스키마 enum 과 동일하게 유지 (Vendor.js 기준)
const STANDARD = [
  '서울특별시','부산광역시','대구광역시','인천광역시',
  '광주광역시','대전광역시','울산광역시','세종특별자치시',
  '경기도','강원도','충청북도','충청남도',
  '전라북도','전라남도','경상북도','경상남도',
  '제주특별자치도'
];

// 흔히 들어온 비표준/약칭 → 표준 매핑
const MAP = new Map([
  // 광역시 약칭
  ['서울','서울특별시'],
  ['부산','부산광역시'], ['부산시','부산광역시'],
  ['대구','대구광역시'], ['대구시','대구광역시'],
  ['인천','인천광역시'], ['인천시','인천광역시'],
  ['광주','광주광역시'], ['광주시','광주광역시'],
  ['대전','대전광역시'], ['대전시','대전광역시'],
  ['울산','울산광역시'], ['울산시','울산광역시'],

  // 도 약칭
  ['경기','경기도'],
  ['강원','강원도'],
  ['충북','충청북도'],
  ['충남','충청남도'],
  ['전북','전라북도'],
  ['전남','전라남도'],
  ['경북','경상북도'],
  ['경남','경상남도'],

  // 세종/제주 변형
  ['세종','세종특별자치시'],
  ['세종시','세종특별자치시'],
  ['제주','제주특별자치도'],
  ['제주도','제주특별자치도'],

  // 2023~2024 명칭 혼동 케이스(전북특별자치도 → enum 은 전라북도)
  ['전북특별자치도', '전라북도'],
  // (필요시 '강원특별자치도' → '강원도' 등 프로젝트 기준으로 추가)
]);

function canonRegion(input) {
  if (!input || typeof input !== 'string') return null;
  const raw = input.trim();
  if (!raw) return null;

  // 이미 표준이면 그대로
  if (STANDARD.includes(raw)) return raw;

  // 완전 일치 매핑
  if (MAP.has(raw)) return MAP.get(raw);

  // 부분 문자열에 광역/도 키워드가 들어온 경우 느슨 매핑
  const L = raw.replace(/\s+/g,'');
  const contains = (s) => L.includes(s);

  if (contains('서울')) return '서울특별시';
  if (contains('부산')) return '부산광역시';
  if (contains('대구')) return '대구광역시';
  if (contains('인천')) return '인천광역시';
  if (contains('광주')) return '광주광역시';
  if (contains('대전')) return '대전광역시';
  if (contains('울산')) return '울산광역시';
  if (contains('세종')) return '세종특별자치시';

  if (contains('경기')) return '경기도';
  if (contains('강원')) return '강원도';
  if (contains('충북')) return '충청북도';
  if (contains('충남')) return '충청남도';
  if (contains('전북')) return '전라북도';
  if (contains('전남')) return '전라남도';
  if (contains('경북')) return '경상북도';
  if (contains('경남')) return '경상남도';

  if (contains('제주')) return '제주특별자치도';

  // 마지막: 흔한 오류 교정
  if (/^부산.?광역.?시$/.test(raw)) return '부산광역시';
  if (/^전라.?북도$/.test(raw)) return '전라북도';
  if (/^전라.?남도$/.test(raw)) return '전라남도';

  return null; // 판단 불가
}

async function main() {
  await mongoose.connect(MONGO);
  console.log('[fixRegions] connected:', MONGO);

  const vendors = await Vendor.find({}, { name:1, region:1 }).lean();
  console.log('[fixRegions] total vendors:', vendors.length);

  const ops = [];
  const report = { unchanged:0, fixed:0, skipped:0, invalid:[] };

  for (const v of vendors) {
    const before = (v.region || '').trim();
    const after = canonRegion(before);

    if (!before) {
      report.skipped++;
      report.invalid.push({ _id: v._id, name: v.name, reason: 'empty region' });
      continue;
    }

    if (STANDARD.includes(before)) {
      report.unchanged++;
      continue;
    }

    if (after && after !== before) {
      ops.push({
        updateOne: {
          filter: { _id: v._id },
          update: { $set: { region: after } }
        }
      });
    } else if (!after) {
      report.skipped++;
      report.invalid.push({ _id: v._id, name: v.name, region: before, reason: 'unrecognized' });
    }
  }

  if (ops.length) {
    const res = await Vendor.bulkWrite(ops, { ordered: false });
    report.fixed = res.modifiedCount || 0;
  }

  console.log('[fixRegions] result:', report);
  await mongoose.disconnect();
  console.log('[fixRegions] done');
}

main().catch(e=>{
  console.error('[fixRegions] error', e);
  mongoose.disconnect().finally(()=>process.exit(1));
});