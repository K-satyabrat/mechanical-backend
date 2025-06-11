const express = require("express"); 
const { createOrder, orderHistory, confirmOrder, editOrder, addOrder, getAllOrders, orderSummary, invoice, viewOrderSummaryDetails, paymentSlip, paymentHistory, getProductFromOrderHistory, userOrderSummary, getOrderById, getAllPendingPayments, deleteOrder, getAllPaymentSlips, getAllOrdersOverview } = require("../controllers/orderController");
const userOrderRouter = express.Router();
const adminOrderRouter = express.Router();
 
userOrderRouter.post("/createOrder", createOrder);
userOrderRouter.get("/orderHistory/:userId", orderHistory);
userOrderRouter.post('/confirmOrder',confirmOrder)
adminOrderRouter.post("/addOrder", addOrder);
adminOrderRouter.put("/editOrder/:orderId", editOrder);
adminOrderRouter.get("/getAllOrders",getAllOrders);
adminOrderRouter.get("/getOrderSummary",orderSummary);
adminOrderRouter.get("/invoice/:orderId",invoice);
adminOrderRouter.get("/getOrderSummuryById/:orderId",viewOrderSummaryDetails);
userOrderRouter.get('/paymentSlip/:orderId',paymentSlip)
userOrderRouter.get('/paymentHistory/:userId',paymentHistory)
userOrderRouter.get("/getOrderProductDetails/:orderId/:productId", getProductFromOrderHistory);
userOrderRouter.get('/order-summary/:orderId',userOrderSummary)
adminOrderRouter.get('/getOrderById/:orderId',getOrderById)
userOrderRouter.get('/getAllPendingAmount/:userId',getAllPendingPayments)
adminOrderRouter.delete('/deleteOrder/:orderId', deleteOrder)
userOrderRouter.get('/getAllPaymentSlips/:userId',getAllPaymentSlips)
userOrderRouter.get("/getAllOrdersOverview/:userId",getAllOrdersOverview);
 
module.exports = {userOrderRouter,adminOrderRouter};