// ✅ src/routers/stampRouters.js
const express = require('express');
const mongoose = require('mongoose');
const { authRequired } = require('./auth'); // 사용자 인증만

const stamp = mongoose.model('stampdbs');
const mytrip = mongoose.model('mytripdbs');

const router = express.Router();

// 🔹 스탬프 목록 조회
router.get('/list', authRequired, async (req, res) => {
  try {
    const stamps = await stamp.find({ userId: req.user.uid }).sort({ date: -1 });
    res.status(200).send(stamps);
  } catch (err) {
    console.error('스탬프 조회 실패:', err);
    res.status(500).send({ error: true, message: '스탬프 조회 실패' });
  }
});

// 🔹 방문 횟수 조회
router.get('/visitCount', authRequired, async (req, res) => {
  try {
    const trips = await mytrip.find({ userId: req.user.uid });
    const visitCounts = {};
    trips.forEach((t) => {
      if (t.location) visitCounts[t.location] = (visitCounts[t.location] || 0) + 1;
    });
    res.status(200).send(visitCounts);
  } catch (err) {
    console.error('방문횟수 조회 실패:', err);
    res.status(500).send({ error: true, message: '방문횟수 조회 실패' });
  }
});

// 🔹 스탬프 추가 (5회 방문 시만 가능)
router.post('/add', authRequired, async (req, res) => {
  try {
    const { location, regionCode, date } = req.body;
    const userId = req.user.uid;

    const existing = await stamp.findOne({ userId, location });
    if (existing)
      return res.status(400).send({ error: true, message: '이미 획득한 스탬프입니다.' });

    const tripCount = await mytrip.countDocuments({ userId, location });
    if (tripCount < 5)
      return res.status(400).send({
        error: true,
        message: `${location}을(를) ${5 - tripCount}번 더 방문해야 스탬프를 획득할 수 있습니다.`,
      });

    const newStamp = await stamp.create({
      userId,
      location,
      regionCode,
      date: date || new Date().toISOString().split('T')[0],
    });

    res.status(200).send({ error: false, stamp: newStamp });
  } catch (err) {
    console.error('스탬프 추가 실패:', err);
    res.status(500).send({ error: true, message: '스탬프 추가 실패' });
  }
});

// 🔹 사용자 등급 조회
router.get('/userGrade', authRequired, async (req, res) => {
  try {
    const stampCount = await stamp.countDocuments({ userId: req.user.uid });
    const gradeLevel = Math.min(Math.floor(stampCount / 3), 4);
    const grades = [
      { level: 0, name: '여행 새싹', color: '#9e9e9e', icon: '🌱' },
      { level: 1, name: '여행 탐험가', color: '#4caf50', icon: '🌿' },
      { level: 2, name: '여행 마스터', color: '#2196f3', icon: '⭐' },
      { level: 3, name: '여행 전문가', color: '#9c27b0', icon: '👑' },
      { level: 4, name: '여행 레전드', color: '#ffd700', icon: '🏆' },
    ];
    res.status(200).send({
      currentGrade: grades[gradeLevel],
      stampCount,
      nextGradeStamps: gradeLevel < 4 ? (gradeLevel + 1) * 3 : null,
    });
  } catch (err) {
    console.error('등급 조회 실패:', err);
    res.status(500).send({ error: true, message: '등급 조회 실패' });
  }
});

module.exports = router;
