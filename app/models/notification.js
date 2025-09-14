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
  // 通知是否已读
  read: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true // 自动带 createdAt 和 updatedAt
});

module.exports = mongoose.model('Notification', notificationSchema);