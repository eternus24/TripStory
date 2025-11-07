// models/storySchema.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

// ===================================
// 💬 댓글 서브 스키마 (대댓글 지원)
// ===================================
const commentSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'userdbs', required: true }, // 작성자
  authorName: { type: String }, // 프론트에서 표시용 이름
  text: { type: String, required: true }, // 댓글 내용
  parentId: { type: Schema.Types.ObjectId, default: null }, // 대댓글이면 부모 댓글 _id
  createdAt: { type: Date, default: Date.now }
});

// ===================================
// 🧾 스토리 스키마
// ===================================
const storySchema = new Schema({
  title: { type: String, required: true },
  region: { type: String, required: true },
  mood: { type: String, default: '일반' },
  keywords: { type: [String], default: [] },
  content: { type: String, required: true },
  imageUrls: { type: [String], default: [] },

  // ✅ 여행 날짜 (여행기록에서 가져옴)
  travelDate: { type: String, default: '' },

  // 👤 작성자
  author: {
    type: Schema.Types.ObjectId,
    ref: 'userdbs',
    required: true
  },

  // ❤️ 좋아요한 유저 목록
  likes: [{ type: Schema.Types.ObjectId, ref: 'userdbs' }],

  // 💬 댓글 배열
  comments: [commentSchema],

  // 🕓 생성 및 수정 일시
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// ✅ 자동 updatedAt 갱신
storySchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

// ✅ 중복 등록 방지
module.exports = mongoose.models.storydbs || mongoose.model('storydbs', storySchema);