// app/controllers/users.js
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = mongoose.model('User');

// Register page
exports.getRegister = (req, res) => {
  res.render('pages/register', { error: null, success: null });
};

// Handle register
// app/controllers/users.js

exports.postRegister = async (req, res) => {
  const { name, username, email, password, confirmPassword } = req.body;

  if (!name || !username || !email || !password || !confirmPassword) {
    return res.render('pages/register', { error: 'Please fill in all fields', success: null });
  }
  if (password !== confirmPassword) {
    return res.render('pages/register', { error: 'Passwords do not match', success: null });
  }

  try {
    const existing = await User.findOne({ email });
    if (existing) {
      return res.render('pages/register', { error: 'Email is already registered', success: null });
    }

    // 移除这一行的哈希，让 user.js 中的 pre('save') 钩子来处理
    const user = new User({ name, username, email, password });
    await user.save(); // 密码在这里被 user.js 中的 pre('save') 钩子自动哈希

    req.session.userId = user._id.toString();
    req.session.user = {
      id: user._id.toString(),
      name: user.name,
      username: user.username,
      email: user.email
    };

    res.redirect('/dashboard');
  } catch (err) {
    console.error(err);
    res.render('pages/register', { error: 'Registration failed. Please try again later', success: null });
  }
};

// Login page
exports.getLogin = (req, res) => {
  res.render('pages/login', { error: null });
};

// Handle login
exports.postLogin = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.render('pages/login', { error: 'Please enter email and password' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.render('pages/login', { error: 'Email is not registered' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.render('pages/login', { error: 'Incorrect password' });
    }

    req.session.userId = user._id.toString();
    req.session.user = {
      id: user._id.toString(),
      name: user.name,
      username: user.username,
      email: user.email
    };

    res.redirect('/dashboard');
  } catch (err) {
    console.error(err);
    res.render('pages/login', { error: 'Login failed. Please try again later' });
  }
};

// Logout
exports.logout = (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
};

// Dashboard fallback
exports.dashboard = (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  res.render('pages/dashboard', { user: req.session.user, tweets: [] });
};
