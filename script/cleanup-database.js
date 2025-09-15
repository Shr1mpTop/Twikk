// script/cleanup-database.js
// 清理数据库脚本：删除除了@e.ntu.edu.sg域名外的所有用户及其推文

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

// 清理数据库
const cleanupDatabase = async () => {
    try {
        // 导入模型
        const User = require('../app/models/user');
        const Tweet = require('../app/models/tweet');
        const Notification = require('../app/models/notification');
        
        console.log('Starting database cleanup...');
        
        // 1. 查找所有@e.ntu.edu.sg域名的用户
        const ntuUsers = await User.find({ email: { $regex: /@e\.ntu\.edu\.sg$/ } });
        if (ntuUsers.length === 0) {
            console.log('No users with @e.ntu.edu.sg email found!');
            return;
        }
        
        console.log(`Found ${ntuUsers.length} users with @e.ntu.edu.sg email:`);
        ntuUsers.forEach(user => {
            console.log(`  - ${user.name} (${user.email})`);
        });
        
        // 2. 删除所有推文
        const deletedTweets = await Tweet.deleteMany({});
        console.log(`Deleted ${deletedTweets.deletedCount} tweets`);
        
        // 3. 删除所有通知
        const deletedNotifications = await Notification.deleteMany({});
        console.log(`Deleted ${deletedNotifications.deletedCount} notifications`);
        
        // 4. 删除除了@e.ntu.edu.sg域名外的所有用户
        const deletedUsers = await User.deleteMany({ 
            email: { $not: { $regex: /@e\.ntu\.edu\.sg$/ } }
        });
        console.log(`Deleted ${deletedUsers.deletedCount} users (excluding @e.ntu.edu.sg users)`);
        
        // 5. 验证结果
        const remainingUsers = await User.countDocuments();
        const remainingTweets = await Tweet.countDocuments();
        const remainingNotifications = await Notification.countDocuments();
        
        console.log('\nCleanup Results:');
        console.log(`Remaining users: ${remainingUsers}`);
        console.log(`Remaining tweets: ${remainingTweets}`);
        console.log(`Remaining notifications: ${remainingNotifications}`);
        
        // 显示保留的用户
        const keptUsers = await User.find({}, { name: 1, email: 1 });
        console.log('\nKept users:');
        keptUsers.forEach(user => {
            console.log(`  - ${user.name} (${user.email})`);
        });
        
        if (remainingTweets === 0 && remainingNotifications === 0) {
            console.log('Database cleanup completed successfully!');
        } else {
            console.log('Cleanup may not have completed as expected');
        }
        
    } catch (error) {
        console.error('Error during cleanup:', error);
    } finally {
        mongoose.connection.close();
        console.log('Database connection closed');
    }
};

// 执行清理
const main = async () => {
    console.log('Starting database cleanup script...\n');
    await connectDB();
    await cleanupDatabase();
};

// 运行脚本
main().catch(console.error);
