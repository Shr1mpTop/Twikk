// app/controllers/users.js
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { ethers } = require('ethers');
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

  // Let the pre('save') hook in user.js handle password hashing
    const user = new User({ name, username, email, password });
  await user.save(); // Password will be hashed by the pre('save') hook in user.js

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

// MetaMask login handler
exports.postMetaMaskLogin = async (req, res) => {
  try {
    const { address, signature, message, timestamp } = req.body;

    if (!address || !signature || !message) {
      return res.status(400).json({
        success: false,
        error: 'Missing required authentication data'
      });
    }

    // Verify the signature
    const recoveredAddress = ethers.verifyMessage(message, signature);
    
    if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
      return res.status(400).json({
        success: false,
        error: 'Invalid signature'
      });
    }

    // Check if user exists with this wallet address
    let user = await User.findOne({ walletAddress: address.toLowerCase() });

    if (!user) {
      // Create new user with wallet address
      const username = `user_${address.slice(0, 8)}`;
      const name = `Wallet User ${address.slice(0, 6)}...${address.slice(-4)}`;
      
      user = new User({
        name: name,
        username: username,
        email: `${address.toLowerCase()}@wallet.local`, // Placeholder email
        walletAddress: address.toLowerCase(),
        loginMethod: 'wallet'
      });

      await user.save();
    }

    // Set session
    req.session.userId = user._id.toString();
    req.session.user = {
      id: user._id.toString(),
      name: user.name,
      username: user.username,
      email: user.email,
      walletAddress: user.walletAddress,
      loginMethod: user.loginMethod
    };

    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user._id.toString(),
        name: user.name,
        username: user.username,
        email: user.email,
        walletAddress: user.walletAddress,
        loginMethod: user.loginMethod
      }
    });

  } catch (error) {
    console.error('MetaMask login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed. Please try again later.'
    });
  }
};

// Dashboard fallback
exports.dashboard = (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  res.render('pages/dashboard', { user: req.session.user, tweets: [] });
};
