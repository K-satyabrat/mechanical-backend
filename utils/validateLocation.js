const axios = require("axios");

const verifyLocation = async (address) => {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`;
    const response = await axios.get(url);
    return response.data.length > 0;  
  } catch (error) {
    console.error("Error verifying location:", error.message);
    return false;
  }
};

module.exports=verifyLocation