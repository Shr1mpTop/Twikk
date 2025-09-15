// config/notificationRoutes.js
const express = require('express');
const router = express.Router();
const path = require('path');
const Notification = require(path.join(__dirname, '..', 'app', 'models', 'notification'));
const Tweet = require(path.join(__dirname, '..', 'app', 'models', 'tweet'));
const notificationsController = require(path.join(__dirname, '..', 'app', 'controllers', 'notifications'));

// 点赞推文路由 (保持不变)
// 点赞/取消点赞路由（支持 AJAX）
router.post('/like/:tweetId', async (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Unauthorized' });

  const { tweetId } = req.params;

  try {
    const tweet = await Tweet.findById(tweetId);
    if (!tweet) return res.status(404).json({ error: 'Tweet not found' });

    const userId = req.session.user.id;
    const hasLiked = tweet.likedBy && tweet.likedBy.some(id => id.toString() === userId);

    if (hasLiked) {
      // 取消点赞
      await Tweet.updateOne({ _id: tweetId }, { $inc: { likesCount: -1 }, $pull: { likedBy: userId } });
      return res.json({ ok: true, action: 'unliked', likesCount: Math.max(0, tweet.likesCount - 1) });
    } else {
      // 点赞
      await Tweet.updateOne({ _id: tweetId }, { $inc: { likesCount: 1 }, $addToSet: { likedBy: userId } });

      // 如果点赞者不是推文作者，创建通知
      if (tweet.authorId.toString() !== userId) {
        await Notification.create({
          type: 'like',
          sender: userId,
          recipient: tweet.authorId,
          tweet: tweet._id
        });
      }

      return res.json({ ok: true, action: 'liked', likesCount: tweet.likesCount + 1 });
    }
  } catch (err) {
    console.error('Like toggle error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// 新增：在推文下发表评论并通知作者（支持 AJAX）
router.post('/comment/:tweetId', async (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Unauthorized' });

  const { tweetId } = req.params;
  const content = (req.body.content || '').trim();
  if (!content) return res.status(400).json({ error: 'Comment content required' });

  try {
    const userId = req.session.user.id;
    const authorName = req.session.user.name || req.session.user.username || 'Anonymous';

    // 原子性地将评论 push 到 tweet.comments，并返回更新后的文档
    const updated = await Tweet.findByIdAndUpdate(
      tweetId,
      { $push: { comments: { authorId: userId, authorName, content } } },
      { new: true }
    );

    if (!updated) return res.status(404).json({ error: 'Tweet not found' });

    // 新增的评论是数组的最后一项
    const newComment = updated.comments[updated.comments.length - 1];

    // 如果评论者不是推文作者，创建通知
    if (updated.authorId.toString() !== userId) {
      await Notification.create({
        type: 'reply',
        sender: userId,
        recipient: updated.authorId,
        tweet: updated._id
      });
    }

    return res.json({ ok: true, comment: newComment });
  } catch (err) {
    console.error('Comment error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// 获取通知路由 (保持不变)
router.get('/notifications', notificationsController.getNotifications);

// 新增：标记所有通知为已读的路由
router.post('/notifications/mark-all-read', notificationsController.markAllAsRead);

module.exports = router;