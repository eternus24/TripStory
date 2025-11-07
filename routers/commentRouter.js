// routers/commentRouter.js
const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const Comment = require('../models/Comment');
const TravelReview = require('../models/TravelReview');
const router = express.Router();

// ✅ 인증 미들웨어
const authRequired = (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token)
    return res.status(401).json({ success: false, message: '토큰이 없습니다.' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    req.user = { uid: decoded.uid || decoded.sub || decoded.id };
    next();
  } catch {
    return res
      .status(401)
      .json({ success: false, message: '유효하지 않거나 만료된 토큰입니다.' });
  }
};

// 🔍 특정 게시글의 댓글 목록 조회 (부모/자식 포함 평면 리스트 반환)
router.get('/travel-reviews/:reviewId/comments', async (req, res) => {
  try {
    const { reviewId } = req.params;

    // ✅ 게시글 존재 확인
    const reviewExists = await TravelReview.exists({ _id: reviewId });
    if (!reviewExists) {
      return res
        .status(404)
        .json({ success: false, message: '게시물을 찾을 수 없습니다.' });
    }

    // ✅ 댓글 조회 (최신순) — parent 포함
    const comments = await Comment.find({ travelReview: reviewId })
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      data: comments,
      total: comments.length,
    });
  } catch (err) {
    console.error('댓글 목록 조회 오류:', err);
    res
      .status(500)
      .json({ success: false, message: '댓글 목록 조회에 실패했습니다.' });
  }
});

// 💬 댓글/답글 작성 (parentId 옵션)
router.post('/travel-reviews/:reviewId/comments', authRequired, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { content, parentId } = req.body;

    if (!content || !content.trim()) {
      return res
        .status(400)
        .json({ success: false, message: '댓글 내용을 입력해주세요.' });
    }

    // ✅ 게시글 존재 확인
    const review = await TravelReview.findById(reviewId);
    if (!review) {
      return res
        .status(404)
        .json({ success: false, message: '게시물을 찾을 수 없습니다.' });
    }

    // ✅ 사용자 정보 조회
    const User = mongoose.model('userdbs');
    const me = await User.findById(req.user.uid);
    if (!me) {
      return res
        .status(401)
        .json({ success: false, message: '사용자를 찾을 수 없습니다.' });
    }

    // ✅ parentId 검증 (있으면 같은 리뷰의 댓글이어야 함)
    let parent = null;
    if (parentId) {
      parent = await Comment.findById(parentId);
      if (!parent) {
        return res
          .status(400)
          .json({ success: false, message: '부모 댓글을 찾을 수 없습니다.' });
      }
      if (String(parent.travelReview) !== String(reviewId)) {
        return res
          .status(400)
          .json({ success: false, message: '부모 댓글과 게시글이 일치하지 않습니다.' });
      }
    }

    // ✅ 댓글/답글 생성
    const newComment = await Comment.create({
      content: content.trim(),
      user: me._id,
      username: me.nickname || me.userId || '익명',
      travelReview: reviewId,
      parent: parent ? parent._id : null,
    });

    // ✅ 게시글의 commentCount 증가
    review.commentCount += 1;
    await review.save();

    res.status(201).json({
      success: true,
      message: '댓글이 작성되었습니다.',
      data: newComment,
    });
  } catch (error) {
    console.error('댓글 작성 오류:', error);
    res
      .status(500)
      .json({ success: false, message: '댓글 작성에 실패했습니다.' });
  }
});

// ✏️ 댓글 수정
router.put(
  '/travel-reviews/:reviewId/comments/:commentId',
  authRequired,
  async (req, res) => {
    try {
      const { commentId } = req.params;
      const { content } = req.body;

      if (!content || !content.trim()) {
        return res
          .status(400)
          .json({ success: false, message: '댓글 내용을 입력해주세요.' });
      }

      const comment = await Comment.findById(commentId);
      if (!comment) {
        return res
          .status(404)
          .json({ success: false, message: '댓글을 찾을 수 없습니다.' });
      }

      // ✅ 작성자 확인
      if (comment.user.toString() !== req.user.uid) {
        return res
          .status(403)
          .json({ success: false, message: '수정 권한이 없습니다.' });
      }

      comment.content = content.trim();
      await comment.save();

      res.json({
        success: true,
        message: '댓글이 수정되었습니다.',
        data: comment,
      });
    } catch (error) {
      console.error('댓글 수정 오류:', error);
      res
        .status(500)
        .json({ success: false, message: '댓글 수정에 실패했습니다.' });
    }
  }
);

// 🗑️ 댓글 삭제 (+ 모든 하위 댓글 일괄 삭제 및 commentCount 보정)
router.delete(
  '/travel-reviews/:reviewId/comments/:commentId',
  authRequired,
  async (req, res) => {
    try {
      const { reviewId, commentId } = req.params;

      const comment = await Comment.findById(commentId);
      if (!comment) {
        return res
          .status(404)
          .json({ success: false, message: '댓글을 찾을 수 없습니다.' });
      }

      // ✅ 작성자 확인
      if (comment.user.toString() !== req.user.uid) {
        return res
          .status(403)
          .json({ success: false, message: '삭제 권한이 없습니다.' });
      }

      // ✅ 모든 하위 댓글 ID 재귀 탐색
      const collectDescendants = async (parentIds) => {
        const children = await Comment.find({ parent: { $in: parentIds } }, '_id').lean();
        if (children.length === 0) return [];
        const childIds = children.map((c) => c._id);
        const descendants = await collectDescendants(childIds);
        return [...childIds, ...descendants];
      };

      const allDescendants = await collectDescendants([commentId]);
      const allToDelete = [commentId, ...allDescendants];

      // ✅ 실제 삭제
      const result = await Comment.deleteMany({ _id: { $in: allToDelete } });

      // ✅ commentCount 정확히 보정
      await TravelReview.findByIdAndUpdate(reviewId, {
        $inc: { commentCount: -result.deletedCount },
      });

      res.json({
        success: true,
        message: '댓글이 삭제되었습니다.',
        deletedCount: result.deletedCount,
      });
    } catch (error) {
      console.error('댓글 삭제 오류:', error);
      res
        .status(500)
        .json({ success: false, message: '댓글 삭제에 실패했습니다.' });
    }
  }
);

module.exports = (app) => {
  app.use('/api', router);
};
