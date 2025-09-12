const users = require('../app/controllers/users');

module.exports = function (app) {
    // 首页重定向到登录
    app.get('/', (req, res) => {
        if (req.session.userId) {
            res.redirect('/dashboard');
        } else {
            res.redirect('/login');
        }
    });

    // 注册路由
    app.get('/register', users.getRegister);
    app.post('/register', users.postRegister);

    // 登录路由
    app.get('/login', users.getLogin);
    app.post('/login', users.postLogin);

    // 注销路由
    app.get('/logout', users.logout);

    // 用户主页
    app.get('/dashboard', users.dashboard);
};