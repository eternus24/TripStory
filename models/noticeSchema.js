// models/noticeSchema.js
const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'userdbs', required: true },
  content: { type: String, required: true, trim: true },
  createdAt: { type: Date, default: Date.now }
}, { _id: true });

const noticeSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  content: { type: String, required: true },         // HTML/Markdown 허용
  image_url: { type: String },                        // 선택
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'userdbs' }, // 등록자(관리자)
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'userdbs', default: undefined }],
  comments: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'userdbs' },
    username: { type: String, default: '익명' },
    content: { type: String, required: true, trim: true },
    createdAt: { type: Date, default: Date.now }
  }],
}, { timestamps: true });

noticeSchema.virtual('likesCount').get(function(){ return this.likes?.length || 0; });

module.exports = mongoose.model('notice', noticeSchema);