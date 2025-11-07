// utils/jwt.js
const jwt = require('jsonwebtoken');

exports.signAccessToken = (user) => {
  return jwt.sign(
    // uid + role + tv(tokenVersion) 포함
    { uid: user._id.toString(), role: user.role, tv: user.tokenVersion || 0 },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: '15m' }
  );
};

exports.signRefreshToken = (user) => {
  return jwt.sign(
    { uid: user._id.toString() },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
};