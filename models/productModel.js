const mongoose = require("mongoose");
 
const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    tax: {
      type: Number,
      min: 0,
      default: 0,
    
    },
    model: {
      type: String,
      default:null
    },
    category: {
      type: String,
       default: null,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    image: {
      type: [
        {
          type: String,
        },
      ],
      default: [],
    },
    discount: {
      type: Number,
      default: 0,
    },
    totalAmountWithTax: {
      type: Number,
      required: true,
      min: 0,
    },
    totalAmountWithOutTax: {
      type: Number,
      required: true,
      min: 0,
    },
    deliveryCharge: {
      type: Number,
      min: 0,
      default: 0,
    },
 
    points: {
      type: Number,
      min: 0,
      default: 0,
    },
  },
  { timestamps: true }
);
 
const Product = mongoose.model("Product", productSchema);
 
module.exports = Product;