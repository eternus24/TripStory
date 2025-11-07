// routers/noticeRouter.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const Notice = require('../models/noticeSchema'); // 또는 mongoose.model('notice')

// ─────────────────────────────────────────────
// 유틸
// ─────────────────────────────────────────────
const { Types } = mongoose;
const isValidObjectId = (v) => Types.ObjectId.isValid(String(v || ''));

function pick(...vals) {
  return vals.find(v => v !== undefined && v !== null && v !== '');
}

// Authorization 헤더 / 쿠키에서 토큰 추출
function extractToken(req) {
  const auth = (req.get('authorization') || '').trim();
  if (/^Bearer\s+/i.test(auth)) return auth.replace(/^Bearer\s+/i, '').trim();
  const c = req.cookies || {};
  return pick(
    c.access_token, c.accessToken, c.token,
    c.admin_access, c.adminAccess, c.admin_token, c.adminToken
  );
}

// 여러 비밀키 후보로 검증 (유저/관리자 토큰 혼재 대비)
function verifyAny(token) {
  const secrets = [
    process.env.JWT_SECRET,
    process.env.JWT_USER_SECRET,
    process.env.JWT_ACCESS_SECRET,
    process.env.JWT_ADMIN_SECRET,
    process.env.ADMIN_JWT_SECRET,
  ].filter(Boolean);
  for (const s of secrets) {
    try { return jwt.verify(token, s); } catch { /* try next */ }
  }
  return null;
}

// 페이로드에서 id 후보를 최대한 뽑아내기
function extractIdFromPayload(p = {}) {
  // 흔한 케이스들 전부 커버
  return pick(
    p._id, p.id, p.userId, p.uid, p.sub,
    p.user?._id, p.user?.id, p.account?._id, p.account?.id
  );
}

function extractNameFromPayload(p = {}) {
  return pick(
    p.nickname, p.displayName, p.username, p.name, p.userId,
    p.user?.nickname, p.user?.displayName, p.user?.username, p.user?.name
  );
}

function hasAdminRole(p = {}) {
  const role = p.role || (Array.isArray(p.roles) ? p.roles : undefined);
  if (typeof role === 'string') return role === 'admin';
  if (Array.isArray(role)) return role.includes('admin');
  return false;
}

// ─────────────────────────────────────────────
// 인증 미들웨어(강화): user/admin 세션 → 없으면 토큰 검증
// ─────────────────────────────────────────────
function authRequired(req, res, next) {
  const sessionUser = req.user || req.admin;
  if (sessionUser) {
    const sid = String(sessionUser._id || sessionUser.id || '');
    if (!isValidObjectId(sid)) {
      return res.status(401).json({ ok: false, message: 'Invalid session id' });
    }
    req.actor = {
      id: sid,
      username: sessionUser.username || sessionUser.name || sessionUser.userId || '사용자',
      nickname: sessionUser.nickname || sessionUser.displayName || '',
      role: sessionUser.role || (Array.isArray(sessionUser.roles) ? sessionUser.roles.join(',') : ''),
      isAdmin: sessionUser.role === 'admin' || (Array.isArray(sessionUser.roles) && sessionUser.roles.includes('admin')),
    };
    return next();
  }

  const token = extractToken(req);
  if (!token) return res.status(401).json({ ok: false, message: 'Login required' });

  const payload = verifyAny(token);
  if (!payload) return res.status(401).json({ ok: false, message: 'Invalid token' });

  const pid = String(extractIdFromPayload(payload) || '');
  if (!isValidObjectId(pid)) {
    return res.status(401).json({ ok: false, message: 'Invalid token id' });
  }

  req.actor = {
    id: pid,
    username: extractNameFromPayload(payload) || '사용자',
    nickname: payload.nickname || payload.displayName || '',
    role: payload.role || (Array.isArray(payload.roles) ? payload.roles.join(',') : ''),
    isAdmin: hasAdminRole(payload),
  };
  return next();
}

// ─────────────────────────────────────────────
// 절대 URL 유틸
// ─────────────────────────────────────────────
function publicBase(req) {
  const xfProto = req.headers['x-forwarded-proto'];
  const xfHost  = req.headers['x-forwarded-host'];
  const proto = (xfProto || req.protocol || 'http').toString().split(',')[0].trim();
  const host  = (xfHost  || req.get('host')).toString().split(',')[0].trim();
  return `${proto}://${host}`;
}
function toAbs(req, p = '') {
  if (!p) return '';
  if (/^https?:\/\//i.test(p)) return p;
  let clean = String(p).replace(/^\.?\/*/, '');
  if (/^notices\//i.test(clean)) clean = `uploads/${clean}`;
  if (!clean.includes('/')) clean = `uploads/notices/${clean}`;
  return `${publicBase(req)}/${clean}`;
}

// ─────────────────────────────────────────────
// GET /notices (목록)
// ─────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const limit = Math.max(1, Math.min(50, Number(req.query.limit) || 10));
    const rows = await Notice.find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('title content image_url image imageUrl imagePath filePath createdAt updatedAt')
      .lean();

    const notices = rows.map(n => {
      const src = n.image_url || n.image || n.imageUrl || n.imagePath || n.filePath || '';
      return {
        _id: n._id,
        title: n.title || '',
        content: n.content || '',
        image: toAbs(req, src),
        createdAt: n.createdAt,
        updatedAt: n.updatedAt,
      };
    });

    res.json({ ok: true, notices });
  } catch (err) {
    console.error('[NOTICES/LIST] error:', err);
    res.status(500).json({ ok: false, message: 'Failed to load notices' });
  }
});

// ─────────────────────────────────────────────
// GET /notices/:id (단건)
// ─────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const n = await Notice.findById(req.params.id)
      .select('title content image_url image imageUrl imagePath filePath likes comments createdAt updatedAt')
      .populate('comments.user', 'nickname username')
      .lean();

    if (!n) return res.status(404).json({ ok: false, message: 'Not found' });

    const src = n.image_url || n.image || n.imageUrl || n.imagePath || n.filePath || '';
    const payload = {
      _id: n._id,
      title: n.title || '',
      content: n.content || '',
      image: toAbs(req, src),
      likesCount: Array.isArray(n.likes) ? n.likes.length : 0,
      comments: Array.isArray(n.comments) ? n.comments : [],
      createdAt: n.createdAt,
      updatedAt: n.updatedAt,
    };
    res.json({ ok: true, notice: payload });
  } catch (err) {
    console.error('[NOTICES/DETAIL] error:', err);
    res.status(500).json({ ok: false, message: 'Failed to load the notice' });
  }
});

// ─────────────────────────────────────────────
// POST /notices/:id/like (좋아요 토글)
// ─────────────────────────────────────────────
router.post('/:id/like', authRequired, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ ok: false, message: 'Invalid id' });

    const userId = req.actor.id;
    if (!isValidObjectId(userId)) return res.status(401).json({ ok: false, message: 'Invalid actor id' });

    const doc = await Notice.findById(id);
    if (!doc) return res.status(404).json({ ok: false, message: 'Not found' });

    if (!Array.isArray(doc.likes)) doc.likes = [];
    const uid = new Types.ObjectId(userId);
    const idx = doc.likes.findIndex(u => String(u) === String(uid));
    if (idx >= 0) doc.likes.splice(idx, 1);
    else doc.likes.push(uid);

    await doc.save();
    return res.json({ ok: true, liked: idx < 0, likesCount: doc.likes.length });
  } catch (err) {
    console.error('[NOTICES/LIKE] error:', err);
    res.status(500).json({ ok: false, message: 'Failed to toggle like' });
  }
});

// ─────────────────────────────────────────────
// POST /notices/:id/comments (댓글 등록)
// ─────────────────────────────────────────────
router.post('/:id/comments', authRequired, async (req, res) => {
  try {
    const { id } = req.params;
    const content = (req.body?.content || '').toString().trim();
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ ok: false, message: 'Invalid id' });
    if (!content) return res.status(400).json({ ok: false, message: '내용을 입력해줘' });

    const userId = req.actor.id;
    if (!isValidObjectId(userId)) return res.status(401).json({ ok: false, message: 'Invalid actor id' });

    const doc = await Notice.findById(id);
    if (!doc) return res.status(404).json({ ok: false, message: 'Not found' });

    if (!Array.isArray(doc.comments)) doc.comments = [];
    doc.comments.push({
      user: new Types.ObjectId(userId), // ✅ 확실히 ObjectId로 저장
      content,
      createdAt: new Date(),
    });
    await doc.save();

    await doc.populate('comments.user', 'nickname username');
    return res.json({ ok: true, comments: doc.comments });
  } catch (err) {
    console.error('[NOTICES/COMMENT] error:', err);
    res.status(500).json({ ok: false, message: 'Failed to add comment' });
  }
});

module.exports = router;