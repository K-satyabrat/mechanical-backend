const mongoose = require('mongoose');
 
const userSchema = new mongoose.Schema({
    userId: { type: String, unique: true, required: true },
    mpin: { type: String, required: true },
    fullName: { type: String, default: null },
    address: { type: String, default: null },
    gender: { type: String, enum: ['male', 'female', 'other'], default: null }, 
    phone: { type: String,  default: null},
    email: { type: String,  default: null },
    bio: { type: String, default: null },
    image: { type: String, default: null },
    isBlock:{type:Boolean,default:false},
    isKycSubmitted:{type:Boolean,default:false},
}, { timestamps: true });
 
const User= mongoose.model('User', userSchema);
module.exports =  User 