const Product = require("../models/productModel");
const Order = require("../models/orderModel");
 
const { default: mongoose } = require("mongoose");
const User = require("../models/userModel");
const dummyOrder = require("../models/dummyOrder");
 
const createOrder = async (req, res) => {
  try {
    const { userId, products, deliveryDetails } = req.body;
    const deliveryCharge = 22.21;
 
    // Validate required fields
    if (
      !userId ||
      !products ||
      !Array.isArray(products) ||
      products.length === 0
    ) {
      return res.status(400).json({
        message: "Missing or invalid required fields",
        success: false,
      });
    }
 
    // Validate MongoDB ObjectId for userId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res
        .status(400)
        .json({ message: "Invalid userId", success: false });
    }
 
    // Check if the user exists
    const userExists = await User.findById(userId);
    if (!userExists) {
      return res
        .status(404)
        .json({ message: "User not found", success: false });
    }
 
    // Fetch delivery details from user if not provided
    let finalDeliveryDetails = deliveryDetails;
 
    if (!deliveryDetails) {
      finalDeliveryDetails = {
        name: userExists.fullName,
        phone: userExists.phone,
        address: userExists.address,
        email: userExists.email,
      };
    }else{
          if(!deliveryDetails.name)  finalDeliveryDetails.name=userExists.fullName
          if(!deliveryDetails.address)  finalDeliveryDetails.address=userExists.address
          if(!deliveryDetails.phone)  finalDeliveryDetails.phone=userExists.phone
          if(!deliveryDetails.email)  finalDeliveryDetails.email=userExists.email
    }
 
    // Calculate total amount
    let totalAmount = 0;
    const items = [];
 
    for (const product of products) {
      const { productId, quantity } = product;
 
      // Validate MongoDB ObjectId for productId
      if (!mongoose.Types.ObjectId.isValid(productId)) {
        return res.status(400).json({
          message: `Invalid productId: ${productId}`,
          success: false,
        });
      }
 
      // Fetch product details from the database
      const productDetails = await Product.findById(productId);
      if (!productDetails) {
        return res.status(404).json({
          message: `Product with ID ${productId} not found`,
          success: false,
        });
      }
 
      // Calculate total price for the product
      const productTotal = productDetails.price * quantity;
      totalAmount += productTotal;
 
      // Add product details to the items array
      items.push({
        productId,
        name: productDetails.name,
        price: productDetails.price,
        quantity,
        total: productTotal,
      });
    }
 
    // Generate a unique dummyOrderId
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, "0");
    const day = String(currentDate.getDate()).padStart(2, "0");
    const milliSeconds =currentDate.getMilliseconds()
    const dummyOrderId = `#ORD-${year}-${month}${day}-${milliSeconds}`;
 
 
    const totalPayableAmout = totalAmount + deliveryCharge;
 
    // Create a dummy order
    const dummyOrderData = {
      dummyOrderId,
      userId,
      products: items,
      deliveryDetails: finalDeliveryDetails,
      totalProductsAmount: totalAmount,
      deliveryCharge,
      totalPayableAmout,
    };
    const newDummyOrder = new dummyOrder(dummyOrderData);
 
    // Save the order to the database
    const savedDummyOrder = await newDummyOrder.save();
 
    res.status(201).json({
      message: "Dummy order created successfully",
      dummyOrder: savedDummyOrder,
      success: true,
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
      success: false,
    });
  }
};
const confirmOrder = async (req, res) => {
  try {
 
 
  } catch (error) {
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
      success: false,
    });
  }
};
 
const orderHistory = async (req, res) => {
  try {
    const { userId } = req.params;
 
    // Validate MongoDB ObjectId for userId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        message: "Invalid userId",
        success: false,
      });
    }
 
    // Check if the user exists
    const userExists = await User.findById(userId);
    if (!userExists) {
      return res.status(404).json({
        message: "User not found",
        success: false,
      });
    }
 
    // Fetch all orders for the user
    const orders = await Order.find({ userId });
 
    res.status(200).json({
      message: "Order history retrieved successfully",
      orders,
      success: true,
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
      success: false,
    });
  }
};
 
const getAllPendingPayments = async (req, res) => {
  try {
    // Get the userId from the request parameters and the number of days from the query parameter
    const { userId } = req.params;
    const { days } = req.query;
 
    // Validate the 'days' parameter
    if (!days || isNaN(days) || days <= 0) {
      return res.status(400).json({
        message: "Invalid or missing 'days' query parameter",
        success: false,
      });
    }
 
    // Validate the 'userId'
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        message: "Invalid userId",
        success: false,
      });
    }
 
    // Check if the user exists
    const userExists = await User.findById(userId);
    if (!userExists) {
      return res
        .status(404)
        .json({ message: "User not found", success: false });
    }
 
    // Calculate the date based on the number of days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
 
    // Query to find orders with pending payments for the specific user created within the specified number of days
    const pendingPayments = await Order.find({
      userId, // Filter for the specific user
      status: "Pending", // Filter for pending orders
      createdAt: { $gte: startDate }, // Filter for orders created within the specified date range
    }).select("pendingAmount");
 
    // Check if there are no pending payments
    if (!pendingPayments || pendingPayments.length === 0) {
      return res.status(404).json({
        message: `No pending payments found for the user in the last ${days} days`,
        success: false,
      });
    }
 
    // Calculate the total sum of pending payments
    const totalPendingAmount = pendingPayments.reduce(
      (sum, order) => sum + order.pendingAmount,
      0
    );
 
    // Return the pending payments and the total sum
    res.status(200).json({
      message: `Pending payments retrieved successfully for the user in the last ${days} days`,
      totalPendingAmount,
      pendingPayments,
      success: true,
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
      success: false,
    });
  }
};
 
module.exports = {
  createOrder,
  orderHistory,
  getAllPendingPayments,
  confirmOrder
};