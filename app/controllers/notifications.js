// app/controllers/notifications.js
const mongoose = require('mongoose');
const Notification = mongoose.model('Notification');

// 新增：用于将所有通知标记为已读的控制器
exports.markAllAsRead = async (req, res) => {
  if (!req.session.user) {
    return res.status(401).send('Unauthorized');
  }

  try {
    await Notification.updateMany(
      { recipient: req.session.user.id, read: false },
      { $set: { read: true } }
    );
    res.redirect('/notifications?filter=all'); // 重定向到全部通知页面
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
};

// 修改：获取通知的控制器，增加筛选功能
exports.getNotifications = async (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }

  try {
    const filter = req.query.filter || 'all'; // 默认为 'all'
    let query = { recipient: req.session.user.id };

    if (filter === 'unread') {
      query.read = false;
    } else if (filter === 'likes') {
      query.type = 'like';
    } else if (filter === 'replies') {
      query.type = 'reply';
    }

    const notifications = await Notification.find(query)
      .populate('sender', 'username name')
      .populate('tweet', 'content')
      .sort({ createdAt: -1 })
      .lean();
    
    // 将 filter 变量传递给 EJS 模板
    res.render('pages/notifications', { 
      user: req.session.user, 
      notifications, 
      filter,
      pageStyles: '/css/notification.css'
    });
    
    // 如果是 “全部” 页面，将未读通知标记为已读
    if (filter === 'all') {
      await Notification.updateMany(
        { recipient: req.session.user.id, read: false },
        { $set: { read: true } }
      );
    }
    
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
};