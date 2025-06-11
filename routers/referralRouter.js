const express = require('express');
const {
    getRedeemStatus,
    // getRedeemedRecords,
    redeemReferralReward,
    calculateRedeemedPoints,
    updateAdminRedeemRecords,
    adminGetRedeemRecords,
    getSingleRedeemRecord, 
    getReferralCodeByUserId,
    getReferAccountByUserId,
    trackReferral} = require('../controllers/referralController');
 
const referralRouter = express.Router();
const adminRedeemedRouter = express.Router();
 
// Get total rewards and referral history (for a specific user)
referralRouter.get("/redeem-status/:userId",getRedeemStatus);
 
// Get redeemed records for a user
// referralRouter.get("/redeemed/:userId", getRedeemedRecords);
 
// Redeem referral reward
referralRouter.post("/redeem-reward/:referralId",redeemReferralReward);
 
// Calculate redeemed points conversion
referralRouter.post("/calculate-redeemed-points",calculateRedeemedPoints);
 
// Admin Routes
// Update Admin Redeem Records 
adminRedeemedRouter.put("/update-redeem-record/:redeemId",updateAdminRedeemRecords);
 
// Get All Redeem Records to show to Admin Panel
adminRedeemedRouter.get("/redeemed-records", adminGetRedeemRecords);
 
// Get a single redeem record by ID
adminRedeemedRouter.get("/redeemed-record/:redeemId", getSingleRedeemRecord);
referralRouter.get("/referral-code/:userId", getReferralCodeByUserId);
referralRouter.get("/refer-account/:userId", getReferAccountByUserId);
referralRouter.post("/track-referral", trackReferral);
 
module.exports = { referralRouter, adminRedeemedRouter };