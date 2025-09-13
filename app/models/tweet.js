// app/models/tweet.js
const mongoose = require('mongoose');

const tweetSchema = new mongoose.Schema({
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  authorName: { type: String, required: true },         // 展示用
  content: { type: String, required: true, maxlength: 280 } // 简单限制 280 字
}, { timestamps: true }); // 自动带 createdAt / updatedAt

module.exports = mongoose.model('Tweet', tweetSchema);
