// app/models/tweet.js
const mongoose = require('mongoose');

const tweetSchema = new mongoose.Schema({
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  authorName: { type: String, required: true },
  content: { type: String, required: true, maxlength: 280 },
  // 推文分类
  category: { type: String, default: 'general' }, 
  // 新增：点赞计数
  likesCount: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Tweet', tweetSchema);
