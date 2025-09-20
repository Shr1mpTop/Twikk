// script/create-users.js
// 创建新用户脚本：创建LBJ23、MJ23、CR7、LM10四个用户并发布随机推文

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// 连接数据库
const connectDB = async () => {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/twikk', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
};

// 创建新用户
const createUsers = async () => {
    try {
    // Import models
    const User = require('../app/models/user');
        
        console.log('Starting to create new users...');
        
        // 新用户数据
        const newUsers = [
            {
                name: "LeBron James",
                username: "LBJ23",
                email: "lebron@nba.com",
                password: "123456"
            },
            {
                name: "Michael Jordan",
                username: "MJ23", 
                email: "jordan@nba.com",
                password: "123456"
            },
            {
                name: "Cristiano Ronaldo",
                username: "CR7",
                email: "ronaldo@football.com",
                password: "123456"
            },
            {
                name: "Lionel Messi",
                username: "LM10",
                email: "messi@football.com", 
                password: "123456"
            },
            {
                name: "Donald Trump",
                username: "realDonaldTrump",
                email: "trump@usa.com",
                password: "123456"
            },
            {
                name: "Ryan Gosling",
                username: "RyanGosling",
                email: "gosling@hollywood.com",
                password: "123456"
            },
            {
                name: "Community TV",
                username: "CommunityTV",
                email: "community@nbc.com",
                password: "123456"
            }
        ];
        
        console.log(`Creating ${newUsers.length} users...`);
        
        // 推文内容模板
        const tweetTemplates = [
            "LBJ is the goat",
            "MJ is the goat", 
            "CR7 is the goat",
            "Messi is the goat",
            "LBJ is not the goat",
            "MJ is not the goat",
            "CR7 is not the goat",
            "Messi is not the goat"
        ];
        
        // 创建用户
        const createdUsers = [];
        const allUsers = [];
        
        for (const userData of newUsers) {
            try {
                // 检查用户是否已存在
                let user = await User.findOne({ 
                    $or: [
                        { username: userData.username },
                        { email: userData.email }
                    ]
                });
                
                if (user) {
                    console.log(`User ${userData.username} already exists`);
                } else {
                    // 创建新用户
                    user = new User(userData);
                    await user.save();
                    createdUsers.push(user);
                    console.log(`Created user: ${userData.name} (@${userData.username})`);
                }
                
                allUsers.push(user);
                
            } catch (error) {
                console.error(`Error processing user ${userData.username}:`, error.message);
            }
        }
        
        // Tweet creation removed. This script now only creates users.
        const totalUsers = await User.countDocuments();
        console.log(`\nUser Creation Results:`);
        console.log(`Total users in database: ${totalUsers}`);
        console.log(`Successfully created: ${createdUsers.length} users`);

        // List users
        const allUsersInDB = await User.find({}, { name: 1, username: 1, email: 1 });
        console.log('\nAll users in database:');
        allUsersInDB.forEach(user => {
            console.log(`   - ${user.name} (@${user.username}) - ${user.email}`);
        });
        
    } catch (error) {
        console.error('Error during user creation:', error);
    } finally {
        mongoose.connection.close();
        console.log('Database connection closed');
    }
};

// 执行用户创建
const main = async () => {
    console.log('Starting user creation script...\n');
    await connectDB();
    await createUsers();
};

// 运行脚本
main().catch(console.error);
