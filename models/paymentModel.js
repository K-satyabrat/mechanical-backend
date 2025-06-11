const mongoose = require("mongoose");
 
const paymentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Reference to the User model
      required: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order", // Reference to the Order model
      required: true,
    },
    
    paymentStatus: {
      type: String,
      enum: ["Pending", "Completed", "Failed"],
      required: true,
      default: "Pending",
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    paidAmount: {
      type: Number,
      required: true,
      default: 0,
    },
    pendingAmount: {
      type: Number,
      required: true,
      default: 0,
    },
    transactionId: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);
 
const Payment = mongoose.model("Payment", paymentSchema);
module.exports = Payment;