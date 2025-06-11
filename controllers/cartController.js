const { default: mongoose } = require("mongoose");
const Cart = require("../models/cartModel"); // Import the Cart model
const Product = require("../models/productModel"); // Import the Product model (if needed)
const User = require("../models/userModel"); // Import the Product model (if needed)
const { ServerDescription } = require("mongodb");
 
const addProduct = async (req, res) => {
  try {
    const { userId, productId, quantity } = req.body;
 
    // Validate input
    if (!userId || !productId || !quantity || quantity < 1) {
      return res.status(400).json({ message: "Invalid input", success: false });
    }
 
    // Validate MongoDB ObjectId for userId and productId
    if (
      !mongoose.Types.ObjectId.isValid(userId) ||
      !mongoose.Types.ObjectId.isValid(productId)
    ) {
      return res
        .status(400)
        .json({ message: "Invalid userId or productId", success: false });
    }
 
    // Check if the user exists
    const userExists = await User.findById(userId);
    if (!userExists) {
      return res
        .status(404)
        .json({ message: "User not found", success: false });
    }
 
    // Check if the product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res
        .status(404)
        .json({ message: "Product not found", success: false });
    }
    // Find the user's cart
    let cart = await Cart.findOne({ userId });
 
    if (!cart) {
      // If no cart exists, create a new one
      cart = new Cart({
        userId,
        items: [{ productId, quantity }],
        totalPrice: (product.totalAmountWithTax  * quantity),
        totalItems: 1,
      });
    } else {
      // Check if the product already exists in the cart
      const productIndex = cart.items.findIndex(
        (item) => item.productId.toString() === productId
      );
 
      if (productIndex > -1) {
        // If product exists, update the quantity
        cart.items[productIndex].quantity += quantity;
        cart.totalPrice += (product.totalAmountWithTax *  quantity);
      } else {
        // If product does not exist, add it to the cart
        cart.items.push({ productId, quantity });
        cart.totalPrice += (product.totalAmountWithTax * quantity);
        cart.totalItems += 1;
      }
    }
 
    
 
    // Save the cart
    await cart.save();
 
    res.status(200).json({
      message: "Product added to cart successfully",
      cart,
      success: true,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error, success: false });
  }
};
 
const getCart = async (req, res) => {
  try {
    const { userId } = req.params;
 
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

    const newCart = await Cart.findOne({userId:userId})
 
    // Find the user's cart
    const cart = await Cart.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      {
      $lookup: {
        from: "products",
        localField: "items.productId",
        foreignField: "_id",
        as: "productDetails"
      }
      },
      {
      $addFields: {
        productDetails: {
        $map: {
          input: "$productDetails",
          as: "product",
          in: {
          _id: "$$product._id",
          name: "$$product.name",
          totalAmountWithTax: "$$product.totalAmountWithTax",
          discount: "$$product.discount",
          description: "$$product.description",
          model: "$$product.model",
          points: "$$product.points",
          image: "$$product.image",
          averageRating: "$$product.averageRating",
          reviewCount: "$$product.reviewCount",
          oldPrice: {
            $add: [
              "$$product.totalAmountWithTax",
              { $multiply: ["$$product.totalAmountWithTax", { $divide: ["$$product.discount", 100] }] },
            ],
          },
          deliveryCharge: "$$product.deliveryCharge",
          discountedPrice: "$$product.totalAmountWithTax",
          quantity: {
            $arrayElemAt: [
            "$items.quantity",
            { $indexOfArray: ["$items.productId", "$$product._id"] }
            ]
          }
          }
        }
        }
      }
      },
      {
      $project: {
        userId: 1,
        totalPrice: 1,
        totalItems: 1,
        productDetails: 1
      }
      }
    ]);
    if (!cart) {
      return res
        .status(404)
        .json({ message: "Cart not found", success: false });
    }
 
    res.status(200).json({
      message: "Cart retrieved successfully",
      cart,
      success: true,
    });
  } catch (error) {
    console.log('error',error)
    res
      .status(500)
      .json({ message: "Internal server error", error, success: false });
  }
};
 
const deleteProduct = async (req, res) => {
  try {
    const { userId, productId } = req.body;
 
    // Validate input
    if (!userId || !productId) {
      return res.status(400).json({ message: "Invalid input", success: false });
    }
 
    // Validate MongoDB ObjectId for userId and productId
    if (
      !mongoose.Types.ObjectId.isValid(userId) ||
      !mongoose.Types.ObjectId.isValid(productId)
    ) {
      return res
        .status(400)
        .json({ message: "Invalid userId or productId", success: false });
    }
 
    // Check if the user exists
    const userExists = await User.findById(userId);
    if (!userExists) {
      return res
        .status(404)
        .json({ message: "User not found", success: false });
    }
 
    // Find the user's cart
    let cart = await Cart.findOne({ userId });
 
    if (!cart) {
      return res
        .status(404)
        .json({ message: "Cart not found", success: false });
    }
 
    // Check if the product exists in the cart
    const productIndex = cart.items.findIndex(
      (item) => item.productId.toString() === productId
    );
 
    if (productIndex === -1) {
      return res
        .status(404)
        .json({ message: "Product not found in cart", success: false });
    }
 
    // Remove the product from the cart
    const removedProduct = cart.items.splice(productIndex, 1)[0];
 
    // Update totalItems and totalPrice
    cart.totalItems -= 1;
    const product = await Product.findById(productId);
    cart.totalPrice -= (product.totalAmountWithTax  * removedProduct.quantity);
    
    // Save the updated cart
    await cart.save();

    if(cart.totalItems===0){
      console.log('run')
      await Cart.findByIdAndDelete(cart._id)
    }
 
    res.status(200).json({
      message: `${cart.totalItems!==0?'Product removed from cart successfully':'Cart deleted successfully'}`,
      success: true,
    });
  } catch (error) {
    console.log('error',error)
    res
      .status(500)
      .json({ message: "Internal server error", error, success: false });
  }
};
 
const updateProductQuantity = async (req, res) => {
  try {
    const { userId, productId, quantity } = req.body;
 
    // Validate input
    if (!userId || !productId || quantity === undefined) {
      return res.status(400).json({ message: "Invalid input", success: false });
    }
 
    // Validate MongoDB ObjectId for userId and productId
    if (
      !mongoose.Types.ObjectId.isValid(userId) ||
      !mongoose.Types.ObjectId.isValid(productId)
    ) {
      return res
        .status(400)
        .json({ message: "Invalid userId or productId", success: false });
    }
 
    // Check if the user exists
    const userExists = await User.findById(userId);
    if (!userExists) {
      return res
        .status(404)
        .json({ message: "User not found", success: false });
    }
 
    // Find the user's cart
    let cart = await Cart.findOne({ userId });
 
    if (!cart) {
      return res
        .status(404)
        .json({ message: "Cart not found", success: false });
    }
 
    // Check if the product exists in the cart
    const productIndex = cart.items.findIndex(
      (item) => item.productId.toString() === productId
    );
 
    if (productIndex === -1) {
      return res
        .status(404)
        .json({ message: "Product not found in cart", success: false });
    }
 
    // Get the product details
    const product = await Product.findById(productId);
    if (!product) {
      return res
        .status(404)
        .json({ message: "Product not found", success: false });
    }
 
    // Subtract the old quantity's price from the totalPrice
    const oldQuantity = cart.items[productIndex].quantity;
    cart.totalPrice -= (product.totalAmountWithTax  * oldQuantity);
 
    // Update the quantity
    if (quantity > 0) {
      cart.items[productIndex].quantity = quantity;
      // Add the new quantity's price to the totalPrice
      cart.totalPrice += (product.totalAmountWithTax *  quantity);
    } else {
      // If the quantity becomes 0 or less, remove the product from the cart
      cart.items.splice(productIndex, 1);
      cart.totalItems -= 1;
    }
 
    // Save the updated cart
    await cart.save();
 
    res.status(200).json({
      message: "Product quantity updated successfully",
      cart,
      success: true,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error, success: false });
  }
};
 
module.exports = {
  addProduct,
  getCart,
  deleteProduct,
  updateProductQuantity,
};