// config/routes.js
const path = require('path');

const users  = require(path.join(__dirname, '..', 'app', 'controllers', 'users'));
const tweets = require(path.join(__dirname, '..', 'app', 'controllers', 'tweets'));

module.exports = function (app) {
  // 首页：根据是否登录跳转
  app.get('/', (req, res) => {
    if (req.session.userId) {
      res.redirect('/dashboard');
    } else {
      res.redirect('/login');
    }
  });

  // 注册 / 登录 / 注销
  app.get('/register', users.getRegister);
  app.post('/register', users.postRegister);

  app.get('/login', users.getLogin);
  app.post('/login', users.postLogin);

  app.get('/logout', users.logout);

  // 仪表盘（显示时间线）
  app.get('/dashboard', tweets.timeline);

  // 发推
  app.post('/tweet', tweets.create);
};
