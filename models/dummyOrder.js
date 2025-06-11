const mongoose = require("mongoose");
 
const dummyOrderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Reference to the User model
      required: true,
    },
      products: {
         type: [
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
               required: true,
               min: 0,
               default: 0,
             
             },
             model: {
               type: String,
               default:null
             },
             category: {
               type: String,
               required: true,
             },
             description: {
               type: String,
               trim: true,
               default: "",
               requied: true,
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
               required: true,
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
               required: true,
               min: 0,
             },
          
             points: {
               type: Number,
               min: 0,
               default: 0,
             },
             totalAmount:{
                type: Number,
                required: true,
                min: 0,
             },
             withoutTax: {
              type: Boolean,
              default: false,
              },
           },
         ],
         required: true,
         validate: {
           validator: function (value) {
             return Array.isArray(value) && value.length > 0; // Ensure array length is at least 1
           },
           message: "Products array must contain at least one product.",
         },
       },
    deliveryDetails: {
      type: {
        name: {
          type: String,
        },
        address: {
          type: String,
        },
        phone: {
          type: String,
        },
        email: {
          type: String,
        },
      },
      required: true,
    },
    totalProductsAmount: {
      type: Number,
      required: true,
      default: 0, // Default value for total price
    },
    deliveryCharge: {
      type: Number,
      required: true,
      default: 0, // Default value for total items
    },
    adminDeleveryCharge: {
      type: Number,
      default: 0,  
    },
    note:{
      type: String,
      default: "exact delivery charge will decide by admin",
    },
    totalPayableAmout: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  { timestamps: true }
);
 
const dummyOrder = mongoose.model("dummyOrder", dummyOrderSchema);
module.exports = dummyOrder;