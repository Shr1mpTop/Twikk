const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: function() {
           // Ethereum wallet address for MetaMask login
            return !this.walletAddress; // Password is required only if no wallet address
        },
        minlength: 6
    },
    walletAddress: {
        type: String,
        unique: true,
        sparse: true, // Allows multiple null values
        trim: true,
        lowercase: true
    },
    loginMethod: {
        type: String,
        enum: ['email', 'wallet'],
        default: 'email'
    }
}, {
    timestamps: true
});

// Password hashing middleware
UserSchema.pre('save', async function (next) {
    if (!this.isModified('password') || !this.password) return next();

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Password verification method
UserSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

// Hide password when converting to JSON
UserSchema.methods.toJSON = function () {
    const user = this.toObject();
    delete user.password;
    return user;
};

module.exports = mongoose.model('User', UserSchema);