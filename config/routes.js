// config/routes.js
const path = require('path');
const { chatController } = require('../app/controllers/grok.js');
const users = require(path.join(__dirname, '..', 'app', 'controllers', 'users'));
// tweets (timeline) feature removed
const communities = require(path.join(__dirname, '..', 'app', 'controllers', 'communities'));

module.exports = function (app) {
  // Home: redirect based on login status
  app.get('/', (req, res) => {
    if (req.session.userId) {
      res.redirect('/dashboard');
    } else {
      res.redirect('/login');
    }
  });

  // Register / Login / Logout
  app.get('/register', users.getRegister);
  app.post('/register', users.postRegister);

  app.get('/login', users.getLogin);
  app.post('/login', users.postLogin);
  
  // MetaMask login
  app.post('/auth/metamask', users.postMetaMaskLogin);
  app.post('/auth/unlink-wallet', users.postUnlinkWallet);

  app.get('/logout', users.logout);

  // Dashboard (timeline)
  const tweetsController = require(path.join(__dirname, '..', 'app', 'controllers', 'tweets'));
  app.get('/dashboard', tweetsController.timeline);

  // Like / Comment APIs for tweets
  app.post('/like/:id', tweetsController.like);
  app.post('/comment/:id', tweetsController.comment);
  app.post('/tweet', tweetsController.create);

  // API: timeline pagination and search
  app.get('/api/tweets', tweetsController.getMoreTweets);
  app.get('/api/search', tweetsController.search);

  
  // Communities page
  app.get('/communities', communities.getCommunities);
  
  // Community tweets page
  app.get('/communities/:category', communities.getCommunityTweets);
  
  // API: get more community tweets (infinite scroll)
  app.get('/api/communities/:category/tweets', communities.getMoreCommunityTweets);

  // GPT chat page
  app.get('/gpt-chat', (req, res) => {
    if (!req.session.user) {
      return res.redirect('/login');
    }
  // Pass req.session.user object to gpt.ejs template
    res.render('pages/gpt', { user: req.session.user, pageStyles: '/css/gpt.css', pageScripts: '/js/Grok.js' });
  });
  app.post("/api/chat", chatController);
};
