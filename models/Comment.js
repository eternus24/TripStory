// models/Comment.js
const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'userdbs',  // ✅ 기존 User 모델명
    required: true
  },
  username: {
    type: String,
    required: true
  },
  travelReview: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TravelReview',
    required: true,
    index: true  // ✅ 조회 성능 향상
  },
  // ✅ 대댓글(답글) 지원: null이면 최상위 댓글
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
    default: null,
    index: true
  }
}, {
  timestamps: true  // createdAt, updatedAt 자동 생성
});

// ✅ 복합 인덱스: 특정 게시글의 댓글을 빠르게 조회 (부모-자식 트리 1단계)
commentSchema.index({ travelReview: 1, parent: 1, createdAt: -1 });

// ✅ 댓글 삭제 시 게시글의 commentCount 자동 감소
commentSchema.post('findOneAndDelete', async function(doc) {
  if (doc) {
    const TravelReview = mongoose.model('TravelReview');
    await TravelReview.findByIdAndUpdate(
      doc.travelReview,
      { $inc: { commentCount: -1 } }
    );
  }
});

// ✅ 대량 삭제 시에도 commentCount 감소
commentSchema.post('deleteMany', async function(result) {
  if (result.deletedCount > 0) {
    const filter = this.getFilter();
    if (filter.travelReview) {
      const TravelReview = mongoose.model('TravelReview');
      await TravelReview.findByIdAndUpdate(
        filter.travelReview,
        { $inc: { commentCount: -result.deletedCount } }
      );
    }
  }
});

module.exports = mongoose.model('Comment', commentSchema);
