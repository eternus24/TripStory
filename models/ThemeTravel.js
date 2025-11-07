// models/ThemeTravel.js
const mongoose = require('mongoose');

const themeTravelSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  location: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  category: {
    type: String,
    enum: [
      '인생샷 감성 여행',
      '반려견과 함께하는 여행',
      '힐링 자연여행',
      '바다 감성 여행',
      '캠핑 & 차박 여행',
      '로컬 맛집 탐방 여행',
      '섬 여행',
      '감성 숙소 여행',
      '액티브 어드벤처 여행',
      '도심 속 감성 여행'
    ],
    required: true
  },
  imageUrl: {
    type: String,
    default: 'https://via.placeholder.com/400x250/e3f2fd/1976d2?text=Travel'
  },
  tags: [{ type: String }], // 예: ['서핑', '패러글라이딩', '바다']
  activities: [{ type: String }], // 추천 액티비티
  bestSeason: { type: String }, // 최적 시즌 (예: '봄', '여름', '사계절')
  difficulty: { 
    type: String, 
    enum: ['쉬움', '보통', '어려움'],
    default: '보통'
  },
  duration: { type: String }, // 추천 여행 기간 (예: '당일', '1박2일', '2박3일')
  budget: { type: String }, // 예상 예산 (예: '10만원대', '50만원 이상')
  contact: { type: String, trim: true },
  website: { type: String, trim: true },
  tips: { type: String } // 여행 팁
}, { timestamps: true });

module.exports = mongoose.model('ThemeTravel', themeTravelSchema);