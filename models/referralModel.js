const mongoose = require("mongoose");
 
const paymentDetailsSchema = new mongoose.Schema({
  bankDetails: {
    bankName: { type: String },
    accountNumber: { type: String },
    ifscCode: { type: String },
  },
  upiDetails: {
    upiId: { type: String },
  },
});
 
const redeemStatusSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["Redeemed", "Points Added", "Bonus Points", "Pending", "Cancelled", "Success"],
    required: true,
  },
  status: {
    type: String,
    enum: ["Pending","Reject", "Accept"],
    default: "Pending",
  },
  points: {
    type: Number,
    required: true,
    min: 0,
  },
  amount: {
    type: Number,
    min: 0,
    default: 0,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  paymentDetails: paymentDetailsSchema,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});
 
const referralSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    referee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null, /// Initially null, updated when someone signs up with the referral code
    },
    referralCode: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    earnings: {
      totalPoints: { type: Number, default: 0, min: 0 },
      redeemPoints: { type: Number, default: 0, min: 0 },
    },
    redeemHistory: [redeemStatusSchema],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true }, // Include virtual fields in JSON responses
    toObject: { virtuals: true }
  }
);
 
// Pre-save hook to update totalPoints when redeemHistory changes
referralSchema.pre("save", function (next) {
  // this.earnings.totalPoints = this.redeemHistory
  //   .filter(entry => ["Points Added", "Bonus Points"].includes(entry.type))
  //   .reduce((sum, entry) => sum + entry.points, 0);
 
  this.earnings.redeemPoints = this.redeemHistory
    .filter(entry => entry.type === "Redeemed" && entry.status === "Accept")
    .reduce((sum, entry) => sum + entry.points, 0);
 
  next();
});
 
const Referral = mongoose.model("Referral", referralSchema);
module.exports = Referral;