const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
}); 

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    let resourceType = "image"; // Default to images
    const videoFormats = ["mp4", "avi", "mov"];

    // Extract file extension
    const fileExtension = file.mimetype.split("/")[1].toLowerCase();

    if (videoFormats.includes(fileExtension)) {
      resourceType = "video"; // Set resource type to video for video files
    }

    return {
      folder: "Mechanical-App-Project",
      resource_type: resourceType, // Set resource type dynamically
      format: fileExtension, // Maintain the original format
    };
  },
});

module.exports = { storage, cloudinary };
