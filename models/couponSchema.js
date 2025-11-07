// models/couponSchema.js
const mongoose = require('mongoose');
const { Schema, Types } = mongoose;

/**
 * 방문 마일스톤 쿠폰 스키마
 * - region: 지역 단위로 발급/사용
 * - milestone: 0/1/2/3/5/7/9 (0 = 웰컴)
 * - (userId, region, milestone) unique → 중복 발급 방지(멱등)
 */
const CouponSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: 'users', required: true, index: true },
    region: { type: String, required: true, trim: true },

    // 0: 웰컴, 이후 방문 달성 회차
    milestone: { type: Number, required: true, enum: [0, 1, 2, 3, 5, 7, 9] },

    // 발급 유형(가독성)
    tier: {
      type: String,
      required: true,
      enum: ['WELCOME', 'VISIT_1', 'VISIT_2', 'VISIT_3', 'VISIT_5', 'VISIT_7', 'VISIT_9'],
    },

    // 할인율(정수, %)
    discount: { type: Number, required: true, min: 0, max: 100 },

    // active: 사용 가능 / used: 사용 완료 / expired: 만료
    status: { type: String, default: 'active', enum: ['active', 'used', 'expired'] },

    // 유효기간(옵션) — 발급일 + N일
    validUntil: { type: Date },

    // (옵션) 추천 노출용 메타
    producer: {
      name: { type: String },
      badge: { type: String },
      link: { type: String },
    },
    products: [{ type: String }],
  },
  { timestamps: true }
);

// 같은 단계 쿠폰 중복 발급 방지
CouponSchema.index({ userId: 1, region: 1, milestone: 1 }, { unique: true });

module.exports = mongoose.model('coupons', CouponSchema);
