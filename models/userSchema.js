// models/userSchema.js — ✅ profileImage 통합본
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const ProviderSubSchema = new mongoose.Schema(
  {
    id: { type: String, index: true },
    email: { type: String, default: '' },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, unique: true, index: true },
    email: { type: String, default: '' },
    name: { type: String, default: '' },
    nickname: { type: String, default: '' },
    address: { type: String, default: '' },

    role: { type: String, enum: ['user', 'admin'], default: 'user', index: true },
    roles: { type: [String], default: ['user'] },
    isBlocked: { type: Boolean, default: false },

    passwordHash: { type: String, default: '' },
    tokenVersion: { type: Number, default: 0 },
    refreshTokens: { type: [String], default: [] },

    lastLogin: { type: Date },
    lastLoginIp: { type: String },
    lastLoginUA: { type: String },

    // ✅ 통합 필드: profileImage (모두 여기로)
    profileImage: { type: String, default: '/img/profile-placeholder.png' },

    // ✅ 소셜 계정 매핑
    providers: {
      kakao: { type: ProviderSubSchema, default: undefined },
      google: { type: ProviderSubSchema, default: undefined },
    },
    provider: { type: String, enum: ['local', 'kakao', 'google'], default: 'local' },
    providerId: { type: String, default: '' },
  },
  { timestamps: true }
);

// 평문 비밀번호를 해시 처리
userSchema.virtual('password').set(function (plain) {
  this._plainPassword = plain;
});

userSchema.pre('save', async function (next) {
  try {
    if (this._plainPassword) {
      const salt = await bcrypt.genSalt(10);
      this.passwordHash = await bcrypt.hash(this._plainPassword, salt);
    }
    next();
  } catch (err) {
    next(err);
  }
});

userSchema.methods.comparePassword = async function (pw) {
  if (!this.passwordHash) return false;
  return bcrypt.compare(pw, this.passwordHash);
};

// ✅ 안전한 JSON 변환
userSchema.methods.toSafeJSON = function () {
  const obj = this.toObject();
  return {
    id: obj._id.toString(),
    userId: obj.userId,
    email: obj.email,
    name: obj.name || '',
    nickname: obj.nickname || '',
    address: obj.address || '',
    role: obj.role,
    roles: obj.roles,
    isBlocked: !!obj.isBlocked,
    profileImage: obj.profileImage || '',
    lastLogin: obj.lastLogin || null,
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt,
  };
};

mongoose.model('userdbs', userSchema);