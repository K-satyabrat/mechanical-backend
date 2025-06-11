const mongoose = require("mongoose");
 
const orderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
    },
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
          type:String
        },
        address: {
          type:String
        },
        phone: {
          type:String
        },
        email: {
          type:String
        },
      },
      required: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Completed", "Canceled"],
      required: true,
    },
    totalProductsAmount: {
      type: Number,
      required: true,
      default: 0, // Default value for total price
    },
    totalAmount: {
      type: Number,
      required: true,
      default: 0, // Default value for total price
    },
    paidAmount: {
      type: Number,
      required: true,
      default: 0, // Default value for total items
    },
    pendingAmount: {
      type: Number,
      required: true,
      default: 0, // Default value for total items
    },
    deliveryCharge: {
      type: Number,
      required: true,
      default: 0, // Default value for total items
    },
    note:{
      type: String,
      default: "exact delivery charge will decide by admin",
    },
  invoiceNo: {
    type: String,
    required: true, 
  },
  payments: {
    type: [
      {
        amount: {
          type: Number,
          required: true,
        },
        date: {
          type: Date,
          required: true,
          default:Date.now
        },
      },
    ],
    default: [], // Default to an empty array
    },

  orderCreatedBy:{
    type:String,
    required:true,
    enum: ["admin", "user"],
    default: "user",

  }
},
  {
    timestamps: true, // Automatically manage createdAt and updatedAt fields
  }
  
);
 
const Order = mongoose.model("Order", orderSchema);
module.exports = Order;