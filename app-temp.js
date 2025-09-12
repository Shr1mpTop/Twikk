const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const bcrypt = require('bcrypt');

const app = express();
const PORT = process.env.PORT || 3000;

// 临时内存存储用户数据（仅用于测试）
let users = [];

// 中间件
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Session 配置
app.use(session({
  secret: 'twikk-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));

// 设置视图引擎
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'app/views'));

// 静态文件
app.use(express.static(path.join(__dirname, 'public')));

// 临时控制器函数
const tempUsers = {
  getRegister: (req, res) => {
    res.render('pages/register', { error: null, success: null });
  },

  postRegister: async (req, res) => {
    try {
      const { name, username, email, password, confirmPassword } = req.body;

      if (password !== confirmPassword) {
        return res.render('pages/register', { 
          error: '密码确认不匹配', 
          success: null 
        });
      }

      // 检查用户是否已存在
      const existingUser = users.find(u => u.email === email || u.username === username);
      if (existingUser) {
        return res.render('pages/register', { 
          error: '用户名或邮箱已存在', 
          success: null 
        });
      }

      // 加密密码
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // 保存用户到内存
      const user = {
        id: users.length + 1,
        name,
        username,
        email,
        password: hashedPassword,
        createdAt: new Date()
      };
      users.push(user);

      console.log('New user registered:', { name, username, email, id: user.id });
      console.log('Total users in memory:', users.length);

      res.render('pages/register', { 
        error: null, 
        success: '注册成功！请登录您的账户。' 
      });

    } catch (error) {
      console.error('Registration error:', error);
      res.render('pages/register', { 
        error: '注册失败，请重试。', 
        success: null 
      });
    }
  },

  getLogin: (req, res) => {
    res.render('pages/login', { error: null });
  },

  postLogin: async (req, res) => {
    try {
      const { email, password } = req.body;

      const user = users.find(u => u.email === email);
      
      if (!user) {
        return res.render('pages/login', { 
          error: '邮箱或密码错误' 
        });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      
      if (!isMatch) {
        return res.render('pages/login', { 
          error: '邮箱或密码错误' 
        });
      }

      // 登录成功，设置 session
      req.session.userId = user.id;
      req.session.user = {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email
      };

      console.log('User logged in:', user.email);
      res.redirect('/dashboard');

    } catch (error) {
      console.error('Login error:', error);
      res.render('pages/login', { 
        error: '登录失败，请重试' 
      });
    }
  },

  logout: (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error('Session destroy error:', err);
      }
      res.redirect('/login');
    });
  },

  dashboard: (req, res) => {
    if (!req.session.userId) {
      return res.redirect('/login');
    }
    
    res.render('pages/dashboard', { user: req.session.user });
  }
};

// 路由
app.get('/', (req, res) => {
  if (req.session.userId) {
    res.redirect('/dashboard');
  } else {
    res.redirect('/login');
  }
});

app.get('/register', tempUsers.getRegister);
app.post('/register', tempUsers.postRegister);
app.get('/login', tempUsers.getLogin);
app.post('/login', tempUsers.postLogin);
app.get('/logout', tempUsers.logout);
app.get('/dashboard', tempUsers.dashboard);

// 添加一个查看所有用户的路由（仅用于测试）
app.get('/debug/users', (req, res) => {
  res.json({
    totalUsers: users.length,
    users: users.map(u => ({
      id: u.id,
      name: u.name,
      username: u.username,
      email: u.email,
      createdAt: u.createdAt
    }))
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📝 Register: http://localhost:${PORT}/register`);
  console.log(`🔑 Login: http://localhost:${PORT}/login`);
  console.log(`🐛 Debug users: http://localhost:${PORT}/debug/users`);
  console.log('💾 Using in-memory storage (no MongoDB required)');
});