// app/models/notification.js
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  // 通知类型，例如 'like' 或 'reply'
  type: {
    type: String,
    required: true,
    enum: ['like', 'reply']
  },
  // 发起通知的用户
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // 接收通知的用户
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // 通知关联的推文
  tweet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tweet',
    required: true
  },
  // 新增：用于存储回复/评论内容的字段
  content: {
    type: String,
    required: false // 评论内容不是必需的，因为点赞通知不需要
  },
  // 通知是否已读
  read: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true // 自动带 createdAt 和 updatedAt
});

module.exports = mongoose.model('Notification', notificationSchema);