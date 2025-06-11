const mongoose = require('mongoose');
 
const referralPointsSchema = new mongoose.Schema({
    amount:{
        type:Number,
        required : true
    }
},{ timestamps: true });
 
const ReferralPoints = mongoose.model('ReferralPoints', referralPointsSchema);
 
module.exports = ReferralPoints;