const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.static(path.join(__dirname, 'public')));
// 连接 MongoDB
const connectDB = async () => {
    try {
    await mongoose.connect('mongodb://127.0.0.1:27017/twikk', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        console.log('Connected to MongoDB');
    } catch (error) {
        console.log('MongoDB connection error:', error);
        console.log('Please make sure MongoDB is running. Try: brew services start mongodb-community@8.0');
        process.exit(1);
    }
};

connectDB();

mongoose.connection.on('connected', () => {
    console.log('MongoDB connected successfully');
});

mongoose.connection.on('error', (err) => {
    console.log('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('MongoDB disconnected');
});

// 导入模型
require('./app/models/user');
require('./app/models/tweet');


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

// 路由
require('./config/routes')(app);

// 启动服务器
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});