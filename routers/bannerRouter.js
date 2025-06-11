const express = require("express");
const { storage } = require("../utils/cloudinary");
const multer = require("multer");
const { createBanner, updateBanner, getAllBanners, getBannerById, deleteBannerById,getBannersByTitle } = require("../controllers/bannerController");
const upload = multer({ storage });
 
const adminBannerRouter = express.Router();
const userBannerRouter = express.Router();
 
adminBannerRouter.post("/addBanner",upload.fields([{ name: 'image' }]), createBanner);
adminBannerRouter.put("/updateBanner/:bannerId",upload.fields([{ name: 'image' }]), updateBanner);
adminBannerRouter.get("/getAllBanners", getAllBanners);
adminBannerRouter.get("/getBannerById/:bannerId", getBannerById);
adminBannerRouter.delete("/deleteBannerById/:bannerId", deleteBannerById);
userBannerRouter.get("/getBannerByTitle", getBannersByTitle);
 
module.exports = {adminBannerRouter,userBannerRouter};