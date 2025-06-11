const express = require("express");
const { getAboutUs, editAboutUs } = require("../controllers/aboutUsController");
 const multer = require("multer");
 const { storage } = require("../utils/cloudinary");
 const upload = multer({ storage });
 
const adminAboutUsRouter = express.Router();
const userAboutUsRouter = express.Router();
 
// Get aboutUs
adminAboutUsRouter.get("/get", getAboutUs);
userAboutUsRouter.get("/get", getAboutUs);
 
// edit edit
adminAboutUsRouter.put("/edit",upload.fields([{ name: 'image' }]), editAboutUs);
 
module.exports = {adminAboutUsRouter,userAboutUsRouter};