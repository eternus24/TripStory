const mongoose = require('mongoose');

const travelSiteSchema = new mongoose.Schema({
  siteName: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['숙소', '항공', '투어', '렌트카', '유심', '환전', '패키지']
  },
  description: {
    type: String,
    required: true
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  link: {
    type: String,
    required: true
  },
  icon: {
    type: String,
    default: '🌐'
  },
  features: [{
    type: String
  }],
  pros: [{
    type: String
  }],
  cons: [{
    type: String
  }],
  recommendFor: {
    type: String
  },
  priceRange: {
    type: String,
    enum: ['₩', '₩₩', '₩₩₩', '₩₩₩₩']
  },
  regions: [{
    type: String
  }],
  benefits: {
    type: String
  },
  sortOrder: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('TravelSite', travelSiteSchema);