const mongoose = require("mongoose");
const Referral = require("../models/referralModel");
const RefferalPoints = require("../models/refferalpointsModel")
const { findOne } = require("../models/productModel");
 
// Get Redeem Status
const getRedeemStatus = async (req, res) => {
    try {
        const { userId } = req.params;
 
        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: "Invalid User ID", success: false });
        }
 
        // Fetch referral data and include redeemHistory
        const referral = await Referral.findOne({ userId })
            .select("earnings redeemHistory")
            .lean();

        if (referral && Array.isArray(referral.redeemHistory)) {
            referral.redeemHistory.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }
 
        if (!referral) {
            return res.status(404).json({ message: "Referral record not found", success: false });
        }
 
        // Ensure earnings object exists to prevent undefined property access
        const earnings = referral.earnings || { totalPoints: 0, redeemPoints: 0 };
 
        return res.status(200).json({
            message: "Redeem Status retrieved successfully",
            data: {
                totalPoints: earnings.totalPoints,
                redeemHistory: referral.redeemHistory || [], // Ensure it's an array
            },
            success: true,
        });
    } catch (error) {
        console.error("Error fetching redeem status and referral history:", error);
        return res.status(500).json({ message: "Internal server error", success: false });
    }
};
 
// Redeem Referral Reward
const redeemReferralReward = async (req, res) => {
    try {
      const { referralId } = req.params;
      const { reward, bankIfscCode, accountNumber, bankName, upiId } = req.body;
  
     
      // Validate referralId
      if (!mongoose.Types.ObjectId.isValid(referralId)) {
        return res.status(400).json({ message: "Invalid Referral ID", success: false });
      }
  
      // Validate reward
      if (!reward || typeof reward !== "number" || reward < 100) {
        return res.status(400).json({ message: "Minimum redeemable amount is 100 points", success: false });
      }
  
      // Fetch referral
      const referral = await Referral.findById(referralId).populate("userId", "isBlock").lean();
      if (!referral) {
        return res.status(404).json({ message: "Referral not found", success: false });
      }
  
      // Check block status
      if (referral.userId?.isBlock) {
        return res.status(403).json({ message: "User is blocked from redeeming rewards", success: false });
      }
  
      // Calculate available points
      const earnings = referral.earnings || { totalPoints: 0, redeemPoints: 0 };
      const availablePoints = earnings.totalPoints - earnings.redeemPoints;
  
      if (availablePoints < reward) {
        return res.status(400).json({ message: "Insufficient reward balance", success: false });
      }
  
      // Ensure at least one payment method
      if (!bankIfscCode && !accountNumber && !upiId && !bankName) {
        return res.status(400).json({ message: "At least one payment method is required", success: false });
      }
  
      const paymentDetails = {};
  
      // Bank details validation
      if (bankIfscCode || accountNumber || bankName) {
        if (!bankIfscCode || !accountNumber || !bankName) {
          return res.status(400).json({ message: "Incomplete bank details", success: false });
        }
  
        const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
        const accountRegex = /^\d{9,18}$/;
  
        if (!ifscRegex.test(bankIfscCode)) {
          return res.status(400).json({ message: "Invalid IFSC Code", success: false });
        }
  
        if (!accountRegex.test(accountNumber)) {
          return res.status(400).json({ message: "Invalid Account Number", success: false });
        }
  
        paymentDetails.bankDetails = {
          bankName,
          accountNumber,
          ifscCode: bankIfscCode,
        };
      }
  
      // UPI details validation
      if (upiId) {
        const upiRegex = /^[\w.-]+@[\w.-]+$/;
        if (!upiRegex.test(upiId)) {
          return res.status(400).json({ message: "Invalid UPI ID format", success: false });
        }
  
        paymentDetails.upiDetails = { upiId };
      }

      const refferalPoints = await RefferalPoints.findOne({}).select("-_id -updatedAt")

      const redeemAmount = (reward / 100) * refferalPoints.amount; 
  
      // Prepare redeem entry
      const redemptionEntry = {
        type: "Redeemed",
        status: "Pending",
        points: reward,
        amount: redeemAmount,
        paymentDetails,
        createdAt: new Date(),
      };
  
      // Update referral
      await Referral.findByIdAndUpdate(referralId, {
        $push: { redeemHistory: redemptionEntry },
      });
  
      return res.status(200).json({
        message: "Reward redemption request successful",
        data: { totalReward: availablePoints, redemptionEntry },
        success: true,
      });
    } catch (error) {
      console.error("Error redeeming referral reward:", error);
      return res.status(500).json({ message: "Internal server error", success: false });
    }
};
 
// Calculate Redeemed Points (Based on ₹ Amount)
const calculateRedeemedPoints = async (req, res) => {
    try {
        const { points } = req.body;
        if (!points || typeof points !== "number" || points < 100) {
            return res.status(400).json({ message: "Minimum redeemable points required is 100", success: false });
        }
    
        const refferalPoints = await RefferalPoints.findOne({})
        const youReceiveAmount = (points / refferalPoints.points) * refferalPoints.ruppes;
        return res.status(200).json({
            message: "Referral points calculated successfully",
            data: { points, youReceiveAmount },
            success: true,
        });
    } catch (error) {
        console.error("Error calculating referral points:", error);
        return res.status(500).json({ message: "Internal server error", success: false });
    }
};
 
// Get Redeemed Records for a User
// const getRedeemedRecords = async (req, res) => {
//     try {
//         const { userId } = req.params;
 
//         // Validate userId
//         if (!mongoose.Types.ObjectId.isValid(userId)) {
//             return res.status(400).json({ message: "Invalid User ID", success: false });
//         }
 
//         // Fetch referral record with redeemHistory
//         const referral = await Referral.findOne({ userId })
//             .select("redeemHistory")
//             .lean();
 
//         if (!referral) {
//             return res.status(404).json({ message: "Referral record not found", success: false });
//         }
 
//         // Ensure redeemHistory is an array
//         const redeemedRecords = Array.isArray(referral.redeemHistory) ? referral.redeemHistory : [];
 
//         if (redeemedRecords.length === 0) {
//             return res.status(404).json({
//                 message: "No redeemed records found",
//                 data: [],
//                 success: false,
//             });
//         }
 
//         return res.status(200).json({
//             message: "Redeemed records retrieved successfully",
//             data: redeemedRecords,
//             success: true,
//         });
//     } catch (error) {
//         console.error("Error fetching redeemed records:", error);
//         return res.status(500).json({ message: "Internal server error", success: false });
//     }
// };
 
// Update Admin Redeem Records
const updateAdminRedeemRecords = async (req, res) => {
    try {
        const { redeemId } = req.params;
        const { status } = req.body;
 
        // Validate redeemId
        if (!mongoose.Types.ObjectId.isValid(redeemId)) {
            return res.status(400).json({ message: "Invalid Redeem ID", success: false });
        }
 
        // Validate status
        const validStatuses = ["Pending","Reject", "Accept"];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: "Invalid status", success: false });
        }
 
        // Find referral that contains the redemption entry
        const referral = await Referral.findOne({ "redeemHistory._id": redeemId });
 
        if (!referral) {
            return res.status(404).json({ message: "Redeem record not found", success: false });
        }
 
        // Find the specific redemption entry and update the status
        const redeemEntry = referral.redeemHistory.id(redeemId);
        if (!redeemEntry) {
            return res.status(404).json({ message: "Redeem record not found in history", success: false });
        }
 
        // Update status
        redeemEntry.status = status;

 
        // If status is successful, update redeemPoints
        if (status === "Accept") {
            referral.earnings.redeemPoints = referral.redeemHistory
                .filter(entry => entry.type === "Redeemed" && entry.status === "Accept")
                .reduce((sum, entry) => sum + entry.points, 0);
        }
        referral.earnings.totalPoints= referral.earnings.totalPoints-redeemEntry.points
       
 
        await referral.save();
 
        return res.status(200).json({
            message: "Redeem record updated successfully",
            success: true,
        });
    } catch (error) {
        console.error("Error updating admin redeemed records:", error);
        return res.status(500).json({ message: "Internal server error", success: false });
    }
};
 
// Get All Redeem Records to show to Admin Panel
const adminGetRedeemRecords = async (req, res) => {
    try {
        const { search,   page = 1, limit = 10 } = req.query;
 
        const skip = (page - 1) * limit;
        let parsedLimit = parseInt(limit);
        if (isNaN(parsedLimit) || parsedLimit <= 0) parsedLimit = 10;
 
        // Fetch all referrals with populated user
        let referrals = await Referral.find().sort({ createdAt: -1 })
            .populate("userId", "fullName isBlock")
            .select("earnings.redeemPoints earnings.totalPoints redeemHistory")
            .lean({ virtuals: true });
 
        // Apply search filter
        if (search) {
            referrals = referrals.filter(ref =>
                ref.userId?.fullName?.toLowerCase().includes(search.toLowerCase())
            );
        }
 
        // Flatten redeemHistory into individual records
        let flattened = [];
        for (const ref of referrals) {
            if (Array.isArray(ref.redeemHistory)) {
                //sort redeemHistory by createdAt in descending order
                ref.redeemHistory.sort((a, b) => b.createdAt - a.createdAt);
                
                // Create individual records for each redeem entry
                for (const entry of ref.redeemHistory) {
                    if (entry.type === "Redeemed") {
                        flattened.push({
                            fullName: ref.userId?.fullName,
                            isBlock: ref.userId?.isBlock,
                            userId: ref.userId?._id,
                            totalPoints: ref.earnings.totalPoints,
                            // redeemPoints: ref.earnings.redeemPoints,
                            redeemRequest: entry,
                        });
                    }
                }
            }
        }
 

        
        
        // Paginate the flattened results
        const paginatedData = flattened.slice(skip, skip + parsedLimit);
 
    
 
        return res.status(200).json({
            message: "Redeem history records retrieved successfully",
            success: true,
            data: paginatedData,
            currentPage: parseInt(page),
            limit: parsedLimit,
            totalResults: flattened.length,
            totalPages: Math.ceil(flattened.length / parsedLimit),
            isNext: skip + parsedLimit < flattened.length,
            isPrev: skip > 0 && flattened.length > parsedLimit,
        });
    } catch (error) {
        console.error("Error fetching referrals:", error);
        return res.status(500).json({ message: "Internal server error",error:error.message, success: false });
    }
};
// Get Single Redeem Record for Admin
const getSingleRedeemRecord = async (req, res) => {
    try {
        const { redeemId } = req.params;
 
        // Validate redeemId
        if (!mongoose.Types.ObjectId.isValid(redeemId)) {
            return res.status(400).json({ message: "Invalid Redeem ID", success: false });
        }
 
        // Find referral containing the specific redeemHistory entry
        const referral = await Referral.findOne(
            { "redeemHistory._id": redeemId }, // Corrected field name
            {
                userId: 1,
                "earnings.totalPoints": 1,
                "earnings.redeemPoints": 1,
                redeemHistory: { $elemMatch: { _id: redeemId } }, // Fetch only the specific redeem entry
            }
        ).populate("userId", "fullName email phone isBlock").lean();
 
        if (!referral || !referral.redeemHistory.length) {
            return res.status(404).json({ message: "Redeem record not found", success: false });
        }

        const refferalPoints = await RefferalPoints.findOne({}).select("-_id -updatedAt")
 
        return res.status(200).json({
            message: "Redeem record retrieved successfully",
            success: true,
            data: {
                user: referral.userId, // User details
                totalPoints: referral.earnings.totalPoints,
                pointsLeft: referral.earnings.totalPoints-referral.redeemHistory[0].points,
                redeemRecord: referral.redeemHistory[0], // Extract the single redeem entry
                refferalPointsInfo:refferalPoints,
                amountReceive:(referral.redeemHistory[0].points/100)*refferalPoints.amount
            },
        });
    } catch (error) {
        console.error("Error fetching redeem record:", error);
        return res.status(500).json({ message: "Internal server error", success: false });
    }
};
 
const getReferralCodeByUserId = async (req, res) => {
    try {
        const { userId } = req.params;
 
        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: "Invalid User ID", success: false });
        }
 
        // Fetch referral data and include redeemHistory
        const referral = await Referral.findOne({ userId })
            .select("referralCode")
            .lean();
 
        if (!referral) {
            return res.status(404).json({ message: "Referral record not found", success: false });
        }
 
        return res.status(200).json({
            message: "Referral code retrieved successfully",
            data: {
                referralCode: referral.referralCode,
            },
            success: true,
        });
    }
    catch (error) {
        console.error("Error fetching referral code and redeem history:", error);
        return res.status(500).json({ message: "Internal server error", success: false });
    }
};

const getReferAccountByUserId = async (req, res) => {
    try {
        const { userId } = req.params;
 
        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: "Invalid User ID", success: false });
        }
 
        // Fetch referral data and include redeemHistory
        const referral = await Referral.findOne({ userId });
 
        if (!referral) {
            return res.status(404).json({ message: "Referral record not found", success: false });
        }
 
        return res.status(200).json({
            message: "Referral code retrieved successfully",
            data: {
                referral,
            },
            success: true,
        });
    }
    catch (error) {
        console.error("Error fetching referral code and redeem history:", error);
        return res.status(500).json({ message: "Internal server error", success: false });
    }
};
const trackReferral = async (req, res) => {
    try {
        const { newUserId, referralCode } = req.body;
 
        // 1. Find the referrer by referralCode
        const referrer = await Referral.findOne({ referralCode }).populate("userId");
        if (!referrer) {
            return res.status(400).json({ message: 'Invalid referral code' });
        }
 
        // 2. Prevent user from referring themselves
        if (referrer.userId._id.toString() === newUserId) {
            return res.status(400).json({ message: "You can't refer yourself." });
        }
 
        // 3. Check if new user already has a referral entry
        let newUserReferral = await Referral.findOne({ userId: newUserId });
        if (!newUserReferral) {
            newUserReferral = await Referral.create({
                userId: newUserId,
                referee: referrer.userId._id,
                referralCode: generateReferralCode(), // New user's own referral code
                earnings: {
                    totalPoints: 100,
                    redeemPoints: 0,
                },
                redeemHistory: [{
                    type: "Bonus Points",
                    status: "Accept",
                    points: 100,
                    amount: 0,
                    date: new Date(),
                    paymentDetails: {},
                }],
            });
        } else if (newUserReferral.referee) {
            return res.status(400).json({ message: 'Referral already used.' });
        } else {
            // Update existing referral doc
            newUserReferral.referee = referrer.userId._id;
            newUserReferral.earnings.totalPoints += 100;
            newUserReferral.redeemHistory.push({
                type: "Bonus Points",
                status: "Accept",
                points: 100,
                amount: 0,
                date: new Date(),
                paymentDetails: {},
            });
            await newUserReferral.save();
        }
 
        // 4. Add 300 points to the referrer
        referrer.earnings.totalPoints += 300;
        referrer.redeemHistory.push({
            type: "Bonus Points",
            status: "Accept",
            points: 300,
            amount: 0,
            date: new Date(),
            paymentDetails: {},
        });
        await referrer.save();
 
        res.json({ message: 'Referral tracked and points added successfully', success: true });
    }
    catch (error) {
        console.error("Error tracking referral:", error);
        return res.status(500).json({ message: "Internal server error", success: false });
    }
};
module.exports = {
    getRedeemStatus,
    redeemReferralReward,
    calculateRedeemedPoints,
    updateAdminRedeemRecords,
    adminGetRedeemRecords,
    getSingleRedeemRecord,
    getReferralCodeByUserId,
    getReferAccountByUserId,
    trackReferral,
};