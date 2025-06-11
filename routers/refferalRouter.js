const express = require('express');
const { getReferralPoints, updateReferralPoints } = require('../controllers/refferalPointsController');
const refferalPointsRouter = express.Router();
 
// Route to get all referral points
refferalPointsRouter.get('/get', getReferralPoints);

// Route to update referral points (by ID)
refferalPointsRouter.put('/update', updateReferralPoints);

module.exports = refferalPointsRouter;
