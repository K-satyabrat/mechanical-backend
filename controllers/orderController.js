const Product = require("../models/productModel");
const Order = require("../models/orderModel");
 
const { default: mongoose } = require("mongoose");
const User = require("../models/userModel");
const dummyOrder = require("../models/dummyOrder");
const adminNotification = require("../models/adminNotificationModel");
const { createNotificationForAdmin } = require("../utils/socketHandler");
const getDateByName = require("../utils/getDateByName");
const generateInvoiceNo = require("../utils/generateInvoic");
const generateOrderId = require("../utils/generateOrderId");
const Cart = require("../models/cartModel");
const ReferralPoints = require("../models/refferalpointsModel");
const Referral = require("../models/referralModel");


 
const createOrder = async (req, res) => {
  try {
    const { userId, products, deliveryDetails } = req.body;
  
 
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
      const productTotal = (productDetails.totalAmountWithTax  * quantity);
      totalAmount += productTotal;
 
      // Add product details to the items array
      items.push({
        productId,
        name: productDetails.name,
        price: productDetails.price,
        points: productDetails.points,
        discount: productDetails.discount,
        tax: productDetails.tax,
        model: productDetails.model,
        category: productDetails.category,
        description: productDetails.description,
        image: productDetails.image,
        totalAmountWithTax: productDetails.totalAmountWithTax,
        totalAmountWithOutTax: productDetails.totalAmountWithOutTax,
        deliveryCharge: productDetails.deliveryCharge,
        quantity,
        totalAmount: productTotal,
        withoutTax:false,
      });
    }
 
    // Generate a unique dummyOrderId
    
    // Calculate delivery charge from each product's delivery charge
    let deliveryCharge = 0;
    for (const product of products) {
      const productDetails = await Product.findById(product.productId);
      if (productDetails && productDetails.deliveryCharge) {
        deliveryCharge += productDetails.deliveryCharge * product.quantity;
      }
    }
 
    const totalPayableAmout = totalAmount + deliveryCharge;
 
    // Create a dummy order
    const dummyOrderData = {
      userId,
      products: items,
      deliveryDetails: finalDeliveryDetails,
      totalProductsAmount: totalAmount,
      deliveryCharge,
      totalPayableAmout:totalPayableAmout,
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
    const { dummyOrderId } = req.body;
 
    if (!dummyOrderId) {
      return res.status(400).json({
        message: "dummyOrderId is required",
        success: false,
      });
    }
 
    if (!mongoose.Types.ObjectId.isValid(dummyOrderId)) {
      return res.status(400).json({
        message: "Invalid dummyOrderId",
        success: false,
      });
    }
 
    const newdummyOrder = await dummyOrder.findById(dummyOrderId);
 
    if (!newdummyOrder) {
      return res.status(400).json({
        message: "dummyOrder not found",
        success: false,
      });
    }
    const conuntOrder = await Order.countDocuments();
    
    const newOrder = new Order({
      userId: newdummyOrder.userId,
      orderId: await generateOrderId(),
      products: newdummyOrder.products,
      deliveryDetails: newdummyOrder.deliveryDetails,
      totalProductsAmount: newdummyOrder.totalProductsAmount,
      deliveryCharge: newdummyOrder.deliveryCharge,
      totalAmount: newdummyOrder.totalPayableAmout,
      paidAmount: newdummyOrder.paidAmount,
      pendingAmount: newdummyOrder.totalPayableAmout ,
      status: "Pending", // Set the initial status of the order
      orderCreatedBy:"user",
      invoiceNo: await generateInvoiceNo(),
    });
 
    // Save the new order to the database
    const savedOrder = await newOrder.save();
 
    // Delete the dummy order after confirmation
    await newdummyOrder.deleteOne();
 
    const orderData = await Order.findById(savedOrder._id).populate(
      "products.productId"
    );
 
    const products = [];
    orderData.products.forEach((product) => {
      products.push({
        productId: product.productId._id,
        name: product.productId.name,
        price: product.productId.price,
        quantity: product.quantity,
      });
    });
 
    const totalQuantity = orderData.products.reduce(
      (sum, product) => sum + product.quantity,
      0
    );
 
    const notification = new adminNotification({
      orderId: orderData._id,
      products,
      totalPrice: orderData.totalAmount,
      totalQuantity,
    });
    await Cart.findOneAndDelete({ userId: orderData.userId });
    await notification.save()
    
    createNotificationForAdmin(notification);
    res.status(201).json({
      message: "Order confirmed successfully",
      order: savedOrder,
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
 
const orderHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    const { searchTitle } = req.query;
 
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

    let query = []
    query.push({ $match: { userId: new mongoose.Types.ObjectId(userId) } })

    if (searchTitle) {
      query.push({
        $match: {
          $expr: {
            $or: [
              { $regexMatch: { input: { $toString: { $arrayElemAt: ["$products.name", 0] } }, regex: searchTitle, options: "i" } },
              { $regexMatch: { input: { $toString: "$orderId" }, regex: searchTitle, options: "i" } },
              { $regexMatch: { input: { $toString: "$status" }, regex: searchTitle, options: "i" } },
              { $eq: ["$totalAmount", parseFloat(searchTitle)] }, // Handle numeric search
              { $eq: ["$createdAt", new Date(searchTitle)] } // Handle date search
            ]
          }
        }
      });
    }
    query.push({ $sort: { createdAt: -1 } })
    query.push({
      $addFields: {
        products: { $ifNull: ["$products", []] } // Ensure products is always an array
      }
    })

    query.push({
      $project: {
        _id: 1,
        productsName: {
          $map: {
            input: "$products",
            as: "product",
            in: { name: "$$product.name", id: "$$product.productId" }
          }
        },
        totalAmount: 1,
        status: 1,
        orderId: 1,
        //date in format jan 23,2023
        date: {
          $dateToString: { format: "%b %d, %Y", date: "$createdAt" }
        }
      }
    })
 
    // Fetch all orders for the user
    const orders = await Order.aggregate([...query]);
 
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

const addOrder = async (req, res) => {
  try {
    const { userId, products, deliveryDetails, paidAmount ,deliveryCharge,totalAmount} = req.body;
    
    console.log('req.body',req.body);

    if(paidAmount<=0) return res.status(400).json({
        message: 'paidAmount is required and should be a positive number',
        success: false
    }
    )
 
    // Validate required fields
    if (!userId || !products || !Array.isArray(products) || products.length === 0||!paidAmount ||!totalAmount || !deliveryCharge) { 
      return res.status(400).json({
        message: "Missing or invalid required fields",
        success: false,
      });
    }
 
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

    for (let key in deliveryDetails) {
      if(key ==="phone"){
        const validPhone = /^\d{10}$/.test(deliveryDetails[key]);
        if(!validPhone) return res.status(400).json({message: "Invalid phone number", success: false});
    }
  }
 
    // Calculate total amount
     
    const items = [];
    let calculateTotalAmount = 0;
 
    for (const product of products) {
      const { productId, quantity,withoutTax } = product;

      if(withoutTax===undefined || withoutTax===null){ 
        return res.status(400).json({
          message: `withoutTax is not provided for this product ${productId}`,
          success: false,
        })
      }
 
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
      const productFinalPrice = withoutTax
        ? productDetails.totalAmountWithOutTax  
        : productDetails.totalAmountWithTax ;
      const productTotal = productFinalPrice * quantity;
      calculateTotalAmount += productTotal;
 

       
      if(totalAmount<paidAmount){
        return res.status(400).json({
          message:'amount is greater than total amount',
          success:false,
        })
      }
 
      // Add product details to the items array
      items.push({
        productId,
        name: productDetails.name,
        price: productDetails.price,
        quantity,
        total: productTotal,
        points: productDetails.points,
        discount: productDetails.discount,
        tax: productDetails.tax,
        model: productDetails.model,
        category: productDetails.category,
        description: productDetails.description,
        image: productDetails.image,
        totalAmountWithTax: productDetails.totalAmountWithTax,
        totalAmountWithOutTax: productDetails.totalAmountWithOutTax,
        deliveryCharge: productDetails.deliveryCharge,
        withoutTax:withoutTax,
      });
    }


   
    

    if (calculateTotalAmount+deliveryCharge !== totalAmount) {
      console.log('calculateTotalAmount',calculateTotalAmount);
      console.log('totalAmount+deliveryCharge',totalAmount+deliveryCharge);
      console.log('deliveryCharge',deliveryCharge);

      return res.status(400).json({
        message: `Total amount does not match the sum of product amounts deliverycharge and discount it should be equal to ${calculateTotalAmount+deliveryCharge}`,
        success: false,
      });
    }
 
    // Calculate total payable amount
    const totalPayableAmount = totalAmount 
    const newOrderId =await generateOrderId() ; // Generate a new order ID based on the count of existing orders
    const status= totalPayableAmount===paidAmount?"Completed":"Pending"
    
    // Create a new order
    const newOrder = new Order({
      orderId:newOrderId,
      userId,
      products:items,
      deliveryDetails:finalDeliveryDetails,
      status,
      totalProductsAmount: calculateTotalAmount,
      totalAmount: totalPayableAmount,
      paidAmount,
      pendingAmount:totalPayableAmount-paidAmount,
      deliveryCharge,
      invoiceNo: await generateInvoiceNo(),
      orderCreatedBy:"admin",
    });
    newOrder.payments.push({
      amount:paidAmount
    })
 
    // Save the order to the database
    const savedOrder = await newOrder.save();
 
    res.status(201).json({
      message: "Order added successfully",
      order: savedOrder,
      success: true,
    });
  } catch (error) {
    console.log("Error in addOrder:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
      success: false,
    });
  }
};
 
const editOrder = async (req, res) => {
  try {
    const { orderId } = req.params; // Extract orderId from request parameters
    let {  oldProducts,newProducts, deliveryDetails, status, paidAmount:pA,deliveryCharge,totalAmount} = req.body;
    const paidAmount = Number(pA)

    if(paidAmount<=0) return res.status(400).json({
      message: 'paidAmount is required and should be a positive number',
      success: false
  })
 
    // Validate MongoDB ObjectId for orderId
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        message: "Invalid orderId",
        success: false,
      });
    }
 
    // Find the order by ID
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        message: "Order not found",
        success: false,
      });
    }
 
 
    
      let calculateTotalAmount = 0;
    let products=[]
     if(oldProducts){
      if(!Array.isArray(oldProducts) ){
        return res.status(400).json({
          message: "oldProducts should be an array  ",
          success: false,
        });
      }
      for (const product of oldProducts) {
        const { quantity,withoutTax,totalAmountWithTax,totalAmountWithOutTax } = product;
        const productFinalPrice = withoutTax
        ? totalAmountWithOutTax  
        : totalAmountWithTax ;
      const productTotal = productFinalPrice * quantity;
      calculateTotalAmount += productTotal;
      products.push(product)
       
      }

     }

      if(newProducts){
        if(!Array.isArray(newProducts) || newProducts.length === 0){
          return res.status(400).json({
            message: "newProducts should be an array and not empty",
            success: false,
          });
        }

        // check newProducts already exist in oldProducts
        const existingProductIds = oldProducts?.map(product => product.productId.toString());
        const newProductIds = newProducts.map(product => product.productId.toString());
        const duplicateProducts = newProductIds.filter(productId => existingProductIds?.includes(productId));
        if (duplicateProducts?.length > 0) {
          return res.status(400).json({
            message: `Products with IDs ${duplicateProducts.join(", ")} already exist in the order`,
            success: false,
          });
        }
    if (newProducts && Array.isArray(newProducts) && newProducts.length > 0 ) {
    
      for (const product of newProducts) {
        const { productId, quantity,withoutTax } = product;
 
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
        const productFinalPrice = withoutTax
        ? productDetails.totalAmountWithOutTax 
        : productDetails.totalAmountWithTax ;
      const productTotal = productFinalPrice * quantity;
      calculateTotalAmount += productTotal;

      let item = {
        productId,
        name: productDetails.name,
        price: productDetails.price,
        points: productDetails.points,
        discount: productDetails.discount,
        tax: productDetails.tax,
        model: productDetails.model,
        category: productDetails.category,
        description: productDetails.description,
        image: productDetails.image,
        totalAmountWithTax: productDetails.totalAmountWithTax,
        totalAmountWithOutTax: productDetails.totalAmountWithOutTax,
        deliveryCharge: productDetails.deliveryCharge,
        quantity,
        withoutTax,
      };
      products.push(item)
      }
    }

    }

    if(products && products.length > 0){
      order.totalAmount=deliveryCharge?calculateTotalAmount+deliveryCharge:calculateTotalAmount+order.deliveryCharge
      order.totalProductsAmount=calculateTotalAmount
      order.pendingAmount=order.totalAmount-order.paidAmount
      order.products=products
    }
     if(deliveryCharge){
      if(deliveryCharge<0){
        return res.status(400).json({
          message: 'deliveryCharge should be a positive number',
          success: false
      })
      }
      order.deliveryCharge=deliveryCharge
      if(order.totalAmount-deliveryCharge!==order.totalProductsAmount){
        order.totalAmount=order.totalProductsAmount+deliveryCharge
      order.pendingAmount=order.totalAmount-order.paidAmount
      }
     }

     if(totalAmount){
      if(totalAmount<0){
        return res.status(400).json({
          message: 'totalAmount should be a positive number',
          success: false
      })
      }
      if(totalAmount!==(deliveryCharge?(order.totalProductsAmount+deliveryCharge):(order.totalProductsAmount+order.deliveryCharge) )){
        return res.status(400).json({
          message: `totalAmount should be equal to totalProductsAmount+deliveryCharge it should be equal to ${deliveryCharge?(order.totalProductsAmount+deliveryCharge):(order.totalProductsAmount+order.deliveryCharge) }`,
          success: false
      })
      }
      
      const totalPaidBefore = paidAmount?order.paidAmount+paidAmount:order.paidAmount;
      if(totalPaidBefore>totalAmount){
        return res.status(400).json({
          message:'amount is greater than total amount',
          success:false,
        })
      }

      order.totalAmount=totalAmount
      order.pendingAmount=order.totalAmount-order.paidAmount
     }
    
     if(paidAmount){
      const totalPaidBefore = order.payments.reduce((sum, pay) => sum + (pay.amount || 0), 0);

      if((totalPaidBefore+paidAmount)>order.totalAmount){
        console.log('totalPaidBefore',totalPaidBefore)
        console.log('paidAmount',paidAmount)
        console.log('order.totalAmount',order.totalAmount)
        return res.status(400).json({
          message:'amount is greater than total amount',
          success:false,
        })
      }
      order.paidAmount =totalPaidBefore+ paidAmount;
      order.pendingAmount = order.totalAmount - order.paidAmount;
      order.payments.push({
        amount:paidAmount
      })
    }
    

    
    // Update delivery details if provided

    for (let key in deliveryDetails) {
      if(key ==="phone"){
        const validPhone = /^\d{10}$/.test(deliveryDetails[key]);
        if(!validPhone) return res.status(400).json({message: "Invalid phone number", success: false});
    }
  }
    if (deliveryDetails) {
      order.deliveryDetails = {
        ...order.deliveryDetails,
        ...deliveryDetails,
      };
    }
    // Update status if provided
    if (status) {
      const validStatuses = ["Pending", "Completed", "Canceled"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          message: "Invalid status value",
          success: false,
        });
      }
      //if status is completed then set paidAmount=totalAmount
      if(status==="Completed"){
        if(order.pendingAmount>0){
          return res.status(400).json({
            message: "Pending amount should be 0 to set status as completed",
            success: false,
          });
        }
        const refferalPoints= await ReferralPoints.findOne({});
        
          const reward = order.products.reduce(
            (sum, product) => sum + (product.points || 0) * product.quantity,
            0
          );
          const redeemAmount = (reward / 100) * refferalPoints.amount; 
          const redemptionEntry = {
            type: "Points Added",
            status: "Accept",
            points: reward,
            amount: redeemAmount,
            createdAt: new Date(),
          };
        

        const updatedRefferal= await Referral.findOneAndUpdate({userId:order.userId}, {
                $push: { redeemHistory: redemptionEntry },
              });
              console.log('updatedRefferal',updatedRefferal)
        order.paidAmount=order.totalAmount
        order.pendingAmount=0
      }
      order.status = status;
    }
     
     
    // Save the updated order
   await order.save();

   
    res.status(200).json({
      message: "Order updated successfully",
      order,
      success: true,
    });
  } catch (error) {
    console.error("Error updating order:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
      success: false,
    });
  }
};

const getAllOrders = async (req, res) => {
  try {
    // Pagination parameters with defaults
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const searchTitle = req.query.searchTitle || '';
    const startDate = req.query.startDate ? new Date(req.query.startDate) : null;
    const endDate = req.query.endDate ? new Date(req.query.endDate) : null;

    // Search query
    const matchStage = {};
    if (searchTitle) {
      matchStage.$or = [
        { "deliveryDetails.name": { $regex: searchTitle, $options: "i" } },
        { "deliveryDetails.email": { $regex: searchTitle, $options: "i" } },
        { "deliveryDetails.phone": { $regex: searchTitle, $options: "i" } },
      ];
    }

    // Count total orders (before pagination)
    if (startDate && endDate) {
      matchStage.createdAt = { $gte: startDate, $lte: endDate };
    }
    const totalOrders = await Order.countDocuments(matchStage);

    let query =[]

     
    query.push({ $match: matchStage })
    query.push( {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "userDetails",
      },
    }
  )
  query.push( {
    $addFields: {
      isBlock: {
        $cond: {
          if: { $gt: [{ $size: "$userDetails" }, 0] },
          then: { $arrayElemAt: ["$userDetails.isBlock", 0] },
          else: false, // Default to false if user not found
        },
      },
    },
  })

  query.push( {
    $project: {
      userDetails: 0, // Remove userDetails array
    },
  }
)

query.push({ $sort: { createdAt: -1 } })
    query.push({ $skip: skip })
    query.push({ $limit: limit })





    // Aggregation pipeline
  
    // Execute aggregation
    const orders = await Order.aggregate(query);

    res.status(200).json({
      message: "Orders retrieved successfully",
      success: true,
      orders,
        totalOrders,
        totalPages: Math.ceil(totalOrders / limit),
        currentPage: page,
        limit,
        isNextPage: page * limit < totalOrders,
        isPreviousPage: page > 1,
  
    });
  } catch (error) {
    console.log("Error retrieving orders:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
      success: false,
    });
  }
};

const getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        message: "Invalid orderId",
        success: false,
      });
    }

    const order = await Order.findById(orderId)

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
        success: false,
      });
    }

   

    res.status(200).json({
      message: "Order retrieved successfully",
      success: true,
      order,
    })


}
catch (error) {
  res.status(500).json({
    message: "Internal server error",
    error: error.message,
    success: false,
  });
}
}
const orderSummary = async (req, res) => {
  try {
    const { startDate, endDate, page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Build date filter
    let dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) {
        dateFilter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        dateFilter.createdAt.$lte = endDateTime;
      }
    }

    //validate date filter
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      return res.status(400).json({
        message: "Invalid date range",
        success: false,
      });
    }

    // Get total orders count
    const totalOrders = await Order.countDocuments(dateFilter);

    // Get total amount received
    const totalAmountReceived = await Order.aggregate([
      { $match: dateFilter },
      { $group: { _id: null, total: { $sum: "$paidAmount" } } }
    ]);

    // Get total tax invoice amount
    const totalTaxInvoiceResult = await Order.aggregate([
      { $match: dateFilter },
      { $unwind: "$products" }, // Unwind the products array
      { $match: { "products.withoutTax": false } }, // Filter products where withoutTax is false
      { $group: { _id: null, total: { $sum: { $multiply: ["$products.totalAmountWithTax", "$products.quantity"] } } } },
    ]);
    const totalTaxInvoiceAmount = totalTaxInvoiceResult.length > 0 ? totalTaxInvoiceResult[0].total : 0; // Default to 0 if no results found

    // Get total delivery memo amount
    const deliveryMemoResult = await Order.aggregate([
      {
      $match: dateFilter
      },
      {
      $unwind: "$products" // Unwind the products array
      },
      { $match: { "products.withoutTax": true } },
      {
      $group: {
        _id: null,
        total: { $sum: { $multiply: ["$products.totalAmountWithOutTax", "$products.quantity"] }  }
      }
      }
    ]);
    const totalDeliveryMemoAmount = deliveryMemoResult.length > 0 ? deliveryMemoResult[0].total : 0; // Default to 0 if no results found
    

    // Get total pending amount
    const totalPendingAmount = await Order.aggregate([
      { $match: dateFilter },
      { $group: { _id: null, total: { $sum: "$pendingAmount" } } }
    ]);

    // Get paginated orders
    const orders = await Order.find(dateFilter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))

    res.status(200).json({
      message: "Order summary retrieved successfully",
      success: true,
      summary: {
        totalOrdersProcessed: totalOrders,
        totalAmountReceived: totalAmountReceived[0]?.total || 0,
        totalTaxInvoiceAmount: totalTaxInvoiceAmount || 0,
        totalDeliveryMemoAmount: totalDeliveryMemoAmount || 0,
        totalPendingAmount: totalPendingAmount[0]?.total || 0,
        dateRange: {
          startDate: startDate || null,
          endDate: endDate || null
        }
      },
      orders,
        totalOrders,
        totalPages: Math.ceil(totalOrders / parseInt(limit)),
        currentPage: parseInt(page),
        limit: parseInt(limit),
        isNextPage: page * parseInt(limit) < totalOrders,
        isPreviousPage: page > 1,
    });
  } catch (error) {
    console.log("Error in order summary:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
      success: false,
    });
  }
};

// get orderSummaryById 
const viewOrderSummaryDetails = async (req, res) => {
  try {
    const { orderId } = req.params;
 
    // Validate order ID
    if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        message: "Valid Order ID is required",
        success: false,
      });
    }
 
    // Fetch the order with product population
    const order = await Order.findById(orderId)
 
    if (!order) {
      return res.status(404).json({
        message: "Order not found",
        success: false,
      });
    }
 
    // Prepare product details
    const productDetails = [];
    let totalWithTax = false;
    let totalWithoutTax = false;

    totalWithTax = order.products.some(product => product.withoutTax === false);
    totalWithoutTax = order.products.some(product => product.withoutTax === true);
     
    order.products.forEach((item, index) => {
      productDetails.push({
        "SR.No": index + 1,
        "Category": item.category || "Uncategorized", 
        "Product Name": item.name || "Unknown Product",
        "Quantity": item.quantity,
        "Unit Price": item.withoutTax
        ? item.totalAmountWithOutTax  
        : item.totalAmountWithTax,
        "Total Amount": item.withoutTax
          ? (item.totalAmountWithOutTax * item.quantity) 
          : (item.totalAmountWithTax * item.quantity)  ,
        "Discount": item.discount || 0,
      });
    });
 
    const paidAmount = order.paidAmount || 0; 
    const pendingAmount =  order.pendingAmount || 0;
    const totalAmount = order.totalAmount || 0;
 
    // Response formatting
    const response = {
      "Customer Name": order.deliveryDetails?.name || "Not provided",
      "Phone Number": order.deliveryDetails?.phone || "Not provided",
      "Address": order.deliveryDetails?.address || "Not provided",
      "Product Details": productDetails,
      "Total With Tax Amount": totalWithTax
      ? (order.products.reduce((sum, item) => sum + (item.totalAmountWithTax * item.quantity), 0)+order.deliveryCharge).toFixed(2)
      : "NA",
      "Total Without Tax Amount": totalWithoutTax
      ? (order.products.reduce((sum, item) => sum + (item.totalAmountWithOutTax * item.quantity), 0)+order.deliveryCharge).toFixed(2)
      : "NA",
      "Total Amount": totalAmount.toFixed(2),
      "Delivery Charge": order.deliveryCharge || 0,
      "Paid Amount": paidAmount.toFixed(2),
      "Pending Amount": pendingAmount.toFixed(2),
    };
 
    return res.status(200).json({
      message: "Order summary retrieved successfully",
      data: response,
      success: true,
    });
  } catch (error) {
    console.error("Error fetching order summary:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
      success: false,
    });
  }
};
 

// delete order by id
const deleteOrder = async (req, res) => {
  try {
    const { orderId } = req.params; // Extract orderId from request parameters
    // Validate MongoDB ObjectId for orderId
  if(!orderId){
    return res.status(400).json({
        message: "OrderId is required",
        success: false,
      });
  }

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        message: "Invalid orderId",
        success: false,
      });
    }

 
    // Delete the order from the database
    const deletedOrder = await Order.findByIdAndDelete(orderId);

    if (!deletedOrder) {
      return res.status(404).json({
        message: "Order not found",
        success: false,
      });
    }
 
    return res.status(200).json({
      message: "Order deleted successfully",
      success: true,
    });
  } catch (error) {
    console.error("Error deleting order:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
      success: false,
    });
  }
};


const invoice = async (req, res) => {
  try {
    const { orderId } = req.params; // Extract orderId from request parameters
    const { withoutTax } = req.query;
    // Validate MongoDB ObjectId for orderId
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        message: "Invalid orderId",
        success: false,
      });
    }
 
    // Fetch the order details from the database
    const order = await Order.findById(orderId);
 
    if (!order) {
      return res.status(404).json({
        message: "Order not found",
        success: false,
      });
    }
let producTotalAmount = 0,
  taxAmount = 0;

let products = [];

if(withoutTax === "true") {
  for (const product of order.products) {
  
    // Calculate total price for the product
    const productFinalPrice =   product.totalAmountWithOutTax * product.quantity
    producTotalAmount += productFinalPrice;
  
    products.push({
      productId: product.productId ? product.productId : "productId not found",
      productName: product.name || "Unknown Product",
      totalAmount: productFinalPrice,
      category: product.category || "not found",
    });
  }
}
else if(withoutTax === "false") {
  for (const product of order.products) {
  
    // Calculate total price for the product
    const productFinalPrice =   product.totalAmountWithTax * product.quantity
    producTotalAmount += productFinalPrice;
    taxAmount += product.price * product.quantity * (product.tax || 0) / 100;
    products.push({
      productId: product.productId ? product.productId : "productId not found",
      productName: product.name || "Unknown Product",
      totalAmount: productFinalPrice,
      category: product.category || "not found",
    });
  }
}
else{
  for (const product of order.products) {
    // Determine whether to calculate with or without tax
     ;
  
    // Calculate total price for the product
    const productFinalPrice = order.withoutTax === false
      ? product.totalAmountWithOutTax * product.quantity
      : product.totalAmountWithTax * product.quantity;
    producTotalAmount += productFinalPrice;
  
    // Tax Amount
    taxAmount += product.price * product.quantity * (product.tax || 0) / 100;
    products.push({
      productId: product.productId ? product.productId : "productId not found",
      productName: product.name || "Unknown Product",
      totalAmount: productFinalPrice,
      category: product.category || "not found",
    });
  }
}



let result= {}

if(withoutTax === "true") {
  result =   {
    finalPrice: producTotalAmount.toFixed(2),
    totalAmount: (producTotalAmount + order.deliveryCharge).toFixed(2),
    amountPaid: order.payments,
    pendingAmount: order.pendingAmount.toFixed(2),
    products,
    userDetails: order.deliveryDetails,
    invoiceNo: order.invoiceNo,
    invoiceDate: order.createdAt,
  };
}

else if(withoutTax === "false") {
  result =   {
    finalPrice: producTotalAmount.toFixed(2),
    taxAmount: taxAmount.toFixed(2),
    totalAmount: (producTotalAmount + order.deliveryCharge).toFixed(2),
    amountPaid: order.payments,
    pendingAmount: order.pendingAmount.toFixed(2),
    products,
    userDetails: order.deliveryDetails,
    invoiceNo: order.invoiceNo,
    invoiceDate: order.createdAt,
  };
}

else {
  result =   {
    finalPrice: producTotalAmount.toFixed(2),
    taxAmount: taxAmount.toFixed(2),
    totalAmount: (producTotalAmount + order.deliveryCharge).toFixed(2),
    amountPaid: order.payments,
    pendingAmount: order.pendingAmount.toFixed(2),
    products,
    userDetails: order.deliveryDetails,
    invoiceNo: order.invoiceNo,
    invoiceDate: order.createdAt,
  };
}

 
    // Return the order details
    res.status(200).json({
      message: "Order details retrieved successfully",
      result,
      success: true,
    });

    
  } catch (error) {
    console.error("Error fetching order details:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
      success: false,
    });
  }
};

const paymentHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    const {searchTitle} = req.query
 
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

    let query=[]

    query.push({
      $match: {
        userId: new mongoose.Types.ObjectId(userId)
    }
    })

    if (searchTitle) {
      if (searchTitle.toLowerCase() === "outstanding") {
        query.push({
          $match: {
        status: { $ne: "Completed" } // Search for orders with status not equal to "Completed"
          }
        });
      } else if (searchTitle.toLowerCase() === "completed") {
        query.push({
          $match: {
        status: "Completed" // Search for orders with status "Completed"
          }
        });
      } else {
        query.push({
          $match: {
        $expr: {
          $or: [
            { $regexMatch: { input: { $toString: { $arrayElemAt: ["$products.name", 0] } }, regex: searchTitle, options: "i" } },
            { $regexMatch: { input: { $toString: "$orderId" }, regex: searchTitle, options: "i" } },
            { $regexMatch: { input: { $toString: "$status" }, regex: searchTitle, options: "i" } },
            { $eq: ["$totalAmount", parseFloat(searchTitle)] }, // Handle numeric search
            { $eq: ["$createdAt", new Date(searchTitle)] } // Handle date search
          ]
        }
          }
        });
      }
    }

    query.push({
      $sort: { createdAt: -1 } // Sort by createdAt in descending order
    });

    query.push({
      $addFields: {
        products: { $ifNull: ["$products", []] } // Ensure products is always an array
      }
    });

    query.push({
      $project: {
        _id: 1,
        orderId: 1,
        productsName: {
          $map: {
            input: "$products",
            as: "product",
            in: { name: "$$product.name", id: "$$product.productId" }
          }
        },
        date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        totalAmount: 1,
        status: {
          $cond: {
            if: { $eq: ["$status", "Completed"] },
            then: "Payment Completed",
            else: "Outstanding Payment"
          }
        }
      }
    });

 
    // Fetch all orders for the user
    const orders = await Order.aggregate(query);
    

    // Ensure the 'orders' variable is used or remove it if unnecessary
  
 
    
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

const paymentSlip = async (req, res) => {
  try {
    const { orderId } = req.params;
 
    // Validate MongoDB ObjectId for userId
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        message: "Invalid orderId",
        success: false,
      });
    }
 
 
    // Fetch all orders for the user
    const order = await Order.findById( orderId );
 
    if(!order){
      return res.status(404).json({
        message: "Order not found",
        success: false,
        });
    }
 
    const data={
      products:order.products.map((item) => ({
        name: item?.name || "Unknown Product",
        model: item?.model || "Unknown Model",
        quantity: item.quantity,
        image: item?.image || [],
      })),
      contactInfo:order.deliveryDetails,
      totalProducts: {count:order.products.length,totalProductsAmount:order.totalProductsAmount},
      totalAmount: order.totalAmount,
      shippingFee: order.deliveryCharge,
    }
    res.status(200).json({
      message: "Order history retrieved successfully",
      data,
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

const getAllPaymentSlips = async (req, res) => {
  try{
    const userId = req.params.userId;

    if(!userId){
      return res.status(400).json({
        message: "UserId is required",
        success: false,
      });
    }

    if(!mongoose.Types.ObjectId.isValid(userId)){
      return res.status(400).json({
        message: "Invalid userId",
        success: false,
      });
    }
    const paymentSlips = await Order.find({userId}).select("invoiceNo createdAt").lean();
   
    res.status(200).json({
      message: "Payment slips retrieved successfully",
      paymentSlips,
      totalCount: await Order.countDocuments({userId}),
      success: true,
    });
  }
  catch (error) {
    console.error("Error fetching payment slips:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
      success: false,
    });
  
}
}

const getProductFromOrderHistory = async (req, res) => {
  try {
    const { orderId, productId } = req.params;
 
    if (!orderId || !productId) {
      return res
        .status(400)
        .json({ message: "Order ID and Product ID are required." });
    }
    if (
      !mongoose.Types.ObjectId.isValid(orderId) ||
      !mongoose.Types.ObjectId.isValid(productId)
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid Product ID and order ID" });
    }
 
    // Find the order
    const order = await Order.findById(orderId).lean();
    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }
 
    // Check if product exists in order
    const productInOrder = order.products.find(
      (p) => p.productId.toString() === productId.toString()
    );
    if (!productInOrder) {
      return res
        .status(404)
        .json({ message: "Product not found in the specified order." });
    }
 
    // Fetch full product details
    const product = order.products.find(
      (p) => p.productId.toString() === productId.toString()
    );
    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }

 
    // Calculate discounted price
   
    const originalPrice = product.withoutTax?product.totalAmountWithOutTax + (product.totalAmountWithOutTax * (product.discount || 0) / 100):product.totalAmountWithTax + (product.totalAmountWithTax * (product.discount || 0) / 100)
 
    // Prepare response
    const data = {
      _id: product._id,
      name: product.name,
      description: product.description,
      originalPrice,
      discountedPrice: product.withoutTax?product.totalAmountWithOutTax:product.totalAmountWithTax,
      totalAmount:product.withoutTax?product.totalAmountWithOutTax:product.totalAmountWithTax,
      discountPercentage: product.discount,
      deliveryCharge: product.deliveryCharge,
      image: product.image?.[0] || null,
      points: product.points,
      orderDeliveryDetails: { orderId: order.orderId || "Not provided",...order.deliveryDetails},
      orderDate: order.createdAt,
    };
 
    return res.status(200).json({
      success: true,
      message: "Order product history fetched successfully.",
      productDetails: data,
    });
  } catch (error) {
    console.error("Error fetching product from order history:", error);
    return res.status(500).json({
      success: false,
      error: true,
      message: error.message,
    });
  }
};

const userOrderSummary = async (req, res) => {
  try {
    const { orderId } = req.params;
 
    // Validate Order ID
    if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        message: "Valid Order ID is required",
        success: false,
      });
    }
 
    // Get order with populated product details
    const order = await Order.findById(orderId)
 
    if (!order) {
      return res.status(404).json({
        message: "Order not found",
        success: false,
      });
    }
 
    // Initialize required fields
    let totalProductPrice = 0;
    let totalItems = 0;
    const productDetails = [];
 
    order.products.forEach((item) => {
     
      if (!item) return;
      totalProductPrice += item.withoutTax
        ? item.totalAmountWithOutTax  
        : item.totalAmountWithTax ;
    
      productDetails.push({
        _id: item.productId,
        name: item.name || "Unknown Product",
        description: item.description || "",
        quantity: item.quantity || 0,
        price: item.withoutTax
          ? item.totalAmountWithOutTax 
          : item.totalAmountWithTax ,
        image: item.image || null,
        points: item.points || 0,
         discount: item.discount || 0,
      });
    });
 
    // Set delivery charges (optional: from DB or fixed)
  
    // Prepare response
    const response = {
      orderId: order._id,
      orderDate: order.createdAt.toDateString(),
      productDetails,
      totalItems:{
            count:productDetails.length,
            totalAmount: totalProductPrice.toFixed(2),
      },
      deliveryCharges:order.deliveryCharge || 0,
      orderTotal: totalProductPrice + order.deliveryCharge || 0,
      deliveryDetails: {
        name: order.deliveryDetails?.name || "Not provided",
        phone: order.deliveryDetails?.phone || "Not provided",
        address: order.deliveryDetails?.address || "Not provided",
        deliveryId: order.orderId|| "Not provided",
      },
    };
 
    return res.status(200).json({
      message: "Order summary retrieved successfully",
      data: response,
      success: true,
    });
  } catch (error) {
    console.error("Error fetching order summary:", error);
    return res.status(500).json({
      message: "Internal server error",
      success: false,
      error: error.message,
    });
  }
};

//get overview of all orders for user

const getAllOrdersOverview = async (req, res) => {
  try {
    const userId = req.params.userId;
    const days = req.query.days || 30;
    if (!userId) {
      return res.status(400).json({ message: "User ID is required", success: false });
    
      }
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid User ID", success: false });
    
      }
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(days));
    const orders = await Order.find({ userId }).select("orderId orderDate status").lean();
    // orders will fetch by days 
  const data = await Order.aggregate([
    { $match: { userId: mongoose.Types.ObjectId.createFromHexString(userId) } },
    { $match: { createdAt: { $gte: startDate } } },
    {
      $group: {
        _id: null,
        totalPendingAmount: { $sum: "$pendingAmount" },
        orderHistory: {
          $push: {
            _id:"$_id",
            orderId: "$orderId",
            orderDate:{ $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            status: "$status",
            products: {
              $map: {
                input: "$products",
                as: "product",
                in: { _id: "$$product._id", name: "$$product.name" },
              },
            },
            totalAmount: "$totalAmount",
          },
        },
        paymentHistory: {
          $push: {
            _id:"$_id",
            orderId: "$orderId",
            orderDate: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            status: {
              $cond: {
                if: { $eq: ["$status", "Completed"] },
                then: "Payment Completed",
                else: "Outstanding Payment",
              },
            },
            totalAmount: "$totalAmount",
            products: {
              $map: {
                input: "$products",
                as: "product",
                in: { _id: "$$product._id", name: "$$product.name" },
              },
            },
          },
        },
        paymentSlips: {
          $push: {
            _id:"$_id",
            invoiceNo: "$invoiceNo",
            date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          },
        },
      },
    },
    {
      $project: {
        _id: 0,
        totalPendingAmount: 1,
        orderHistory: 1,
        paymentHistory: 1,
        paymentSlips: 1,
      },
    },
  ]);

    
    return res.status(200).json({
      message: "Orders overview retrieved successfully",
      data: data,
      success: true,
    });
    } catch (error) {
      console.error("Error fetching orders overview:", error);
      return res.status(500).json({
        message: "Internal server error",
        success: false,
        error: error.message,
      });
}
}
module.exports = {
  createOrder,
  orderHistory,
  getAllPendingPayments,
  confirmOrder,
  addOrder,
  editOrder,
  getAllOrders,
  orderSummary,
  viewOrderSummaryDetails,
  invoice,
  paymentSlip,
  paymentHistory,
  getProductFromOrderHistory,
  userOrderSummary,
  getOrderById,
  deleteOrder,
  getAllPaymentSlips,
  getAllOrdersOverview,
};