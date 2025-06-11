const { default: mongoose } = require("mongoose");
const Cart = require("../models/cartModel");
const KYC = require("../models/kycModel");
const Order = require("../models/orderModel");
const productReviewModel = require("../models/productReviewModel");
const Referral = require("../models/referralModel");
const User = require("../models/userModel");
const verifyLocation = require("../utils/validateLocation");
const { cloudinary } = require("../utils/cloudinary");

// Helper function to generate referral code
const generateReferralCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// Create User
exports.registerUser = async (req, res) => {
  try {
    const { userId, mpin } = req.body;
 
    if (!userId || !mpin) {
      return res.status(400).json({ message: "userId and mpin are required", success: false });
    }
  
    if(userId.length>=10 || userId.length<=4 ){
      return res.status(400).json({ message: "userId must be greater than 4 and less than 11 digit", success: false });
    }
   
    const mpinRegex = /^[0-9]{4}$/; // Exactly 4 digits
    if (!mpinRegex.test(mpin)) {
      return res.status(400).json({ message: "mpin must be exactly 4 digits", success: false });
    }
    const existingUser = await User.findOne({ userId });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "UserId already exists", success: false });
    }

    // Generate a unique referral code
    let referralCode;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 5;

    while (!isUnique && attempts < maxAttempts) {
      referralCode = generateReferralCode();
      const existingReferral = await Referral.findOne({ referralCode });
      if (!existingReferral) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      return res.status(500).json({ message: "Failed to generate unique referral code", success: false });
    }

    const newUser = new User({ userId, mpin });
    await newUser.save();

    // Save referral code in ReferralModel
    const newReferral = new Referral({ userId: newUser._id, referralCode });
    await newReferral.save();

    if(!newReferral) {
      const deletedUser = await User.findByIdAndDelete(newUser._id);
      return res.status(400).json({ message: "User not created", success: false });
    }
 
    res.status(201).json({ message: "User created successfully", data: newUser, success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// Login User
// Login User
exports.loginUser = async (req, res) => {
  try {
    const { userId, mpin } = req.body;
    if (!userId || !mpin) {
      return res.status(400).json({ message: "userId and mpin are required", success: false });
    }
    
    const mpinRegex = /^[0-9]{4}$/; // Exactly 4 digits
    if (!mpinRegex.test(mpin)) {
      return res.status(400).json({ message: "mpin must be exactly 4 digits", success: false });
    }
 
    const user = await User.findOne({ userId, mpin });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials", success: false });
    }
 
    const kyc = await KYC.findOne({ userId: user._id });
    // if (!kyc) {
    //   return res.status(401).json({ message: "KYC not submitted", success: false });
    // }
 
    // if (kyc.status === "pending") {
    //   return res.status(401).json({ message: "KYC is pending", success: false });
    // } else if (kyc.status === "rejected") {
    //   return res.status(401).json({ message: "KYC is rejected", success: false });
    // } else if (kyc.status !== "approved") {
    //   return res.status(401).json({ message: "KYC not approved", success: false });
    // }
 
    return res.status(200).json({ message: "Login successful", data: user,kyc, success: true });
  } catch (error) {
    res.status(500).json({ message: error.message, success: false });
  }
};


// Update User (excluding userId & mpin)
exports.updateUser = async (req, res) => {
  const { userId } = req.params;
  const { gender, phone,fullName,email,newUserId,address } = req.body;
  const cleanPhone = phone?.trim();
  const image = req.files?.image
    ? Array.isArray(req.files.image)
      ? req.files.image[0].path
      : req.files.image.path
    : null;
 
  // Basic validation
  if (!userId) {
    return res.status(400).json({ success: false, message: "userId is required" });
  }
 
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ success: false, message: "Invalid userId" });
  }
 
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
 
    // Validate and update gender
    if (gender) {
      const allowedGenders = ['male', 'female', 'other'];
      if (!allowedGenders.includes(gender.toLowerCase())) {
        return res.status(400).json({ success: false, message: "Invalid gender" });
      }
      user.gender = gender.toLowerCase();
    }

    if(address){
      user.address = address;
    }

    if(newUserId){
      if(newUserId.length>=10 || newUserId.length<=4 ){
        return res.status(400).json({ message: "userId must be greater than 4 and less than 11 digit", success: false });
      }

      const existingUser = await User.findOne({ userId: newUserId });
      if (existingUser) {
        return res.status(400).json({ success: false, message: "UserId already exists", success: false });
      }
      user.userId = newUserId;
    }
 
    // Validate and update phone
    if (cleanPhone) {
      const phoneRegex = /^[0-9]{10}$/;
      if (!phoneRegex.test(cleanPhone)) {
        return res.status(400).json({ success: false, message: "Phone number must be exactly 10 digits." });
      }
 
      const existingUser = await User.findOne({ phone: cleanPhone, _id: { $ne: userId } });
      if (existingUser) {
        return res.status(400).json({ success: false, message: "Phone number already exists" });
      }
 
      user.phone = cleanPhone;
    }
 
    // Update image if provided
    if (image) {
      user.image = image;
    }

    if (fullName) {
      user.fullName = fullName;
    }

    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ success: false, message: "Invalid email format" });
      }
      const existingEmailUser = await User.findOne({ email, _id: { $ne: userId } });
      if (existingEmailUser) {
        return res.status(400).json({ success: false, message: "Email already exists" });
      }
      user.email = email;
    }
    
 
    // Save updated user
    const updatedUser = await user.save();
 
    res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    console.error("Update User Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};
exports.getUserById = async (req, res) => {
  try {
      const { userId } = req.params;
      if (!userId) {
          return res.status(400).json({ message: 'userId is required',success:false });
      }
      if (!mongoose.Types.ObjectId.isValid(userId)) {
          return res.status(400).json({ message: 'Invalid userId',success:false });
      }

      const user = await User.findById(userId);
      if (!user) {
          return res.status(404).json({ message: 'User not found',success:false });
      }

      res.status(200).json({data:user,success:true,message:'User found'});
  } catch (error) {
      res.status(500).json({ message: 'Server error', error:error.message ,success:false});
  }
};

// adminAddUser
exports.adminAddUser = async (req, res) => {
  try{
    const {fullName,userId,mpin,address,aadhaarNumber}= req.body;
    const image = req.files?.image? req.files?.image[0].path : null;
    const aadhaarFront = req.files?.aadhaarFront ? req.files.aadhaarFront[0].path : null;
    const aadhaarBack = req.files?.aadhaarBack ? req.files.aadhaarBack[0].path : null;
    const shopPhoto = req.files?.shopPhoto ? req.files.shopPhoto[0].path : null; 
    if (  !userId || !mpin ) {
      return res.status(400).json({ message: "All fields are  required",success:false });
    }
  const capitalizeFirstLetter = (name) => {
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  };

  
    
    const mpinRegex = /^[0-9]{4}$/; // Exactly 4 digits
    if (!mpinRegex.test(mpin)) {
      return res.status(400).json({ message: "mpin must be exactly 4 digits",success:false });
    }
    const user = await User.findOne({ userId });
    if (user) {
      return res.status(400).json({ message: "UserId already exists",success:false });
    }
   
if(aadhaarNumber){
  const AadhaarNumberRegex = /^[0-9]{12}$/; // Exactly 12 digits
  if (!aadhaarNumber || !AadhaarNumberRegex.test(aadhaarNumber)) {
    return res.status(400).json({ message: "Aadhaar number must be exactly 12 digits",success:false });
  }
  const isValidAadhaar = await KYC.findOne({aadhaarNumber});
  if(isValidAadhaar){
    return res.status(400).json({ message: "Aadhaar number already exists",success:false });
  }
}
    
    const newUser = new User({ fullName:fullName?capitalizeFirstLetter(fullName):null,userId,mpin,address,image });
    await newUser.save();

    if(!newUser){
      return res.status(400).json({ message: "User not created",success:false });
    }
    

    const newKYC = new KYC({ userId:newUser._id, aadhaarFront, aadhaarBack, shopPhoto, aadhaarNumber,location:address?address:null}); 
    await newKYC.save();

    if(!newKYC){
      const deletedUser = await User.findByIdAndDelete(newUser._id);
      return res.status(400).json({ message: "KYC not created",success:false });
    }

    await User.findByIdAndUpdate(newUser._id, { $set: { isKycSubmitted: true } });
    
    // Generate a unique referral code using the new method
    let referralCode;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 5;

    while (!isUnique && attempts < maxAttempts) {
      referralCode = generateReferralCode();
      const existingReferral = await Referral.findOne({ referralCode });
      if (!existingReferral) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      // Cleanup if referral code generation fails
      const deletedUser = await User.findByIdAndDelete(newUser._id);
      const deletedKYC = await KYC.findOneAndDelete({aadhaarNumber});
      return res.status(500).json({ message: "Failed to generate unique referral code", success: false });
    }

    const newReferral = new Referral({ userId:newUser._id, referralCode });
    await newReferral.save();

    if(!newReferral) {
      const deletedUser = await User.findByIdAndDelete(newUser._id);
      const deletedKYC = await KYC.findOneAndDelete({aadhaarNumber});
      return res.status(400).json({ message: "User not created", success: false });
    }

    res.status(201).json({ message: "User created successfully", user:newUser, kycDetails:newKYC, success:true });
  }
  catch(error){
    const { userId } = req.body;
    if(userId){
      const deletedUser = await User.findOneAndDelete({userId});
    }
    const {aadhaarNumber} = req.body;
    if(aadhaarNumber){
      const deletedKYC = await KYC.findOneAndDelete({aadhaarNumber});
    }
    console.log(error);
    res.status(500).json({ message: 'Server error', error:error.message ,success:false});
  }
}
exports.getAllUsers = async (req, res) => {
  try {
      const page = parseInt(req.query.page) || 1;  
      const limit = parseInt(req.query.limit) || 10; 
      const searchTitle = req.query.searchTitle || '';
      
     
      const skip = (page - 1) * limit;

      const query = [];

      query.push({ $sort: { createdAt: -1 } }); // Sort by createdAt in descending order

      if (searchTitle) {
        query.push({
          $match: {
            $or: [ 
              { userId: { $regex: searchTitle, $options: 'i' } },
              { fullName: { $regex: searchTitle, $options: 'i' } },
              { phone: { $regex: searchTitle, $options: 'i' } },
              { email: { $regex: searchTitle, $options: 'i' } },
              { address: { $regex: searchTitle, $options: 'i' } },  
            ]
          }
        });
      }
     
 
     
      const users = await User.aggregate(query)
        .skip(skip)
        .limit(limit) // Sort by createdAt in descending order
    
      const totalUsersResult = await User.aggregate([...query, { $count: "total" }]);
      const totalUsers = totalUsersResult.length > 0 ? totalUsersResult[0].total : 0;
      const  totalPages= Math.ceil(totalUsers / limit)

     return res.status(200).json({
          success:true,
          message:'All users fetched successfully',
          users,
          currentPage:page,
          totalPages,
          totalUsers,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
      });
  } catch (error) {
    console.log(error)
      res.status(500).json({ message: 'Server error', error:error.message ,success:false});
  }
};

// Get a user by ID
exports.getAdminUserById = async (req, res) => {
  try {
      const { userId } = req.params;
      if(!userId){
        return res.status(400).json({ message: 'userId is required',success:false });
      }

      if(!mongoose.Types.ObjectId.isValid(userId)){
        return res.status(400).json({ message: 'Invalid userId',success:false });
      }

      const user = await User.findById( userId);
      if (!user) {
          return res.status(404).json({ message: 'User not found',success:false });
      }

      const kyc = await KYC.findOne({ userId });


      res.status(200).json({ user,kycDetails:kyc?kyc:[],success:true,message:'User data fetch successfull' });
  } catch (error) {
    console.log(error)
      res.status(500).json({ message: 'Server error', error:error.message ,success:false});
  }
};


// Update a user by ID and optionally update KYC status
exports.adminUpdateUser = async (req, res) => {
  try {
      const { userDocId } = req.params;
      const {
        userId,
          mpin,
          fullName,
          address,
          kycStatus,
          aadhaarNumber  
      } = req.body;

      const image = req.files?.image ? req.files?.image[0].path : null;
      const aadhaarFront = req.files?.aadhaarFront ? req.files.aadhaarFront[0].path : null;
      const aadhaarBack = req.files?.aadhaarBack ? req.files.aadhaarBack[0].path : null;
      const shopPhoto = req.files?.shopPhoto ? req.files.shopPhoto[0].path : null; 

      if (!userDocId) {
          return res.status(400).json({ message: 'userDocId is required',success:false });
      }
if (!mongoose.Types.ObjectId.isValid(userDocId)) {
    return res.status(400).json({ message: 'Invalid Id', success: false });
}
      // Create an object with only the fields that are provided in the request
      let updateFields = {};
      if (mpin){ 
        const mpinRegex = /^[0-9]{4}$/; // Exactly 4 digits
        if (!mpin || !mpinRegex.test(mpin)) {
          return res.status(400).json({ message: 'mpin must be exactly 4 digits',success:false });
        }
        updateFields.mpin = mpin;
      }
      if(userId){
        
        const existingUser = await User.findOne({ userId });

        if (existingUser && existingUser._id.toString() !== userDocId) {
          return res.status(400).json({ message: 'UserId already exists', success: false });
        }
        updateFields.userId = userId;
      } 

      if (fullName) updateFields.fullName = fullName;
      if (address) {
          updateFields.address = address;
      }
      if (image){
        const existingUser = await User.findById(userDocId );
        if( existingUser.image){
          const publicId = existingUser.image?.split("/upload/")[1].split(".")[0].split("/").slice(1).join("/");
          await cloudinary.uploader.destroy(publicId, (error, result) => {
            if (error) {
              console.error(`Error deleting image ${publicId} from Cloudinary:`, error);
            } else {
              console.log(`Image ${publicId} deleted from Cloudinary:`, result);
            }
          });
        }
       
        updateFields.image = image;
      } 
     
      // Update user details only if at least one field is provided
      let updatedUser = null;
      if (Object.keys(updateFields).length > 0) {
          updatedUser = await User.findByIdAndUpdate(userDocId, updateFields, { new: true });
          if (!updatedUser) {
              return res.status(404).json({ message: 'User not found',success:false });
          }
      }

      // If kycStatus is provided, update KYC status
      let updatedKYC = await KYC.findOne({userId:userDocId});
      if (kycStatus) {
          const validKYCStatus = ['pending', 'approved', 'rejected'].includes(kycStatus);
          if (!validKYCStatus) {
              return res.status(400).json({ message: 'Invalid KYC status',success:false });
          }
          updatedKYC.status=kycStatus         
      }
      if(aadhaarNumber){
        const AadhaarNumberRegex = /^[0-9]{12}$/; // Exactly 12 digits
        if (!aadhaarNumber || !AadhaarNumberRegex.test(aadhaarNumber)) {
          return res.status(400).json({ message: "Aadhaar number must be exactly 12 digits",success:false });
        }
        const existingUser = await KYC.findOne({aadhaarNumber});
        if(existingUser && existingUser.userId.toString() !== userDocId.toString()){
          return res.status(400).json({ message: "Aadhaar number already exists",success:false });
        }
        updatedKYC.aadhaarNumber=aadhaarNumber
      }

      if (aadhaarFront){
        if( updatedKYC.aadhaarFront){
          const publicId = updatedKYC.aadhaarFront?.split("/upload/")[1].split(".")[0].split("/").slice(1).join("/");
          await cloudinary.uploader.destroy(publicId, (error, result) => {
            if (error) {
              console.error(`Error deleting image ${publicId} from Cloudinary:`, error);
            } else {
              console.log(`aadhaarFront ${publicId} deleted from Cloudinary:`, result);
            }
          });
        }
       
        updatedKYC.aadhaarFront = aadhaarFront;
      } 


      if (aadhaarBack){
        if( updatedKYC.aadhaarBack){
          const publicId = updatedKYC.aadhaarBack?.split("/upload/")[1].split(".")[0].split("/").slice(1).join("/");
          await cloudinary.uploader.destroy(publicId, (error, result) => {
            if (error) {
              console.error(`Error deleting image ${publicId} from Cloudinary:`, error);
            } else {
              console.log(`aadhaarBack ${publicId} deleted from Cloudinary:`, result);
            }
          });
        }
       console.log('aadhaarBack',aadhaarBack)
       updatedKYC.aadhaarBack = aadhaarBack;
      } 

      if (shopPhoto){
        if( updatedKYC.shopPhoto){
          const publicId = updatedKYC.shopPhoto?.split("/upload/")[1].split(".")[0].split("/").slice(1).join("/");
          await cloudinary.uploader.destroy(publicId, (error, result) => {
            if (error) {
              console.error(`Error deleting image ${publicId} from Cloudinary:`, error);
            } else {
              console.log(`shopPhoto ${publicId} deleted from Cloudinary:`, result);
            }
          });
        }
       
        updatedKYC.shopPhoto = shopPhoto;
      } 

     if(updatedKYC){
      await updatedKYC.save()
     }
   

       const newUser= await User.findById(userDocId);
      res.status(200).json({ 
          message: 'User updated successfully', 
          user: newUser ,
          kycDetails: updatedKYC,
          success:true
      });

  } catch (error) {
    console.log(error)
      res.status(500).json({ message: 'Server error', error:error.message,success:false });
  }
};

// Delete a user by ID
exports.deleteUser = async (req, res) => {
  try {
      const { userId } = req.params;

      if (!userId) {
          return res.status(400).json({ message: 'userId is required',success:false });
      }
      if (!mongoose.Types.ObjectId.isValid(userId)) {
          return res.status(400).json({ message: 'Invalid userId',success:false });
      }

      await productReviewModel.deleteMany({ userId });
      await Cart.deleteOne({ userId });
     const kycDetails= await KYC.findOneAndDelete({ userId });
    if (kycDetails) {
      const { aadhaarFront, aadhaarBack, shopPhoto } = kycDetails;

      const deleteImageFromCloudinary = async (imageUrl) => {
        if (imageUrl) {
          const publicId = imageUrl?.split("/upload/")[1].split(".")[0].split("/").slice(1).join("/"); // Extract public ID from the URL
          await cloudinary.uploader.destroy(publicId, (error, result) => {
            if (error) {
              console.error(`Error deleting image ${publicId} from Cloudinary:`, error);
            } else {
              console.log(`Image ${publicId} deleted from Cloudinary:`, result);
            }
          });
        }
      };

      await deleteImageFromCloudinary(aadhaarFront);
      await deleteImageFromCloudinary(aadhaarBack);
      await deleteImageFromCloudinary(shopPhoto);
    }
      await Referral.findOneAndDelete({ userId });
      const deletedUser = await User.findByIdAndDelete(userId);

      if(deletedUser.image){
        const publicId = deletedUser.image.split("/upload/")[1].split(".")[0].split("/").slice(1).join("/");  // Extract public ID from the URL
        await cloudinary.uploader.destroy(publicId, (error, result) => {
          if (error) {
            console.error(`Error deleting image ${publicId} from Cloudinary:`, error);
          } else {
            console.log(`Image ${publicId} deleted from Cloudinary:`, result);
          }
        });
      }
    
      if (!deletedUser) {
          return res.status(404).json({ message: 'User not found',success:false });
      }

      res.status(200).json({ message: 'User deleted successfully',success:true });
  } catch (error) {
      res.status(500).json({ message: 'Server error', error:error.message ,success:false});
  }
};

exports.submitKYC = async (req, res) => {
  try {
      const { location,userId,aadhaarNumber } = req.body;

      // Check if the user exists
      if (!userId) {
          return res.status(400).json({ message: 'userId is required',success:false });
      }
      if (!aadhaarNumber) {
          return res.status(400).json({ message: 'Aadhaar number is required',success:false });
      }
      if (!mongoose.Types.ObjectId.isValid(userId)) {
          return res.status(400).json({ message: 'Invalid userId',success:false });
      }
      const AadhaarNumberRegex = /^[0-9]{12}$/; // Exactly 12 digits
      if (!aadhaarNumber || !AadhaarNumberRegex.test(aadhaarNumber)) {
          return res.status(400).json({ message: 'Aadhaar number must be exactly 12 digits',success:false });
      }
      const user = await User.findById(userId);
      if (!user) {
          return res.status(404).json({ message: 'User not found' ,success:false});
      }

      // Check if KYC already exists
      const existingKYC = await KYC.findOne({userId});
      if (existingKYC) {
          return res.status(400).json({ message: 'KYC already submitted for this user',success:false });
      }

      if(req.files.length < 3){
        return res.status(400).json({ message: 'Please upload all required documents',success:false });
      }

      const exitsAdharNumber = await KYC.findOne({aadhaarNumber});
      if(exitsAdharNumber){
        return res.status(400).json({ message: 'Aadhaar number already exists',success:false });
      }
  

      const aadhaarFront = req.files.aadhaarFront? req.files.aadhaarFront[0].path : null;
      const aadhaarBack = req.files.aadhaarBack ? req.files.aadhaarBack[0].path : null;
      const shopPhoto = req.files.shopPhoto ? req.files.shopPhoto[0].path : null;

      if(!aadhaarFront || !aadhaarBack || !shopPhoto){
        return res.status(400).json({ message: 'Please upload all required documents',success:false });
      }

      
      

      // Create and save new KYC record
      const newKYC = new KYC({
          userId,
          aadhaarFront,
          aadhaarBack,
          location,
          shopPhoto,
          aadhaarNumber
      });

      await newKYC.save();
      if(newKYC){
        await User.findByIdAndUpdate(userId, { $set: { isKycSubmitted: true } });
      }
      res.status(201).json({ message: 'KYC submitted successfully', kyc: newKYC,success:true });


  } catch (error) {
    console.log(error);
      res.status(500).json({ message: 'Server error', error:error.message ,success:false});
  }
};


exports.adminUserBlockUnblock = async (req,res)=>{
  try {
    const { userId } = req.params;
 
    if (!userId) {
      return res.status(400).json({ message: "User ID is required", success: false });
    }
 
    // Find the user by userId
    const user = await User.findById( userId );
    
    if (!user) {
      return res.status(404).json({ message: "User not found", success: false });
    }
 
    // Toggle the isBlock status
    user.isBlock = !user.isBlock;
    await user.save();
 
    return res.status(200).json({ 
      message: `User block status updated successfully`, 
      success: true, 
      userId: user.userId,
      isBlock: user.isBlock
    });
 
  } catch (error) {
    console.error("Error toggling user block status:", error);
    return res.status(500).json({ message: "Server error", error: error.message, success: false });
  }
}

exports.getAllUsersList = async (req, res) => {
  try {
    const users = await User.find({}, { _id: 1, fullName: 1 });
    
    return res.status(200).json({ message: "Users list fetched successfully", data: users, success: true });

  }
  catch (error) {
    console.error("Error getting users list:", error);
    return res.status(500).json({ message: "Server error", error: error.message, success: false });
  }
}