// app/controllers/communities.js
const mongoose = require('mongoose');
const Tweet = require('../models/tweet');

// 显示Communities页面
exports.getCommunities = (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  res.render('pages/communities', {
    user: req.session.user,
    pageStyles: '/css/communities.css'
  });
};

// 显示特定社群的推文
exports.getCommunityTweets = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');

  try {
    const { category } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;

    // 获取该分类的推文
    const tweets = await Tweet.find({ category: category })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // 标记当前用户是否已点赞（与timeline函数保持一致）
    const userId = req.session.user.id;
    const tweetsWithLiked = tweets.map(t => {
      return Object.assign({}, t, { 
        isLikedByCurrentUser: Array.isArray(t.likedBy) && t.likedBy.some(id => id.toString() === userId) 
      });
    });

    const totalTweets = await Tweet.countDocuments({ category: category });
    const hasMore = skip + tweetsWithLiked.length < totalTweets;

    // 获取该分类的统计信息
    const stats = await Tweet.aggregate([
      { $match: { category: category } },
      {
        $group: {
          _id: '$authorName',
          count: { $sum: 1 },
          totalLikes: { $sum: '$likesCount' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.render('pages/community-tweets', {
      user: req.session.user,
      category: category,
      tweets: tweetsWithLiked,
      stats: stats,
      currentPage: page,
      hasMore: hasMore,
      totalTweets: totalTweets,
      pageStyles: '/css/communities.css'
    });

  } catch (error) {
    console.error('Error fetching community tweets:', error);
    res.status(500).render('pages/error', {
      error: 'Failed to load community tweets',
      user: req.session.user
    });
  }
};

// API: 获取更多社群推文（无限滚动）
exports.getMoreCommunityTweets = async (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const { category } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const tweets = await Tweet.find({ category: category })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // 标记当前用户是否已点赞（与timeline函数保持一致）
    const userId = req.session.user.id;
    const tweetsWithLiked = tweets.map(t => {
      return Object.assign({}, t, { 
        isLikedByCurrentUser: Array.isArray(t.likedBy) && t.likedBy.some(id => id.toString() === userId) 
      });
    });

    const totalTweets = await Tweet.countDocuments({ category: category });
    const hasMore = skip + tweetsWithLiked.length < totalTweets;

    res.json({
      tweets: tweetsWithLiked,
      hasMore,
      nextPage: hasMore ? page + 1 : null,
      totalTweets
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};
