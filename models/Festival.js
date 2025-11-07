// models/Festival.js
const mongoose = require('mongoose');

const festivalSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  location: { type: String, required: true, trim: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  description: { type: String, required: true },
  category: {
    type: String,
    enum: ['불꽃축제', '꽃축제', '빛 축제', '먹거리 축제', '음악·공연 축제', '체험형 축제'],
    default: '기타'
  },
  imageUrl: {
    type: String,
    default: 'https://via.placeholder.com/400x250/1a1a2e/eee?text=Festival'
  },
  contact: { type: String, trim: true },
  website: { type: String, trim: true }
}, { timestamps: true });

module.exports = mongoose.model('Festival', festivalSchema);