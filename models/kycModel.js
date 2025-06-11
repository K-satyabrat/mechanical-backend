const mongoose = require('mongoose');
 
const kycSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    aadhaarNumber: {
        type: String,
        default: null
    },
    aadhaarFront: {
        type: String, // URL or file path
        default: null
    },
    aadhaarBack: {
        type: String, // URL or file path
        default: null
    },
    location: {
        type: String,
         default: null
    },
    shopPhoto: {
        type: String, // URL or file path
         default: null
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});
 
const KYC = mongoose.model('KYC', kycSchema);
module.exports = KYC;