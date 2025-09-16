// app/controllers/users.js
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { ethers } = require('ethers');
const User = mongoose.model('User');

// Register page
exports.getRegister = (req, res) => {
  // If a wallet address is provided via query (from MetaMask flow), pass it to the view
  const wallet = req.query.wallet || '';
  res.render('pages/register', { error: null, success: null, walletAddress: wallet });
};

// Handle register
// app/controllers/users.js

exports.postRegister = async (req, res) => {
  const { name, username, email, password, confirmPassword, walletAddress } = req.body;

  if (!name || !username || !email || !password || !confirmPassword) {
    return res.render('pages/register', { error: 'Please fill in all fields', success: null, walletAddress: walletAddress || '' });
  }
  if (password !== confirmPassword) {
    return res.render('pages/register', { error: 'Passwords do not match', success: null, walletAddress: walletAddress || '' });
  }

  try {
    // Check for existing email or username to give clearer feedback
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.render('pages/register', { error: 'Email is already registered', success: null, walletAddress: walletAddress || '' });
    }
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.render('pages/register', { error: 'Username is already taken', success: null, walletAddress: walletAddress || '' });
    }

    // If walletAddress provided, normalize and ensure no conflict
    let normalizedWallet;
    if (walletAddress) {
      normalizedWallet = walletAddress.toLowerCase();
      const conflict = await User.findOne({ walletAddress: normalizedWallet });
      if (conflict) {
        return res.render('pages/register', { error: 'This wallet is already linked to another account', success: null });
      }
    }

    // Let the pre('save') hook in user.js handle password hashing
    const userData = { name, username, email, password };
    if (normalizedWallet) userData.walletAddress = normalizedWallet;

    const user = new User(userData);
    await user.save(); // Password will be hashed by the pre('save') hook in user.js

    req.session.userId = user._id.toString();
    req.session.user = {
      id: user._id.toString(),
      name: user.name,
      username: user.username,
      email: user.email
      ,walletAddress: user.walletAddress,
      loginMethod: user.loginMethod
    };

    res.redirect('/dashboard');
  } catch (err) {
    console.error('Registration error', err);
    // Handle duplicate key error from MongoDB
    if (err && err.code === 11000) {
      const key = Object.keys(err.keyValue || {})[0] || 'field';
      return res.render('pages/register', { error: `${key} already exists`, success: null, walletAddress: walletAddress || '' });
    }
    // Validation errors
    if (err && err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message).join('; ');
      return res.render('pages/register', { error: messages || 'Validation failed', success: null, walletAddress: walletAddress || '' });
    }

    res.render('pages/register', { error: 'Registration failed. Please try again later', success: null, walletAddress: walletAddress || '' });
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
    const { address, signature, message } = req.body;

    if (!address) {
      return res.status(400).json({ success: false, error: 'Missing wallet address' });
    }

    // If signature and message are provided, verify ownership.
    if (signature && message) {
      try {
        const recoveredAddress = ethers.verifyMessage(message, signature);
        if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
          return res.status(400).json({ success: false, error: 'Invalid signature' });
        }
      } catch (e) {
        console.error('Signature verify error', e);
        return res.status(400).json({ success: false, error: 'Signature verification failed' });
      }
    }

    const normalized = address.toLowerCase();

    // If user is already logged in, bind this wallet to their account
    if (req.session && req.session.userId) {
      // Check if another account already has this wallet
      const conflict = await User.findOne({ walletAddress: normalized });
      if (conflict && conflict._id.toString() !== req.session.userId) {
        return res.status(409).json({ success: false, error: 'This wallet is already linked to another account' });
      }

      // Use atomic update to ensure DB is updated
      const updated = await User.findByIdAndUpdate(
        req.session.userId,
        { $set: { walletAddress: normalized } },
        { new: true }
      );

      if (!updated) {
        console.error('Failed to update user with wallet during bind', { userId: req.session.userId, wallet: normalized });
        return res.status(500).json({ success: false, error: 'Failed to link wallet' });
      }

      // refresh session user
      req.session.user = {
        id: updated._id.toString(),
        name: updated.name,
        username: updated.username,
        email: updated.email,
        walletAddress: updated.walletAddress,
        loginMethod: updated.loginMethod
      };

      console.log('Wallet bind successful', { userId: updated._id.toString(), wallet: updated.walletAddress });

      return res.json({ success: true, message: 'Wallet linked to your account', user: req.session.user });
    }

    // Not logged in: only allow login if a user is already linked to this wallet
    const user = await User.findOne({ walletAddress: normalized });
    if (user) {
      req.session.userId = user._id.toString();
      req.session.user = {
        id: user._id.toString(),
        name: user.name,
        username: user.username,
        email: user.email,
        walletAddress: user.walletAddress,
        loginMethod: user.loginMethod
      };

      console.log('Wallet login successful', { userId: user._id.toString(), wallet: user.walletAddress });

      return res.json({ success: true, message: 'Login successful', user: req.session.user });
    }

    // No user linked to wallet — do not auto-create a separate wallet-only account.
    return res.status(404).json({
      success: false,
      error: 'No account linked to this wallet. Please log in with your username/email and link the wallet in account settings.'
    });
  } catch (error) {
    console.error('MetaMask login error:', error);
    res.status(500).json({ success: false, error: 'Login failed. Please try again later.' });
  }
};

// Unlink wallet from logged-in user
exports.postUnlinkWallet = async (req, res) => {
  try {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }
    // Atomically remove walletAddress field
    const updated = await User.findByIdAndUpdate(
      req.session.userId,
      { $unset: { walletAddress: '' } },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // refresh session
    req.session.user = {
      id: updated._id.toString(),
      name: updated.name,
      username: updated.username,
      email: updated.email,
      walletAddress: updated.walletAddress,
      loginMethod: updated.loginMethod
    };
    console.log('Wallet unlinked', { userId: updated._id.toString() });

    res.json({ success: true, message: 'Wallet unlinked', user: req.session.user });
  } catch (err) {
    console.error('Unlink wallet error', err);
    res.status(500).json({ success: false, error: 'Failed to unlink wallet' });
  }
};

// Dashboard fallback
exports.dashboard = (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  res.render('pages/dashboard', { user: req.session.user, tweets: [] });
};
