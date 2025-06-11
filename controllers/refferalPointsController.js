const ReferralPoints = require("../models/refferalpointsModel");

 

// Get referral points
const getReferralPoints = async (req, res) => {
    try {
        const points = await ReferralPoints.findOne({});
        res.status(200).json(points);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update referral points
const updateReferralPoints = async (req, res) => {
    try {
        const { amount } = req.body;

       

       const refferalPoints = await ReferralPoints.findOne({})

     

       
       if(amount) refferalPoints.amount=amount

       await refferalPoints.save()

       return res.status(200).json({
        message:'refferalPoints update successfully',
        success:true,
        data:refferalPoints,
       })

    } catch (error) {
        
        res.status(500).json({success:false, message:'internal server error',error: error.message });
    }
};

module.exports = { getReferralPoints, updateReferralPoints };
