const mongoose = require("mongoose");
 
const ProductReviewSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  rating: {
    type: Number,
    required: true,
    min: 1, 
    max: 5,  
    default: 1, // Default rating value
  },
  message: {
    type: String,
    required: true,
  },
}, { timestamps: true }); 
const ProductReview=mongoose.model("ProductReview", ProductReviewSchema);
module.exports =ProductReview