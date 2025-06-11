const mongoose = require("mongoose");
const Banner = require("../models/bannerModel");
const { cloudinary } = require("../utils/cloudinary");
 
// Create Banner
const createBanner = async (req, res) => {
  try {
    const { title } = req.body;
    const image = req.files?.image ? req.files.image[0].path : null;
 
    if (!title || !image) {
      return res
        .status(400)
        .json({ success: false, message: "Title and image are required" });
    }
 
    
 
    const newBanner = new Banner({ title, image });
    await newBanner.save();
 
    res
      .status(201)
      .json({
        success: true,
        message: "Banner created successfully",
        data: newBanner,
      });
  } catch (error) {
    console.error("Error creating banner:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
 
// Update Banner
const updateBanner = async (req, res) => {
  try {
    const { bannerId } = req.params;
    let { title } = req.body;
    const image = req.files?.image ? req.files.image[0].path : null;
 
    if (!mongoose.isValidObjectId(bannerId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid banner ID" });
    }
 
    
 
    const banner = await Banner.findById(bannerId)
    if(!banner){
      return res.status(400).json({
        message:'banner not found',
        success:false
      })
    }
    if(image){
      const publicId = banner.image.split("/upload/")[1].split(".")[0].split("/").slice(1).join("/"); 
      const result = await cloudinary.uploader.destroy(publicId);
    }
 
    const updatedBanner = await Banner.findByIdAndUpdate(
      bannerId,
      { title, ...(image && { image }) },
      { new: true }
    );
 
    if (!updatedBanner) {
      return res
        .status(404)
        .json({ success: false, message: "Banner not found" });
    }
 
    res
      .status(200)
      .json({
        success: true,
        message: "Banner updated successfully",
        data: updatedBanner,
      });
  } catch (error) {
    console.error("Error updating banner:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
 
// Get All Banners
const getAllBanners = async (req, res) => {
  try {
    const { limit = 10, page = 1 } = req.query;
    const currentPage = parseInt(page);
 
    const totalBanners = await Banner.find()
      .sort({ createdAt: -1 })
      .countDocuments();
    const totalPage = Math.ceil(totalBanners / parseInt(limit));
 
    const banners = await Banner.find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
 
    res.status(200).json({
      message: "banners data fethed successfull",
      success: true,
      data: banners,
      totalBanners,
      totalPage,
      currentPage,
      hasNextPage: currentPage < totalPage,
      hasPrevPage: currentPage > 1,
    });
  } catch (error) {
    console.error("Error fetching banners:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
 
// Get Banner by ID
const getBannerById = async (req, res) => {
  try {
    const { bannerId } = req.params;
 
    if (!mongoose.isValidObjectId(bannerId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid banner ID" });
    }
 
    const banner = await Banner.findById(bannerId);
    if (!banner) {
      return res
        .status(404)
        .json({ success: false, message: "Banner not found" });
    }
 
    res.status(200).json({ success: true, data: banner });
  } catch (error) {
    console.error("Error fetching banner:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
 
// Delete Banner by ID
const deleteBannerById = async (req, res) => {
  try {
    const { bannerId } = req.params;
 
    if (!mongoose.isValidObjectId(bannerId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid banner ID" });
    }
 
    const deletedBanner = await Banner.findByIdAndDelete(bannerId);
    if (!deletedBanner) {
      return res
        .status(404)
        .json({ success: false, message: "Banner not found" });
    }

     const publicId = deletedBanner.image.split("/upload/")[1].split(".")[0].split("/").slice(1).join("/"); 
                const result = await cloudinary.uploader.destroy(publicId);
 
    res
      .status(200)
      .json({ success: true, message: "Banner deleted successfully" });
  } catch (error) {
    console.error("Error deleting banner:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
 
// Get Banners by Title
const getBannersByTitle = async (req, res) => {
  try {
     
    const banners = await Banner.find();
    
 
    res.status(200).json({ success: true, data: banners,message:"banners fetched successfully" });
  } catch (error) {
    console.error("Error fetching banners by title:", error);
    res.status(500).json({ success: false, error, message: "Internal Server Error" });
  }
};
 
module.exports = {
  createBanner,
  updateBanner,
  getAllBanners,
  getBannerById,
  deleteBannerById,
  getBannersByTitle,
};