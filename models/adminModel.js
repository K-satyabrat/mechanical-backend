const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema(
  {
    userName:{ type:String, required: true, trim: true },
    email: {type:String, required: true, unique: true},
    password: {type:String, required: true},
    image: String,
    otp: String,
  },
  { timestamps: true }
);

const Admin = mongoose.model("Admin", adminSchema);
module.exports = Admin;