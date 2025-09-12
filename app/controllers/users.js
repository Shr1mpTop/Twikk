const mongoose = require('mongoose');
const User = mongoose.model('User');

// 显示注册页面
exports.getRegister = (req, res) => {
    res.render('pages/register', { error: null, success: null });
};

// 处理注册请求
exports.postRegister = async (req, res) => {
    try {
        const { name, username, email, password, confirmPassword } = req.body;

        // 验证密码确认
        if (password !== confirmPassword) {
            return res.render('pages/register', {
                error: '密码确认不匹配',
                success: null
            });
        }

        // 创建新用户
        const user = new User({
            name,
            username,
            email,
            password
        });

        await user.save();

        res.render('pages/register', {
            error: null,
            success: '注册成功！请登录您的账户。'
        });

    } catch (error) {
        let errorMessage = '注册失败，请重试。';

        if (error.code === 11000) {
            if (error.keyPattern.email) {
                errorMessage = '该邮箱已被注册';
            } else if (error.keyPattern.username) {
                errorMessage = '该用户名已被使用';
            }
        }

        res.render('pages/register', {
            error: errorMessage,
            success: null
        });
    }
};

// 显示登录页面
exports.getLogin = (req, res) => {
    res.render('pages/login', { error: null });
};

// 处理登录请求
exports.postLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        // 查找用户
        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            return res.render('pages/login', {
                error: '邮箱或密码错误'
            });
        }

        // 验证密码
        const isMatch = await user.comparePassword(password);

        if (!isMatch) {
            return res.render('pages/login', {
                error: '邮箱或密码错误'
            });
        }

        // 登录成功，设置 session
        req.session.userId = user._id;
        req.session.user = {
            id: user._id,
            name: user.name,
            username: user.username,
            email: user.email
        };

        res.redirect('/dashboard');

    } catch (error) {
        console.error('Login error:', error);
        res.render('pages/login', {
            error: '登录失败，请重试'
        });
    }
};

// 注销
exports.logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Session destroy error:', err);
        }
        res.redirect('/login');
    });
};

// 用户主页
exports.dashboard = (req, res) => {
    if (!req.session.userId) {
        return res.redirect('/login');
    }

    res.render('pages/dashboard', { user: req.session.user });
};