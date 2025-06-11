const ReferAndEarnPolicy = require("../models/referAndEarnPolicyModel");
const { cloudinary } = require("../utils/cloudinary");
 
 
const getReferAndEarnPolicy = async (req, res) => {
  try {
    const referAndEarnPolicy = await  ReferAndEarnPolicy.findOne({});
    if (!referAndEarnPolicy) {
      return res
        .status(404)
        .json({ message: " No refer and earn detail found!", success: false });
    }
    return res.status(200).json({ referAndEarnPolicy,success:true });
  } catch (error) {
    return res
      .status(500)
      .json({ message: `server error ${error.message}`, success: false });
  }
};
 
const editReferAndEarnPolicy = async (req, res) => {
  try {
  
    const {content} = req.body;
    const image =   req.files?.image? req.files?.image[0].path : null;

 
    const referAndEarnPolicy = await ReferAndEarnPolicy.findOne({});


    if (!referAndEarnPolicy) {
      return res
        .status(404)
        .json({ message: " No About-US detail found!", success: false });
    }

  
    if(content) referAndEarnPolicy.content = content;
    if(image){
       const publicId = referAndEarnPolicy.image.split("/upload/")[1].split(".")[0].split("/").slice(1).join("/"); 
            const result = await cloudinary.uploader.destroy(publicId);
            referAndEarnPolicy.image = image
    } 
 
    const updatedreferAndEarnPolicy = await referAndEarnPolicy.save();
    return res.status(200).json({
      updatedreferAndEarnPolicy,
      message: "Successfully updated ",
      success: true,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: `server error ${error.message}`, success: false });
  }
};
module.exports = { getReferAndEarnPolicy, editReferAndEarnPolicy };