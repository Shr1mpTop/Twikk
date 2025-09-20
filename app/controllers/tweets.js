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

    // 标记当前用户是否已点赞（与timeline函数保持一致）
    const userId = req.session.user.id;
    const tweetsWithLiked = tweets.map(t => {
      return Object.assign({}, t, { 
        isLikedByCurrentUser: Array.isArray(t.likedBy) && t.likedBy.some(id => id.toString() === userId) 
      });
    });

    const hasMore = tweets.length === limit;

    res.json({
      tweets: tweetsWithLiked,
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
    const tweetData = {
      authorId: req.session.user.id,
      authorName: req.session.user.name || req.session.user.username || 'Anonymous',
      content
    };

    // If a community/category was selected, validate and add
    const allowedCategories = ['general', 'sports', 'politics', 'entertainment'];
    const cat = (req.body.category || '').toString().trim().toLowerCase();
    if (cat && allowedCategories.includes(cat)) {
      tweetData.category = cat;
    } else {
      tweetData.category = 'general';
    }

    const created = await Tweet.create(tweetData);
    // If AJAX (XHR) or client expects JSON, return JSON payload for client-side rendering
    const wantsJson = req.xhr || (req.headers.accept && req.headers.accept.indexOf('application/json') !== -1);
    if (wantsJson) {
      const tweetObj = created.toObject ? created.toObject() : created;
      // mark as not liked by current user by default
      tweetObj.isLikedByCurrentUser = false;
      tweetObj.likesCount = tweetObj.likesCount || 0;
      tweetObj.comments = tweetObj.comments || [];
      return res.json({ ok: true, tweet: tweetObj });
    }

    res.redirect('/dashboard');
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
};

// Like/unlike a tweet
exports.like = async (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const tweetId = req.params.id;
    const userId = req.session.user.id;

    const tweet = await Tweet.findById(tweetId);
    if (!tweet) return res.status(404).json({ error: 'Tweet not found' });

    const alreadyLiked = Array.isArray(tweet.likedBy) && tweet.likedBy.some(id => id.toString() === userId);

    if (alreadyLiked) {
      // Unlike
      tweet.likedBy = tweet.likedBy.filter(id => id.toString() !== userId);
      tweet.likesCount = Math.max(0, (tweet.likesCount || 0) - 1);
      await tweet.save();
      return res.json({ ok: true, likesCount: tweet.likesCount, action: 'unliked' });
    } else {
      // Like
      tweet.likedBy = tweet.likedBy || [];
      tweet.likedBy.push(req.session.user.id);
      tweet.likesCount = (tweet.likesCount || 0) + 1;
      await tweet.save();
      return res.json({ ok: true, likesCount: tweet.likesCount, action: 'liked' });
    }
  } catch (err) {
    console.error('Like error:', err);
    res.status(500).json({ error: 'Like failed' });
  }
};

// Add a comment to a tweet
exports.comment = async (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const tweetId = req.params.id;
    const content = (req.body.content || '').trim();
    if (!content) return res.status(400).json({ error: 'Comment cannot be empty' });

    const tweet = await Tweet.findById(tweetId);
    if (!tweet) return res.status(404).json({ error: 'Tweet not found' });

    const comment = {
      authorId: req.session.user.id,
      authorName: req.session.user.name || req.session.user.username || 'Anonymous',
      content,
      createdAt: new Date()
    };

    tweet.comments = tweet.comments || [];
    tweet.comments.push(comment);
    await tweet.save();

    res.json({ ok: true, comment });
  } catch (err) {
    console.error('Comment error:', err);
    res.status(500).json({ error: 'Comment failed' });
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

    // 标记当前用户是否已点赞（与timeline函数保持一致）
    const userId = req.session.user.id;
    const tweetsWithLiked = tweets.map(t => {
      return Object.assign({}, t, { 
        isLikedByCurrentUser: Array.isArray(t.likedBy) && t.likedBy.some(id => id.toString() === userId) 
      });
    });

    res.json({
      tweets: tweetsWithLiked,
      total: tweetsWithLiked.length,
      query: query
    });
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: 'Search failed' });
  }
};
