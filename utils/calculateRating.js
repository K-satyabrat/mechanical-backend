const { default: mongoose } = require("mongoose");
const productReviewModel = require("../models/productReviewModel");
 

const calculateProductReviewStats = async (productId) => {
    try {
        if (!mongoose.isValidObjectId(productId)) {
            return { averageRating: 5.0, reviewCount: 0 };
        }

        const objectId = new mongoose.Types.ObjectId(productId);
        const result = await productReviewModel.aggregate([
            { $match: { productId: objectId } },
            { 
                $group: { 
                    _id: "$productId", 
                    averageRating: { $avg: "$rating" },
                    reviewCount: { $sum: 1 } // Count total reviews
                } 
            }
        ]);

        return result.length > 0 
            ? { 
                averageRating: parseFloat(result[0].averageRating), 
                reviewCount: result[0].reviewCount 
              } 
            : { averageRating: 5.0, reviewCount: 0 };

    } catch (error) {
        console.error("Error calculating shop review stats:", error);
        return { averageRating: "Error", reviewCount: "Error" };
    }
};

module.exports = calculateProductReviewStats;
