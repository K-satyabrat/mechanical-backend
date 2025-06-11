const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
 
const nodemailer = require("nodemailer");
const Admin = require("../models/adminModel");
const { cloudinary } = require("../utils/cloudinary");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: process.env.EMAIL, pass: process.env.APP_PASSWORD },
});
 
const generateOTP = () => Math.floor(1000 + Math.random() * 9000).toString();

exports.register = async (req, res) => {
  try {
    const { userName, email, password} = req.body;
    const image =   req.files?.image? req.files?.image[0].path : null;
    if (!userName || !email || !password) return res.status(400).json({ message: "All fields are required",success:false });

    const existingAdmin = await Admin.findOne({email});

    if(existingAdmin){
      return res.status(400).json({ message: "Admin already exists", success: false });
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ message: "Invalid email format", success: false });
    }
 
    const hashedPassword = await bcrypt.hash(password, 10);
    const admin = new Admin({ userName, email, password: hashedPassword, image });
    await admin.save();
    const createdAdmin = await Admin.findById(admin._id).select('-password')
   return res.status(201).json({ message: "Admin created successfully",data:createdAdmin,success:true });
  } catch (error) {
    return res.status(500).json({message:'internal server error',error:error.message,success:false });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const admin = await Admin.findOne({email})
    
    if (!admin) return res.status(400).json({ message: "Invalid email or password", success: false });

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid email or password", success: false });
    
    const loginAdmin = await Admin.findById(admin._id).select('-password')
    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
    return res.status(200).json({
      message:'login successfull',
      success:true,
      data:loginAdmin,
      token
    })
   
  } catch (error) {
   return res.status(500).json({ message: "Internal server error", error:error.message, success: false });
  }
};


exports.getAdminById = async (req, res) => {
  try {
    const { id } = req.params;
    const admin = await Admin.findById(id).select('-password');
    if (!admin) return res.status(404).json({ message: "Admin not found", success: false });
    return res.status(200).json({ message: "Admin found", data: admin, success: true });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error: error.message, success: false });
  }
}
 

exports.updateAdmin = async (req, res) => {
  try {
    const {id} = req.params 
    const { email, userName,newPassword, confirmPassword } = req.body;
    const image =   req.files?.image? req.files?.image[0].path : null;

    const admin = await Admin.findById(id)

    if(!admin){
      return res.status(404).json({
        message:'admin not found',
        success:false
      })
    }

    if (email) {
      if (!/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ message: "Invalid email format", success: false });
      }
      const existingAdmin = await Admin.findOne({ email }) ;
      if (existingAdmin && existingAdmin._id.toString() !== id) {
      return res.status(400).json({ message: "Email already in use by another admin", success: false });
      }
      admin.email = email;
    }

    if(userName) admin.userName=userName

    if(image) {
         const publicId = admin.image.split("/upload/")[1].split(".")[0].split("/").slice(1).join("/"); 
            const result = await cloudinary.uploader.destroy(publicId);
            admin.image= image
    }
    
    if(newPassword && confirmPassword) {
      if(newPassword !== confirmPassword){
        return res.status(400).json({
          message:"newpassword and confirmPassword not same",
          success:false
        })
      }
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      admin.password = hashedPassword;
    }
     

    await  admin.save() 

    const updatedAdmin = await Admin.findById(admin._id).select('-password')
   return res.status(200).json({ message: "Admin updated", data:updatedAdmin,success:true });
  } catch (error) {
    return res.status(500).json({message:'internal server error',error:error.message,success:false});
  }
};

exports.sendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(400).json({ message: "Admin not found",success:false });

    const otp = generateOTP();
    admin.otp = otp;
    await admin.save();
  
    
    const mailOptions = {
      from: "MORE",
      to: email,
      subject: "Your OTP Code",
      text: `Your OTP is: ${otp}. It is valid for 1 minute.`,
    };

    
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending email:", error);
        return res.status(500).json({ message: "Error sending email", error:error.message, success: false });
      } else {
        console.log("Email sent:", info.response);
        return res.status(200).json({ message: "OTP sent successfully", otp, success: true });
      }
    });
 
    setTimeout(async () => {
      admin.otp = null;
      await admin.save();
    }, 60000);

    res.status(200).json({ message: "OTP sent", otp,success:true });
  } catch (error) {
    return res.status(500).json({message:'internal server error',error:error.message,success:false});
  }
};

exports.verifyResetOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const admin = await Admin.findOne({ email });

    if(!admin){
      return res.status(400).json({
        message:'admin not found',
        success:false
      })
    }
    if ( admin.otp !== otp) return res.status(400).json({ message: "Invalid OTP or expired",success:false });

    admin.otp = null;
    await admin.save();
    return res.status(200).json({ message: "OTP verified, you can now reset your password",success:true });
  } catch (error) {
    return res.status(500).json({message:'internal server error',error:error.message,success:false});
  }
};








exports.resetPassword = async (req, res) => {
  try {
    const { email, newPassword, confirmPassword } = req.body;

    if(!email || !newPassword,!confirmPassword){
      return res.status(400).json({
        message:"newpassword, confirmPassword and email are required",
        success:false
      })
    }

    if(newPassword !== confirmPassword){
      return res.status(400).json({
        message:"newpassword and confirmPassword not same",
        success:false
      })
    }
    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(400).json({ message: "Admin not found",success:false });

    admin.password = await bcrypt.hash(newPassword, 10);
    await admin.save();
    return res.status(200).json({ message: "Password updated successfully",success:true });
  } catch (error) {
   return res.status(500).json({ message:'internal server error',error:error.message,success:false });
  }
};
