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
        
        // 创建分类推文
        console.log(`Creating categorized tweets...`);
        
        // 1. 创建100条随机体育推文（原有用户）
        const sportsUsers = allUsers.filter(user => 
            ['lbj23', 'mj23', 'cr7', 'lm10'].includes(user.username)
        );
        
        console.log(`Creating 100 sports tweets...`);
        for (let i = 0; i < 100; i++) {
            try {
                const randomUser = sportsUsers[Math.floor(Math.random() * sportsUsers.length)];
                const randomTweet = tweetTemplates[Math.floor(Math.random() * tweetTemplates.length)];
                
                const startDate = new Date('2024-09-09T00:00:00Z');
                const endDate = new Date('2024-09-10T23:59:59Z');
                const randomTime = new Date(startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime()));
                
                const tweet = new Tweet({
                    content: randomTweet,
                    authorId: randomUser._id,
                    authorName: randomUser.name,
                    category: 'sports',
                    likesCount: Math.floor(Math.random() * 50),
                    createdAt: randomTime,
                    updatedAt: randomTime
                });
                
                await tweet.save();
                
                if ((i + 1) % 20 === 0) {
                    console.log(`   Created ${i + 1}/100 sports tweets...`);
                }
            } catch (error) {
                console.error(`Error creating sports tweet ${i + 1}:`, error.message);
            }
        }
        
        // 2. 创建Trump的政治推文
        const trumpUser = allUsers.find(user => user.username === 'realdonaldtrump');
        if (trumpUser) {
            console.log(`Creating Trump's political tweets...`);
            const trumpTweets = ['MAGA！！！！', 'Y.M.C.A!!!'];
            
            for (let i = 0; i < 20; i++) {
                try {
                    const randomTweet = trumpTweets[Math.floor(Math.random() * trumpTweets.length)];
                    const startDate = new Date('2024-09-09T00:00:00Z');
                    const endDate = new Date('2024-09-10T23:59:59Z');
                    const randomTime = new Date(startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime()));
                    
                    const tweet = new Tweet({
                        content: randomTweet,
                        authorId: trumpUser._id,
                        authorName: trumpUser.name,
                        category: 'politics',
                        likesCount: Math.floor(Math.random() * 100),
                        createdAt: randomTime,
                        updatedAt: randomTime
                    });
                    
                    await tweet.save();
                } catch (error) {
                    console.error(`Error creating Trump tweet ${i + 1}:`, error.message);
                }
            }
        }
        
        // 3. 创建Ryan Gosling的娱乐推文
        const ryanUser = allUsers.find(user => user.username === 'ryangosling');
        if (ryanUser) {
            console.log(`Creating Ryan Gosling's entertainment tweets...`);
            const ryanTweets = ['I drive', '我，驱动'];
            
            for (let i = 0; i < 15; i++) {
                try {
                    const randomTweet = ryanTweets[Math.floor(Math.random() * ryanTweets.length)];
                    const startDate = new Date('2024-09-09T00:00:00Z');
                    const endDate = new Date('2024-09-10T23:59:59Z');
                    const randomTime = new Date(startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime()));
                    
                    const tweet = new Tweet({
                        content: randomTweet,
                        authorId: ryanUser._id,
                        authorName: ryanUser.name,
                        category: 'entertainment',
                        likesCount: Math.floor(Math.random() * 80),
                        createdAt: randomTime,
                        updatedAt: randomTime
                    });
                    
                    await tweet.save();
                } catch (error) {
                    console.error(`Error creating Ryan tweet ${i + 1}:`, error.message);
                }
            }
        }
        
        // 4. 创建Community TV的娱乐推文
        const communityUser = allUsers.find(user => user.username === 'communitytv');
        if (communityUser) {
            console.log(`Creating Community TV's entertainment tweets...`);
            
            for (let i = 0; i < 10; i++) {
                try {
                    const startDate = new Date('2024-09-09T00:00:00Z');
                    const endDate = new Date('2024-09-10T23:59:59Z');
                    const randomTime = new Date(startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime()));
                    
                    const tweet = new Tweet({
                        content: 'SIX SEASONS AND A MOVIE',
                        authorId: communityUser._id,
                        authorName: communityUser.name,
                        category: 'entertainment',
                        likesCount: Math.floor(Math.random() * 200),
                        createdAt: randomTime,
                        updatedAt: randomTime
                    });
                    
                    await tweet.save();
                } catch (error) {
                    console.error(`Error creating Community tweet ${i + 1}:`, error.message);
                }
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
        
        console.log('\nTweet statistics by author:');
        tweetStats.forEach(stat => {
            console.log(`   - ${stat._id}: ${stat.count} tweets`);
        });
        
        // 显示分类统计
        const categoryStats = await Tweet.aggregate([
            { $group: { _id: '$category', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);
        
        console.log('\nTweet statistics by category:');
        categoryStats.forEach(stat => {
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
