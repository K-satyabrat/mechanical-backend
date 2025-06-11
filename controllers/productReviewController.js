 
const Product = require("../models/productModel");
const User = require("../models/userModel");
const mongoose = require("mongoose");
const moment = require("moment");
const calculateProductReviewStats = require("../utils/calculateRating");
const ProductReview = require("../models/productReviewModel");
const Order = require("../models/orderModel");
 
 
// Create or Update a Product Review
const createReview = async (req, res) => {
    try {
        const { userId, productId, rating, message } = req.body;
 
        if (!userId || !productId || !rating || !message) {
            return res.status(400).json({ message: "All fields are required", success: false });
        }
 
        if (!mongoose.isValidObjectId(productId) || !mongoose.isValidObjectId(userId)) {
            return res.status(400).json({ success: false, message: "Invalid productId or userId format" });
        }
 
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(400).json({ message: "Product not found", success: false });
        }
 
        const user = await User.findById(userId);
        if (!user) {
            return res.status(400).json({ message: "User not found", success: false });
        }

        const order = await Order.findOne({ userId, products: { $elemMatch: { productId } } });

        if (!order) {
            return res.status(400).json({ message: "User has not purchased this product", success: false });
        }
        
 
        const existingReview = await ProductReview.findOne({ userId, productId });
        if (existingReview) {
            return res.status(400).json({ message: "Review already exists", success: false });
        }
 
        const newReview = new ProductReview({
            userId,
            productId,
            rating,
            message,
        });
 
        await newReview.save();
        
        res.status(201).json({
            success: true,
            message: "Review added successfully!",
            review: newReview,
        });
    } catch (error) {
        console.error("Error creating review:", error.message);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};
 
// Update an Existing Product Review
const updateReview = async (req, res) => {
    try {
        const {id} = req.params
        const { rating, message } = req.body;
 
        if (!id) {
            return res.status(400).json({ message: "id is required", success: false });
        }
 
        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ success: false, message: "Invalid productId format" });
        }
 
        const existingReview = await ProductReview.findById(id);
        if (!existingReview) {
            return res.status(404).json({ message: "Review not found", success: false });
        }
 
       if(rating)  existingReview.rating = rating;
       if(message) existingReview.message = message;
        await existingReview.save();
  
        res.status(200).json({
            success: true,
            message: "Review updated successfully!",
            review: existingReview,
        });
    } catch (error) {
        console.error("Error updating review:", error.message);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};
 
// Get all reviews for a product
const getAllReviewsByProductId = async (req, res) => {
    try {
        const { productId } = req.params;

        if (!productId) {
            return res.status(400).json({ message: "productId is required", success: false });
        }
 
        if (!mongoose.isValidObjectId(productId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid productId format",
            });
        }
 
        const reviews = await ProductReview.find({ productId })
            .populate("userId", "fullName image")
            .sort({ createdAt: -1 });

       
        if (!reviews.length) {
            return res.status(200).json({
                success: false,
                message: "No reviews found for this product",
                reviews:[]
            });
        }

        const formattedReviews = reviews.map((review) => {
            let formatted = {
                ...review.toObject(),
                timeAgo: moment(review.updatedAt).fromNow(),
            };
            return formatted;
        });
        
        res.status(200).json({
            message: "Reviews fetched successfully",
            success: true,
            reviews:formattedReviews,
        });
    } catch (error) {
        console.error("Error fetching reviews:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};
 
const deleteReviewByUserId = async (req, res) => {
    try {
        const { userId, productId } = req.params;
 
        if (!mongoose.isValidObjectId(userId) || !mongoose.isValidObjectId(productId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid userId or productId format",
            });
        }
 
   
        const deletedReview = await ProductReview.findOneAndDelete({ userId, productId });
 
        if (!deletedReview) {
            return res.status(404).json({
                success: false,
                message: "Review not found for this user and product",
            });
        }
 
      
        const { averageRating, reviewCount } = await calculateProductReviewStats(productId);
 
        res.status(200).json({
            success: true,
            message: "Review deleted successfully!",
            averageRating,
            reviewCount,
        });
    } catch (error) {
        console.error("Error deleting review:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};
 
 
module.exports = { createReview,updateReview, getAllReviewsByProductId, deleteReviewByUserId };