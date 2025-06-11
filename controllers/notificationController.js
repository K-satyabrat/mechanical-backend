const Notification = require("../models/notificationModel");
const User = require("../models/userModel");
const { emitNotification } = require("../utils/socketHandler");
const mongoose = require("mongoose");
 
// Send Notification 
const sendNotification = async (req, res) => {
  try {
    let { title, message, users, } = req.body;
 
    if (!title || !message || !users) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }
 
    // Parse `users` (Ensure it's an array)
    if (typeof users === "string") {
      users = JSON.parse(users);
    }
 
    if (!Array.isArray(users) || users.length === 0) {
      return res.status(400).json({ success: false, message: "Users must be an array of user IDs" });
    }
 
       // Check if all participant IDs are valid
       const isInvalidId = users.some((id) => !mongoose.Types.ObjectId.isValid(id));
       if (isInvalidId) {
         return res.status(400).json({
           message: "Some IDs in participants are invalid",
           success: false,
         });
       }
    
       // Validate if all participant IDs exist in the User collection
       const existingUsers = await User.find({ _id: { $in: users } });
       if (existingUsers.length !== users.length) {
         return res.status(400).json({
           message: "One or more participant IDs are invalid.",
           status: false,
         });
       }
    users = users.map(user => new mongoose.Types.ObjectId(user));
 
    const notification = new Notification({ title, message, users });
    await notification.save();
 
    // Emit notification
    emitNotification(users, notification);
 
    res.status(201).json({message:'notification send successfully', success: true, data: notification });
  } catch (error) {
    console.error("Error in sending notification:", error);
    res.status(500).json({ success: false, message: "Internal Server Error",error:error.message });
  }
};
 
// Get All Notifications
const getAllNotifications = async (req, res) => {
  try {
    const { userId } = req.params;

    if(!userId) {
      return res.status(400).json({ success: false, message: "userId is required" });
    }
    
    if(!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: "Invalid userId" });
    }

    const notifications = await Notification.find({ users: userId })
      .sort({ createdAt: -1 })
      .lean();

    const unreadCount = await Notification.countDocuments({ 
      users: userId, 
      readBy: { $ne: userId } 
    });

    notifications.forEach(notification => {
      notification.isRead = notification.readBy && notification.readBy.includes(userId);
    });

    res.status(200).json({ 
      success: true, 
      data: notifications, 
      unreadCount, 
      message: 'Notifications fetched successfully' 
    });
 
    
  } catch (error) {
    console.error("Error fetching all notifications:", error);
    res.status(500).json({ success: false, message: "Internal Server Error",error:error.message });
  }
};
 
// Get Notification by ID
const getNotificationById = async (req, res) => {
  try {
    const { id } = req.params;
 
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid notification ID" });
    }
 
    const notification = await Notification.findById(id);
 
    if (!notification) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }
 
    res.status(200).json({ success: true, data: notification,message:'Notifications fetch successfully' });
  } catch (error) {
    console.error("Error fetching notification by ID:", error);
    res.status(500).json({ success: false, message: "Internal Server Error",error:error.message });
  }
};
 
// Mark Notification as Read
const markAsReadNotification = async (req, res) => {
  try {
    const { userId} = req.params
 
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: "Invalid userId " });
    }
 
    const notifications = await Notification.updateMany(
      { users: userId, redby: { $ne: userId }  },
      { $addToSet: { readBy: userId } }
    );
 
    if (!notifications) {
      return res.status(404).json({ success: false, message: "Notification not found for this user" });
    }
 
    res.status(200).json({ success: true, message: "Notifications marked as read", data: notifications });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ success: false, message: "Internal Server Error",error:error.message });
  }
};
 
 
module.exports = {
  sendNotification,
  getAllNotifications,
  getNotificationById,
  markAsReadNotification
};