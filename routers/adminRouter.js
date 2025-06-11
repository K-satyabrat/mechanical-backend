const express = require("express");
const adminRouter = express.Router();
const adminController = require("../controllers/adminController");
 const multer = require("multer");
 const { storage } = require("../utils/cloudinary");
 const upload = multer({ storage });

// Admin Routes
adminRouter.post("/register",upload.fields([{ name: 'image' }]), adminController.register);
adminRouter.post("/login", adminController.login);
adminRouter.put("/update/:id",upload.fields([{ name: 'image' }]), adminController.updateAdmin);
adminRouter.post("/sendOtp", adminController.sendOtp);
adminRouter.post("/verifyResetOtp", adminController.verifyResetOtp);
adminRouter.put("/resetPassword", adminController.resetPassword);
adminRouter.get("/getAdminById/:id",adminController.getAdminById); 

module.exports = adminRouter;