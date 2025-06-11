const Admin = require("../models/adminModel");
const adminNotification = require("../models/adminNotificationModel");
const getDateByName = require("./getDateByName");
 
const activeUsers = new Map();
const admins = new Map();
 
let ioInstance;
 
const socketHandler = (io) => {
  ioInstance = io;
  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);
 
    // user socket ID
    socket.on("registerUser", (userId) => {
      activeUsers.set(userId, socket.id);
      console.log(`User ${userId} registered with socket ID ${socket.id}`);
    });
 
    //admin socket Id
    socket.on("registerAdmin", (adminId) => {
      admins.set(adminId, socket.id);
      console.log(`Admin ${adminId} registered with socket ID ${socket.id}`);
    });
 
    //user disconnect
    socket.on("disconnect", () => {
      const userId = [...activeUsers.entries()].find(
        ([_, id]) => id === socket.id
      )?.[0];
      if (userId) {
        activeUsers.delete(userId);
        console.log(`User ${userId} disconnected`);
        return;
      }
      const adminId = [...admins.entries()].find(
        ([_, id]) => id === socket.id
      )?.[0];
      if (adminId) {
        admins.delete(adminId);
        console.log(`Admin ${adminId} disconnected`);
      }
    });
  });
};
 
//emitNotification
const emitNotification = (userIds, notificationData) => {
  userIds.forEach((userId) => {
    const socketId = activeUsers.get(userId);
    if (socketId) {
      io.to(socketId).emit("newNotification", notificationData);
    }
  });
};
 
const createNotificationForAdmin = async (notification) => {
  const data = await Admin.find({}, "_id");
  const adminIds = data.map((admin) => admin._id.toString());
 
  const notificationData = {
    productNames:notification.products.map((product)=>product.name),
    totalQuantity:notification.totalQuantity,
    totalPrice:notification.totalPrice,
    date:getDateByName(notification.createdAt),
    id:notification._id
  }
 
  adminIds.forEach((adminId) => {
    const socketId = admins.get(adminId);
    if (socketId) {
      ioInstance.to(socketId).emit("adminNotification", notificationData);
    }
  });
};
 
module.exports = {
  socketHandler,
  emitNotification,
  createNotificationForAdmin,
};