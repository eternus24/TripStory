// models/TravelReview.js
const mongoose = require('mongoose');

// 추천 링크 스키마
const recommendLinkSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    maxlength: 50
  },
  url: {
    type: String,
    required: true
  }
});

// 여행후기 메인 스키마
const travelReviewSchema = new mongoose.Schema({
  title: {
    type: String,
    maxlength: 100,
    default: ''
  },
  content: {
    type: String,
    required: true,
    maxlength: 5000
  },
  images: {
    type: [String],
    required: true,
    validate: {
      validator: function(v) {
        return v && v.length > 0;
      },
      message: '최소 1개의 이미지가 필요합니다.'
    }
  },
  type: {
    type: String,
    required: true,
    enum: ['국내', '국외']
  },
  hashtags: {
    type: [String],
    default: []
  },
 
  recommendLinks: {
    type: [recommendLinkSchema],
    default: []
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'userdbs',
    required: true
  },
  authorName: {
    type: String,
    required: true
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'userdbs'
  }],
  likeCount: {
    type: Number,
    default: 0
  },
  // ✅ comments 배열 제거, commentCount만 유지
  commentCount: {
    type: Number,
    default: 0
  },
  viewCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// 인덱스 설정 (검색 성능 향상)
travelReviewSchema.index({ type: 1 });
travelReviewSchema.index({ hashtags: 1 });
travelReviewSchema.index({ createdAt: -1 });
travelReviewSchema.index({ likeCount: -1 });

module.exports = mongoose.model('TravelReview', travelReviewSchema);