const express = require("express");
const { getAllNotifications, markAsReadNotification } = require("../controllers/adminNotfnController");
 
 
const adminNotificationsRouter = express.Router();
 
adminNotificationsRouter.get("/getAllNotifications", getAllNotifications);
adminNotificationsRouter.put("/mark-as-read/:notificationId", markAsReadNotification);
 
module.exports = {adminNotificationsRouter};