const aboutUsModel = require("../models/aboutUsModel");
const { cloudinary } = require("../utils/cloudinary");
 
const getAboutUs = async (req, res) => {
  try {
    const aboutUs = await aboutUsModel.findOne({});
    if (!aboutUs) {
      return res
        .status(404)
        .json({ message: " No About-US detail found!", status: false });
    }
    return res.status(200).json({ aboutUs });
  } catch (error) {
    return res
      .status(500)
      .json({ message: `server error ${error.message}`, status: false });
  }
};
 
const editAboutUs = async (req, res) => {
  try {
    const {content} = req.body;
   const image =  req.files?.image? req.files.image[0].path:null


    const aboutUs = await aboutUsModel.findOne({});


    if (!aboutUs) {
      return res
        .status(404)
        .json({ message: " No About-US detail found!", status: false });
    }

  
    if(content) aboutUs.content = content;
    if(image){

      const publicId = aboutUs.image.split("/upload/")[1].split(".")[0].split("/").slice(1).join("/"); 
      const result = await cloudinary.uploader.destroy(publicId);
      aboutUs.image = image
    } 
 
    const updatedAboutUs = await aboutUs.save();
    return res.status(200).json({
      updatedAboutUs,
      message: "Successfully updated ",
      success: true,
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ message: `server error ${error.message}`, success: false });
  }
};
module.exports = { getAboutUs, editAboutUs };