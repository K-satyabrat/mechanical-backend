const mongoose = require("mongoose");
 
const adminNotificationSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Order",
    },
    products: {
      type: [
        {
          productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product", // Reference to the Product model
            required: true,
          },
          name: {
            type: String,
            required: true,
          },
          quantity: {
            type: Number,
            required: true,
            min: 1,
          },
          price:{
            type: Number,
            required: true,
          }
        },
      ],
      required: true,
    },
    totalPrice:{
      type:Number,
      required:true
    },
    totalQuantity:{
      type:Number,
      required:true
    },
    isRead: {
      type: Boolean,
      required: true,
      default: false,
    },
    createdAt: {
      type:Date,
      default:Date.now()
    },
  },
  { timestamps: true }
);
 
const AdminNotification = mongoose.model(
  "adminNotification",
  adminNotificationSchema
);
module.exports = AdminNotification;