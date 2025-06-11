const express = require("express");
 
const multer = require("multer");
const { storage } = require("../utils/cloudinary");
const { getTermsAndConditions, editTermsAndConditions } = require("../controllers/termsAndConditionsControllers");

const upload = multer({ storage });
 
const adminTermsAndConditionsRouter = express.Router();
const userTermsAndConditionsRouter = express.Router();
 
// Get referNEarn policy
adminTermsAndConditionsRouter.get("/get", getTermsAndConditions);
userTermsAndConditionsRouter.get("/get", getTermsAndConditions);
 
// edit edit
adminTermsAndConditionsRouter.put("/edit", upload.fields([{ name: 'image' }]), editTermsAndConditions);
 
module.exports = { adminTermsAndConditionsRouter, userTermsAndConditionsRouter };