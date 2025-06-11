const mongoose = require("mongoose");
 
const referAndEarnPolicySchema = new mongoose.Schema(
  {
    content: {
      type: String,
      default:''
    },
    image:{
      type:String,
      default:null
    }
  },
  { timestamps: true }
);
 
const ReferAndEarnPolicy = mongoose.model("referAndEarnPolicy", referAndEarnPolicySchema);
 
module.exports = ReferAndEarnPolicy;