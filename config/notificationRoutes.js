// config/notificationRoutes.js
const express = require('express');
const router = express.Router();
const path = require('path');
const Notification = require(path.join(__dirname, '..', 'app', 'models', 'notification'));
const Tweet = require(path.join(__dirname, '..', 'app', 'models', 'tweet'));
const notificationsController = require(path.join(__dirname, '..', 'app', 'controllers', 'notifications'));

// 点赞推文路由 (保持不变)
router.post('/like/:tweetId', async (req, res) => {
  if (!req.session.user) return res.status(401).send('Unauthorized');

  const { tweetId } = req.params;
  
  try {
    const tweet = await Tweet.findById(tweetId);
    if (!tweet) return res.status(404).send('Tweet not found');

    // 假设点赞一次，likesCount 加一
    await Tweet.updateOne({ _id: tweetId }, { $inc: { likesCount: 1 } });

    // 如果点赞者不是推文作者，创建通知
    if (tweet.authorId.toString() !== req.session.user.id) {
      await Notification.create({
        type: 'like',
        sender: req.session.user.id,
        recipient: tweet.authorId,
        tweet: tweet._id
      });
    }

    res.redirect('/dashboard');
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// 获取通知路由 (保持不变)
router.get('/notifications', notificationsController.getNotifications);

// 新增：标记所有通知为已读的路由
router.post('/notifications/mark-all-read', notificationsController.markAllAsRead);

module.exports = router;