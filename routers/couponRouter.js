// routers/couponRouter.js
const express = require('express');
const mongoose = require('mongoose');

// ✅ auth 미들웨어 (있으면 사용, 없으면 no-op)
let authRequired = (req, res, next) => next();
try {
  const mod =
    require('./auth') ||
    require('../middlewares/auth') ||
    require('../auth');
  authRequired = mod.authRequired || mod;
} catch (_) { /* dev no-op */ }

const Coupon = mongoose.model('coupons');        // :contentReference[oaicite:3]{index=3}
const MyTrip = mongoose.model('mytripdbs');      // :contentReference[oaicite:4]{index=4}
const router = express.Router();

/* ===================== 🔹 스탬프 기준 지역명 (정답표) ===================== */
const STANDARD_REGIONS = [
  '서울특별시','부산광역시','대구광역시','인천광역시',
  '광주광역시','대전광역시','울산광역시','세종특별자치시',
  '경기도','강원도','충청북도','충청남도',
  '전라북도','전라남도','경상북도','경상남도',
  '제주특별자치도'
];

// 스탬프에서 쓰는 별칭 → 정답 매핑 (필요한 최소 별칭만 유지)
const REGION_ALIASES = new Map([
  ['서울','서울특별시'], ['부산','부산광역시'], ['대구','대구광역시'],
  ['인천','인천광역시'], ['광주','광주광역시'], ['대전','대전광역시'],
  ['울산','울산광역시'],
  ['세종','세종특별자치시'], ['세종시','세종특별자치시'],
  ['경기','경기도'],
  ['강원','강원도'], ['강원특별자치도','강원도'],
  ['충북','충청북도'], ['충남','충청남도'],
  ['전북','전라북도'], ['전남','전라남도'],
  ['경북','경상북도'], ['경남','경상남도'],
  ['제주','제주특별자치도'], ['제주도','제주특별자치도']
]);

function normalizeRegion(input) {
  if (!input) return '';
  const raw = String(input).trim();
  if (!raw) return '';
  if (REGION_ALIASES.has(raw)) return REGION_ALIASES.get(raw);
  // 정답 17개면 그대로, 그 외는 원문 유지(추후 로그로 점검 가능)
  return STANDARD_REGIONS.includes(raw) ? raw : raw;
}
/* =================== // 지역명 표준화 =================== */

/* ===================== 🔹 userId 검증 ===================== */
function getUserId(req) {
  const userId = req.user?.uid || req.user?._id || req.user?.id;
  if (!userId) throw new Error('인증 정보가 없습니다.');
  return String(userId);
}

/** 방문 마일스톤 ↔ 할인율/티어 매핑 (변경 없음) */
const MILESTONE_TABLE = [
  { m: 0, tier: 'WELCOME',  discount: 5  },
  { m: 1, tier: 'VISIT_1',  discount: 10 },
  { m: 2, tier: 'VISIT_2',  discount: 7  },
  { m: 3, tier: 'VISIT_3',  discount: 10 },
  { m: 5, tier: 'VISIT_5',  discount: 12 },
  { m: 7, tier: 'VISIT_7',  discount: 15 },
  { m: 9, tier: 'VISIT_9',  discount: 20 },
];

const DEFAULT_VALID_DAYS = 30;
const addDays = (d, days) => {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
};

/** 멱등 발급: 이미 있으면 그대로 반환, 없으면 생성 */
async function ensureIssue(userId, region, milestone) {
  const entry = MILESTONE_TABLE.find((x) => x.m === milestone);
  if (!entry) return { created: false, reason: 'invalid-milestone' };

  const normalized = normalizeRegion(region);
  const exists = await Coupon.findOne({ userId, region: normalized, milestone });
  if (exists) return { created: false, coupon: exists, reason: 'already-issued' };

  const coupon = await Coupon.create({
    userId,
    region: normalized,
    milestone,
    tier: entry.tier,
    discount: entry.discount,
    status: 'active',
    validUntil: addDays(new Date(), DEFAULT_VALID_DAYS),
  });

  return { created: true, coupon };
}

/**
 * 방문 수 기반 자동 발급
 * - 여행 기록(mytripdbs)에서 지역 누적 방문을 집계
 * - 해당 방문 수 이내의 "미발급 최고 단계" 1장만 발급 (멱등)
 */
async function issueByVisit(userId, region, includeWelcome = true) {
  const normalized = normalizeRegion(region);

  const trips = await MyTrip.find({ userId });               // :contentReference[oaicite:5]{index=5}
  const visitCount = trips.filter(t => 
    normalizeRegion(t.location) === normalized
  ).length;

  const eligible = MILESTONE_TABLE
    .filter((x) => (includeWelcome ? x.m >= 0 : x.m > 0))
    .filter((x) => x.m <= visitCount)
    .sort((a, b) => a.m - b.m);

  if (eligible.length === 0) return { issued: null, visitCount };

  for (let i = eligible.length - 1; i >= 0; i--) {
    const r = await ensureIssue(userId, normalized, eligible[i].m);
    if (r.created) return { issued: r.coupon, visitCount };
  }
  return { issued: null, visitCount };
}

/* -------------------- REST APIs -------------------- */

// 내 쿠폰 목록 (만료 자동 처리)
router.get('/me', authRequired, async (req, res) => {
  try {
    const userId = getUserId(req);
    await Coupon.updateMany(
      { userId, status: 'active', validUntil: { $lt: new Date() } },
      { $set: { status: 'expired' } }
    );
    const list = await Coupon.find({ userId }).sort({ createdAt: -1 }).lean();
    res.send(list);
  } catch (err) {
    if (err.message === '인증 정보가 없습니다.') {
      return res.status(401).send({ error: true, message: err.message });
    }
    console.error('[GET /me]', err);
    res.status(500).send({ error: true, message: '쿠폰 조회 실패' });
  }
});

// 마일스톤 테이블 제공
router.get('/milestones', (_, res) => res.send(MILESTONE_TABLE));

// 웰컴 쿠폰 단독 발급
router.post('/issue/welcome', authRequired, async (req, res) => {
  try {
    const userId = getUserId(req);
    const { region } = req.body || {};
    if (!region) return res.status(400).send({ error: true, message: 'region이 필요합니다.' });

    const r = await ensureIssue(userId, region, 0);
    res.send({ ok: true, issued: r.created ? r.coupon : null, reason: r.reason || null });
  } catch (err) {
    if (err.message === '인증 정보가 없습니다.') {
      return res.status(401).send({ error: true, message: err.message });
    }
    console.error('[POST /issue/welcome]', err);
    res.status(500).send({ error: true, message: '웰컴 쿠폰 발급 실패' });
  }
});

// 방문 수 기반 자동 발급
router.post('/issue/by-visit', authRequired, async (req, res) => {
  try {
    const userId = getUserId(req);
    const { region, includeWelcome = true } = req.body || {};
    if (!region) return res.status(400).send({ error: true, message: 'region이 필요합니다.' });

    const r = await issueByVisit(userId, region, includeWelcome);
    res.send({ ok: true, ...r });
  } catch (err) {
    if (err.message === '인증 정보가 없습니다.') {
      return res.status(401).send({ error: true, message: err.message });
    }
    console.error('[POST /issue/by-visit]', err);
    res.status(500).send({ error: true, message: '쿠폰 발급 실패' });
  }
});

// 쿠폰 사용 처리 (/use/:id)
router.post('/use/:id', authRequired, async (req, res) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    const updated = await Coupon.findOneAndUpdate(
      { _id: id, userId, status: 'active' },
      { $set: { status: 'used', usedAt: new Date() } },
      { new: true }
    );
    if (!updated) return res.status(400).send({ error: true, message: '사용 가능한 쿠폰이 아닙니다.' });
    res.send({ ok: true, coupon: updated });
  } catch (err) {
    if (err.message === '인증 정보가 없습니다.') {
      return res.status(401).send({ error: true, message: err.message });
    }
    console.error('[POST /use/:id]', err);
    res.status(500).send({ error: true, message: '쿠폰 사용 처리 실패' });
  }
});

// 쿠폰 사용 처리 (/:id/redeem) — MyCoupons.js 호환
router.post('/:id/redeem', authRequired, async (req, res) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    const updated = await Coupon.findOneAndUpdate(
      { _id: id, userId, status: 'active' },
      { $set: { status: 'used', usedAt: new Date() } },
      { new: true }
    );
    if (!updated) return res.status(400).send({ error: true, message: '사용 가능한 쿠폰이 아닙니다.' });
    res.send({ ok: true, coupon: updated });
  } catch (err) {
    if (err.message === '인증 정보가 없습니다.') {
      return res.status(401).send({ error: true, message: err.message });
    }
    console.error('[POST /:id/redeem]', err);
    res.status(500).send({ error: true, message: '쿠폰 사용 실패' });
  }
});

module.exports = router;
module.exports.issueByVisit = issueByVisit;
module.exports.ensureIssue = ensureIssue;
module.exports.MILESTONE_TABLE = MILESTONE_TABLE;
module.exports.normalizeRegion = normalizeRegion; // 👉 스탬프 기준으로 통일
