const PrivacyPolicy = require("../models/privacyAndPolicyModel");

const getPrivacyPolicy = async (req, res) => {
    try {
        const privacyPolicy = await PrivacyPolicy.findOne({});
        if (!privacyPolicy) {
            return res
                .status(404)
                .json({ message: " No Privacy Policy found!", success: false });
        }
        return res.status(200).json({ privacyPolicy, success: true });
    } catch (error) {
        return res
            .status(500)
            .json({ message: `server error ${error.message}`, success: false });
    }
};
 
const editPrivacyPolicy = async (req, res) => {
    try {
        const { content } = req.body;
        const privacyPolicy = await PrivacyPolicy.findOne({});
 
        if (!privacyPolicy) {
            return res
                .status(404)
                .json({ message: " No Privacy Policy detail found!", success: false });
        }
 
        if (content) privacyPolicy.content = content;
 
        const updatedPrivacy = await privacyPolicy.save();
        return res.status(200).json({
            updatedPrivacy,
            message: "Successfully updated ",
            success: true,
        });
    } catch (error) {
        return res
            .status(500)
            .json({ message: `server error ${error.message}`, success: false });
    }
};
module.exports = { getPrivacyPolicy, editPrivacyPolicy };