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
        // 导入模型
        const User = require('../app/models/user');
        const Tweet = require('../app/models/tweet');
        
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
        
        // 创建总共100条推文，随机分配给所有用户
        console.log(`Creating 100 tweets randomly distributed among ${allUsers.length} users...`);
        
        for (let i = 0; i < 100; i++) {
            try {
                // 随机选择一个用户
                const randomUser = allUsers[Math.floor(Math.random() * allUsers.length)];
                
                // 随机选择推文内容
                const randomTweet = tweetTemplates[Math.floor(Math.random() * tweetTemplates.length)];
                
                // 生成9月9日到9月10日之间的随机时间
                const startDate = new Date('2024-09-09T00:00:00Z');
                const endDate = new Date('2024-09-10T23:59:59Z');
                const randomTime = new Date(startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime()));
                
                // 创建推文
                const tweet = new Tweet({
                    content: randomTweet,
                    authorId: randomUser._id,
                    authorName: randomUser.name,
                    parentTweetId: null,
                    likesCount: Math.floor(Math.random() * 50), // 随机点赞数0-49
                    createdAt: randomTime,
                    updatedAt: randomTime
                });
                
                await tweet.save();
                
                if ((i + 1) % 20 === 0) {
                    console.log(`   Created ${i + 1}/100 tweets...`);
                }
                
            } catch (error) {
                console.error(`Error creating tweet ${i + 1}:`, error.message);
            }
        }
        
        // 验证结果
        const totalUsers = await User.countDocuments();
        const totalTweets = await Tweet.countDocuments();
        console.log(`\nUser Creation Results:`);
        console.log(`Total users in database: ${totalUsers}`);
        console.log(`Total tweets in database: ${totalTweets}`);
        console.log(`Successfully created: ${createdUsers.length} users`);
        
        // 显示所有用户
        const allUsersInDB = await User.find({}, { name: 1, username: 1, email: 1 });
        console.log('\nAll users in database:');
        allUsersInDB.forEach(user => {
            console.log(`   - ${user.name} (@${user.username}) - ${user.email}`);
        });
        
        // 显示推文统计
        const tweetStats = await Tweet.aggregate([
            { $group: { _id: '$authorName', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);
        
        console.log('\nTweet statistics:');
        tweetStats.forEach(stat => {
            console.log(`   - ${stat._id}: ${stat.count} tweets`);
        });
        
        if (createdUsers.length > 0) {
            console.log('\nUser creation and tweet posting completed successfully!');
        } else {
            console.log('\nNo new users were created (all may already exist)');
        }
        
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
