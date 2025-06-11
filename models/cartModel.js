const mongoose = require("mongoose");
 
const cartSchema = new mongoose.Schema(
  {
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", // Reference to the User model
        required: true,
      },
      items: [
        {
          productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product", // Reference to the Product model
            required: true,
          },
          quantity: {
            type: Number,
            required: true,
            min: 1,
          },
        },
      ],
      totalPrice: {
        type: Number,
        required: true,
        default: 0, // Default value for total price
      },
      totalItems: {
        type: Number,
        required: true,
        default: 0, // Default value for total items
      },
  },
  { timestamps: true }
);
 
const Cart = mongoose.model("Cart", cartSchema);
module.exports = Cart;