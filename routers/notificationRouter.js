const express = require("express");
const { storage } = require("../utils/cloudinary");
const multer = require("multer");
const upload = multer({ storage });
const {
  sendNotification,
  getAllNotifications,
  getNotificationById,
  markAsReadNotification,
} = require("../controllers/notificationController");
 
const userNotificationRouter = express.Router();
const adminNotificationRouter = express.Router();
 
 
adminNotificationRouter.post("/send", upload.fields([{ name: 'image' }]), sendNotification);
userNotificationRouter.get("/getAllNotifications/:userId", getAllNotifications);
userNotificationRouter.get("/getNotificationById/:id", getNotificationById);
userNotificationRouter.put("/mark-as-read/:userId", markAsReadNotification);
 
module.exports = {adminNotificationRouter,userNotificationRouter};