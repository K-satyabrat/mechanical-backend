 
const TermsAndConditions = require("../models/termsAndConditionsModel");

const getTermsAndConditions = async (req, res) => {
    try {
        const termsAndConditions = await TermsAndConditions.findOne({});
        if (!termsAndConditions) {
            return res
                .status(404)
                .json({ message: " No terms and conditions found!", success: false });
        }
        return res.status(200).json({ termsAndConditions, success: true });
    } catch (error) {
        return res
            .status(500)
            .json({ message: `server error ${error.message}`, success: false });
    }
};
 
const editTermsAndConditions = async (req, res) => {
    try {
        const { content } = req.body;
        const termsAndConditions = await TermsAndConditions.findOne({});
 
        if (!termsAndConditions) {
            return res
                .status(404)
                .json({ message: " No terms and conditions detail found!", success: false });
        }
 
        if (content) termsAndConditions.content = content;
 
        const updatedtermsAndConditions = await termsAndConditions.save();
        return res.status(200).json({
            updatedtermsAndConditions,
            message: "Successfully updated ",
            success: true,
        });
    } catch (error) {
        return res
            .status(500)
            .json({ message: `server error ${error.message}`, success: false });
    }
};
module.exports = { getTermsAndConditions,editTermsAndConditions };