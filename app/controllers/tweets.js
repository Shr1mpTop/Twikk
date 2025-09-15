// app/controllers/tweets.js
const Tweet = require('../models/tweet');

// Dashboard timeline
exports.timeline = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  try {
    const tweets = await Tweet.find().sort({ createdAt: -1 }).limit(20).lean();

    // 标记当前用户是否已点赞（便于视图渲染）
    const userId = req.session.user.id;
    const tweetsWithLiked = tweets.map(t => {
      return Object.assign({}, t, { isLikedByCurrentUser: Array.isArray(t.likedBy) && t.likedBy.some(id => id.toString() === userId) });
    });

    res.render('pages/dashboard', { user: req.session.user, tweets: tweetsWithLiked });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
};

// API: Get more tweets (for infinite scroll)
exports.getMoreTweets = async (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const tweets = await Tweet.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const hasMore = tweets.length === limit;

    res.json({
      tweets,
      hasMore,
      nextPage: hasMore ? page + 1 : null
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Create tweet
exports.create = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');

  const content = (req.body.content || '').trim();
  if (!content) return res.redirect('/dashboard');

  try {
    await Tweet.create({
      authorId: req.session.user.id,
      authorName: req.session.user.name || req.session.user.username || 'Anonymous',
      content
    });
    res.redirect('/dashboard');
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
};

// Search tweets
exports.search = async (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const query = req.query.q;
    if (!query || query.trim().length === 0) {
      return res.json({ tweets: [], total: 0 });
    }

    // 搜索推文内容
    const tweets = await Tweet.find({
      content: { $regex: query, $options: 'i' }
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    res.json({
      tweets,
      total: tweets.length,
      query: query
    });
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: 'Search failed' });
  }
};
