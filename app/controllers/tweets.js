// app/controllers/tweets.js
const Tweet = require('../models/tweet');

// Dashboard timeline
exports.timeline = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  try {
    const tweets = await Tweet.find().sort({ createdAt: -1 }).limit(100).lean();
    res.render('pages/dashboard', { user: req.session.user, tweets });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
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
