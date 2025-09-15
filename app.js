const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const cors = require("cors");

// 加载环境变量
require('dotenv').config();

const app = express();

// 配置监听地址和端口
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0'; // 允许外部访问

// 允许跨域（生产环境请按需限制来源）
const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : [
        'http://hezhili.online:3000',
        'https://hezhili.online:3000',
        'http://localhost:3000',
        'https://localhost:3000'
    ];

const corsOptions = {
    origin: allowedOrigins,
    credentials: true,
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(express.static(path.join(__dirname, 'public')));
// 连接 MongoDB
const connectDB = async () => {
    try {
        // 支持从环境变量读取 Mongo 连接信息，便于线上部署
        const mongoUser = process.env.MONGO_USER || '';
        const mongoPass = process.env.MONGO_PASS || '';
        const mongoHost = process.env.MONGO_HOST || '127.0.0.1';
        const mongoPort = process.env.MONGO_PORT || '27017';
        const mongoDB = process.env.MONGO_DB || 'twikk';

        let authPart = '';
        if (mongoUser && mongoPass) {
            authPart = `${encodeURIComponent(mongoUser)}:${encodeURIComponent(mongoPass)}@`;
        }

        const mongoUri = `mongodb://${authPart}${mongoHost}:${mongoPort}/${mongoDB}`;
        await mongoose.connect(mongoUri, {
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
require('./app/models/notification');

// 中间件
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Session 配置
app.use(session({
    secret: process.env.SESSION_SECRET || 'twikk-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production' && process.env.HTTPS === 'true',
        maxAge: 24 * 60 * 60 * 1000 // 24小时
    }
}));

// 设置视图引擎
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'app/views'));

// 静态文件
app.use(express.static(path.join(__dirname, 'public')));

// 路由
const notificationRoutes = require('./config/notificationRoutes');
app.use('/', notificationRoutes);
require('./config/routes')(app);


// 启动服务器
app.listen(PORT, HOST, () => {
    console.log(`Server is running on http://${HOST}:${PORT}`);
    console.log(`Access your app at: http://hezhili.online:${PORT}`);
});
