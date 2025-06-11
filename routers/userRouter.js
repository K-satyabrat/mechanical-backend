const express = require("express");
const { registerUser, loginUser, updateUser, getUserById, submitKYC, getAllUsers, getAdminUserById, adminUpdateUser, deleteUser, adminAddUser, adminUserBlockUnblock, getAllUsersList } = require("../controllers/userController");
 const multer = require("multer");
 const { storage } = require("../utils/cloudinary");
 const upload = multer({ storage });

const userRouter = express.Router();
const adminUserRouter = express.Router();   

userRouter.post("/register", registerUser);
userRouter.post("/login", loginUser);
userRouter.put("/update/:userId",upload.fields([{ name: 'image' }]), updateUser);
userRouter.get("/getUserById/:userId",getUserById);
userRouter.post("/createKYC", upload.fields([
    { name: 'aadhaarFront', maxCount: 1 },
    { name: 'aadhaarBack', maxCount: 1 },
    { name: 'shopPhoto', maxCount: 1 }
]),submitKYC);

adminUserRouter.get("/getAllUsers",getAllUsers);
adminUserRouter.get("/getUserById/:userId",getAdminUserById);
adminUserRouter.post("/addUser",upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'aadhaarFront', maxCount: 1 },
    { name: 'aadhaarBack', maxCount: 1 },
    { name: 'shopPhoto', maxCount: 1 }]), adminAddUser);
adminUserRouter.put("/update/:userDocId",upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'aadhaarFront', maxCount: 1 },
    { name: 'aadhaarBack', maxCount: 1 },
    { name: 'shopPhoto', maxCount: 1 }]),adminUpdateUser);
adminUserRouter.delete("/delete/:userId",deleteUser);    
adminUserRouter.put("/blockUnblock/:userId",adminUserBlockUnblock);  
adminUserRouter.get("/getAllUsersList",getAllUsersList);


module.exports = {userRouter,adminUserRouter};
