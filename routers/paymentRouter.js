const express = require("express"); 
const {  getAllPendingPayments } = require("../controllers/paymentController");
const paymentRouter = express.Router();
 
paymentRouter.get("/getAllPendingPayments", getAllPendingPayments);
 
module.exports = paymentRouter;