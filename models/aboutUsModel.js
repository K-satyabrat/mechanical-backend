const mongoose = require("mongoose");
 
const aboutUsSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: true,
      
    },
    image:{
      type:String,
      default:null
    }
  },
  { timestamps: true }
);
 
const aboutUsModel = mongoose.model("aboutUs", aboutUsSchema);
 
module.exports = aboutUsModel;