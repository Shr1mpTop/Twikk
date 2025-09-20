// config/notificationRoutes.js
const express = require('express');
const router = express.Router();
const path = require('path');
const Notification = require(path.join(__dirname, '..', 'app', 'models', 'notification'));
const notificationsController = require(path.join(__dirname, '..', 'app', 'controllers', 'notifications'));

// 获取通知的路由
router.get('/notifications', notificationsController.getNotifications);
// 将所有通知标记为已读的路由
router.post('/notifications/mark-all-read', notificationsController.markAllAsRead);

module.exports = router;