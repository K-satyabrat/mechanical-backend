const mongoose = require("mongoose");
const AdminNotification = require("../models/adminNotificationModel");
const getDateByName = require("../utils/getDateByName");



 
// Get All Notifications
const getAllNotifications = async (req, res) => {
  try {
    const { isRead } = req.query; // Get the isRead status from query parameters
    if(!isRead){
    res.status(500).json({ success: false, message: "Query required!" });
    return
    }
 
    const notifications = await AdminNotification.find({ isRead: isRead === "true" })
      .sort({ createdAt: -1 }); 
 
      const data= notifications.map((notification)=>{
          const notificationData = {
            productNames:notification.products.map((product)=>product.name),
            totalQuantity:notification.totalQuantity,
            totalPrice:notification.totalPrice,
            //date in format Today 09:00 AM, Yesterday 09:00 AM, 2 days ago 09:00 AM
            date:getDateByName( notification.createdAt),
            id:notification._id,
            orderId:notification.orderId,
            isRead:notification.isRead,
          }
          return notificationData
      })

      const totalunReadCount = await AdminNotification.countDocuments({ isRead: false });
    res.status(200).json({ success: true, data,totalunReadCount ,message:'Notifications fetch successfully'});
  } catch (error) {
    console.error("Error fetching all notifications:", error);
    res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
  }
};
 
// Mark Notification as Read
const markAsReadNotification = async (req, res) => {
  try {
    const { notificationId } = req.params; // Get notification ID from request parameters
 
    // Update the notification's isRead status to true
    const updatedNotification = await AdminNotification.findByIdAndUpdate(
      notificationId,
      { isRead: true },
      { new: true } // Return the updated document
    );
 
    if (!updatedNotification) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }
 
    res.status(200).json({ success: true, data: updatedNotification });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
  }
};
 
module.exports = {
  getAllNotifications,
  markAsReadNotification,
};