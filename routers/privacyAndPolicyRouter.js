const express = require("express");
 
const multer = require("multer");
const { storage } = require("../utils/cloudinary");
const { getPrivacyPolicy, editPrivacyPolicy } = require("../controllers/privacyAndPolicyController");
const upload = multer({ storage });
 
const adminPrivacyPolicyRouter = express.Router();
const userPrivacyPolicyRouter = express.Router();
 
// Get referNEarn policy
adminPrivacyPolicyRouter.get("/get", getPrivacyPolicy);
userPrivacyPolicyRouter.get("/get", getPrivacyPolicy);
 
// edit edit
adminPrivacyPolicyRouter.put("/edit", upload.fields([{ name: 'image' }]), editPrivacyPolicy);
 
module.exports = { adminPrivacyPolicyRouter, userPrivacyPolicyRouter };