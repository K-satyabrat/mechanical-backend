const Order = require("../models/orderModel");

const generateOrderId = async () => {
    try {
      const lastOrder = await Order.findOne({}, null, { sort: { _id: -1 } });
      if (lastOrder) {
        const orderId = parseInt(lastOrder.orderId.slice(7)) + 1;
        return `ORD-MH${orderId.toString().padStart(5, "0")}`;
      } else {
        return "ORD-MH00001";
      }
    } catch (error) {
      console.error("Error generating order ID:", error);
      return null;
    }
   }

module.exports = generateOrderId;
   