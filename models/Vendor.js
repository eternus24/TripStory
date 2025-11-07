// models/Vendor.js
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: String,
  price: Number,
  imageUrl: String,
  tags: [String],
});

const vendorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  region: { 
    type: String, 
    required: true,
    enum: [  // ✅ 17개 지역만 허용
      '서울특별시','부산광역시','대구광역시','인천광역시',
      '광주광역시','대전광역시','울산광역시','세종특별자치시',
      '경기도','강원도','충청북도','충청남도',
      '전라북도','전라남도','경상북도','경상남도',
      '제주특별자치도'
    ]
  },
  description: String,
  products: [productSchema],
  contact: {
    address: String,
    url: String,
  },
  rating: { type: Number, default: 4.5 },
  verified: { type: Boolean, default: false },
}, { timestamps: true });

vendorSchema.index({ name: 1, region: 1 }, { unique: false });

module.exports = mongoose.model('vendor', vendorSchema);