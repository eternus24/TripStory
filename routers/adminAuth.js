// routers/adminAuth.js — 2025-10-28 관리자 권한 검증 추가판
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

require('../models/userSchema');
const User = mongoose.model('userdbs');

const isProd = process.env.NODE_ENV === 'production';

const ACCESS_TTL_SEC = 60 * 120;       // 120분
const REFRESH_TTL_SEC = 60 * 60 * 24;  // 24시간

const REFRESH_COOKIE_NAME = 'admin_refresh';
const REFRESH_COOKIE_PATH = '/admin-auth/refresh';

function signAccess(user) {
  return jwt.sign(
    { sub: String(user._id), role: user.role || 'admin' },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: ACCESS_TTL_SEC }
  );
}

function signRefresh(user) {
  return jwt.sign(
    { sub: String(user._id), typ: 'refresh' },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: REFRESH_TTL_SEC }
  );
}

function refreshCookieOptions() {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    path: '/admin-auth/refresh',
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: isProd ? 'none' : 'lax', // ← dev는 'lax'가 안전
    secure: isProd ? true : false,     // dev(http)에서는 false
  };
}

/* =======================================================
   ✅ 관리자 로그인 (/admin-auth/lgn)
   - user.role !== 'admin' → 403
   ======================================================= */
router.post('/lgn', async (req, res) => {
  try {
    const { userId, password } = req.body;
    const user = await User.findOne({ userId })
      .select('+password +passwordHash +hash +role')
      .lean();

    if (!user) return res.status(401).json({ msg: '아이디 또는 비밀번호 오류' });

    const hash = user.password || user.passwordHash || user.hash;
    const ok = await bcrypt.compare(String(password), String(hash));
    if (!ok) return res.status(401).json({ msg: '아이디 또는 비밀번호 오류' });

    // 🔥 관리자 권한 확인 추가
    if (user.role !== 'admin') {
      return res.status(403).json({ msg: '관리자 권한이 없습니다.' });
    }

    const accessToken = signAccess(user);
    const refreshToken = signRefresh(user);

    res
      .cookie(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions())
      .status(200)
      .json({
        accessToken,
        role: user.role,
        user: { userId: user.userId, name: user.name, role: user.role },
      });
  } catch (e) {
    console.error('[ADMIN LOGIN]', e);
    res.status(500).json({ msg: '서버 오류' });
  }
});

// ✅ [추가] 관리자 회원가입
// - ADMIN_SIGNUP_SECRET 환경변수로 보호(옵션)
// - 중복 아이디 체크, 비번 해시 저장, role='admin'
router.post('/register', async (req, res) => {
  try {
    const { userId, password, email, name, secret } = req.body;

    // (옵션) 관리자 가입 코드 검사
    if (process.env.ADMIN_SIGNUP_SECRET) {
      if (!secret || secret !== process.env.ADMIN_SIGNUP_SECRET) {
        return res.status(403).json({ msg: '잘못된 관리자 코드입니다.' });
      }
    }

    if (!userId || !password) {
      return res.status(400).json({ msg: '아이디/비밀번호를 입력하세요.' });
    }

    const exists = await User.findOne({ userId }).lean();
    if (exists) return res.status(409).json({ msg: '이미 존재하는 아이디입니다.' });

    // ✅ 회원가입 핸들러의 "user" 생성 부분만 수정 (나머지 로직/라우트는 그대로!)
    const hashed = await bcrypt.hash(String(password), 10);
    const user = new User({
      userId,
      // password: hashed,        // ← 이 줄은 주석 처리하거나 아예 넣지 말기 (더블해시 방지)
      passwordHash: hashed,       // ✅ 로그인에서 읽을 수 있게 채워줌
      hash: hashed,               // ✅ 보조 필드도 함께 채워줌 (스키마 호환성↑)
      email: email || '',
      name: name || userId,
      role: 'admin',
    });
    await user.save();
    res.status(200).json({ msg: '관리자 등록 완료' });

  } catch (e) {
    console.error('[ADMIN REGISTER]', e);
    return res.status(500).json({ msg: '서버 오류' });
  }
});

/* =======================================================
   ✅ 토큰 재발급 (/admin-auth/refresh)
   ======================================================= */
async function handleRefresh(req, res) {
  try {
    console.log('[REFRESH] cookies =', req.cookies);
    const token = req.cookies?.[REFRESH_COOKIE_NAME];
    if (!token) return res.status(401).json({ msg: '리프레시 없음' });

    const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(payload.sub || payload.uid).lean();
    if (!user) return res.status(401).json({ msg: '사용자 없음' });

    // 🔥 여기도 role 체크 추가
    if (user.role !== 'admin') {
      return res.status(403).json({ msg: '관리자 권한이 없습니다.' });
    }

    const accessToken = signAccess(user);
    res.cookie(REFRESH_COOKIE_NAME, signRefresh(user), refreshCookieOptions());
    res.status(200).json({ accessToken });
  } catch (e) {
    console.error('[REFRESH] error', e);
    res.status(401).json({ msg: '재발급 실패' });
  }
}

router.post('/refresh', handleRefresh);
router.get('/refresh', handleRefresh);

/* =======================================================
   ✅ 토큰 검증 (/admin-auth/me)
   ======================================================= */
router.get('/me', async (req, res) => {
  res.set('Cache-Control', 'no-store');
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ msg: '토큰 없음' });

    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    const uid = payload.sub || payload.uid;
    const user = await User.findById(uid).select('userId name email role').lean();
    if (!user) return res.status(404).json({ msg: '사용자 없음' });

    // 🔥 여기서도 role 검사
    if (user.role !== 'admin') {
      return res.status(403).json({ msg: '관리자 권한이 없습니다.' });
    }

    res.status(200).json({ user });
  } catch (e) {
    console.error('[ADMIN /me] error', e);
    res.status(401).json({ msg: '인증 실패' });
  }
});

/* =======================================================
   ✅ 관리자 정보 수정 (/admin-auth/update)
   ======================================================= */
router.put('/update', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ msg: '토큰 없음' });

    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    const uid = payload.sub || payload.uid;

    const { name, email, nickname, address, password } = req.body;
    const updateData = {};

    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (nickname) updateData.nickname = nickname;
    if (address) updateData.address = address;
    if (password) {
      const hashed = await bcrypt.hash(String(password), 10);
      updateData.passwordHash = hashed;
      updateData.hash = hashed;
    }

    const updated = await User.findByIdAndUpdate(uid, updateData, {
      new: true,
      select: 'userId name email nickname address role',
    }).lean();

    if (!updated) return res.status(404).json({ msg: '사용자 없음' });

    res.status(200).json({ msg: '관리자 정보 수정 완료', user: updated });
  } catch (e) {
    console.error('[ADMIN UPDATE] error', e);
    res.status(500).json({ msg: '수정 실패' });
  }
});

/* =======================================================
   ✅ 로그아웃
   ======================================================= */
router.post('/logout', (req, res) => {
  res.clearCookie(REFRESH_COOKIE_NAME, { path: REFRESH_COOKIE_PATH });
  res.status(200).json({ ok: true });
});

module.exports = router;