// config/notificationRoutes.js
const express = require('express');
const router = express.Router();
const path = require('path');
const Notification = require(path.join(__dirname, '..', 'app', 'models', 'notification'));
const Tweet = require(path.join(__dirname, '..', 'app', 'models', 'tweet'));
const notificationsController = require(path.join(__dirname, '..', 'app', 'controllers', 'notifications'));

// 点赞推文路由
router.post('/like/:tweetId', async (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Unauthorized' });

  const { tweetId } = req.params;

  try {
    const tweet = await Tweet.findById(tweetId);
    if (!tweet) return res.status(404).json({ error: 'Tweet not found' });

    const userId = req.session.user.id;
    const hasLiked = tweet.likedBy && tweet.likedBy.some(id => id.toString() === userId);

    if (hasLiked) {
      await Tweet.updateOne({ _id: tweetId }, { $inc: { likesCount: -1 }, $pull: { likedBy: userId } });
      return res.json({ ok: true, action: 'unliked', likesCount: Math.max(0, tweet.likesCount - 1) });
    } else {
      await Tweet.updateOne({ _id: tweetId }, { $inc: { likesCount: 1 }, $push: { likedBy: userId } });

      await Notification.create({
        type: 'like',
        sender: userId,
        recipient: tweet.authorId,
        tweet: tweet._id
      });
      return res.json({ ok: true, action: 'liked', likesCount: tweet.likesCount + 1 });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// 评论推文路由 (已修改)
router.post('/comment/:tweetId', async (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Unauthorized' });

  const { tweetId } = req.params;
  const content = (req.body.content || '').trim();
  if (!content) return res.status(400).json({ error: 'Comment content required' });

  try {
    const userId = req.session.user.id;
    const authorName = req.session.user.name || req.session.user.username || 'Anonymous';

    const updated = await Tweet.findByIdAndUpdate(
      tweetId,
      { $push: { comments: { authorId: userId, authorName, content } } },
      { new: true }
    );

    if (!updated) return res.status(404).json({ error: 'Tweet not found' });

    const newComment = updated.comments[updated.comments.length - 1];

    // **修改点：在创建通知时，增加 content 字段来存储评论内容**
    await Notification.create({
      type: 'reply',
      sender: userId,
      recipient: updated.authorId,
      tweet: updated._id,
      content: newComment.content // 存储评论内容
    });

    return res.json({ ok: true, comment: newComment });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// 获取通知的路由
router.get('/notifications', notificationsController.getNotifications);
// 将所有通知标记为已读的路由
router.post('/notifications/mark-all-read', notificationsController.markAllAsRead);

module.exports = router;