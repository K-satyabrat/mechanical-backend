const express = require("express");
 
 const multer = require("multer");
 const { storage } = require("../utils/cloudinary");
const { getReferAndEarnPolicy, editReferAndEarnPolicy } = require("../controllers/referAndEarnPolicyController");
 const upload = multer({ storage });
 
const adminReferAndEarnPolicyRouter = express.Router();
const userReferAndEarnPolicyRouter = express.Router();
 
// Get aboutUs
userReferAndEarnPolicyRouter.get("/get", getReferAndEarnPolicy);
adminReferAndEarnPolicyRouter.get("/get", getReferAndEarnPolicy);
 
// edit edit
adminReferAndEarnPolicyRouter.put("/edit",upload.fields([{ name: 'image' }]), editReferAndEarnPolicy);
 
module.exports = {adminReferAndEarnPolicyRouter,userReferAndEarnPolicyRouter};