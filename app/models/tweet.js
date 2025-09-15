// app/models/tweet.js
const mongoose = require('mongoose');

const tweetSchema = new mongoose.Schema({
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  authorName: { type: String, required: true },
  content: { type: String, required: true, maxlength: 280 },
  // 推文分类
  category: { type: String, default: 'general' },
  // 新增：点赞计数
  likesCount: { type: Number, default: 0 },
  // 记录点赞用户，便于防止重复点赞和显示当前用户是否已点赞
  likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
  ,
  // 评论列表（嵌入子文档，适合评论量不极高的场景）
  comments: [{
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    authorName: { type: String, required: true },
    content: { type: String, required: true, maxlength: 1000 },
    createdAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Tweet', tweetSchema);
