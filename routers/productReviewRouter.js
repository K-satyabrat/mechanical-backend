const express = require('express')
const { getAllReviewsByProductId, createOrUpdateReview, deleteReviewByUserId, createReview, updateReview } = require('../controllers/productReviewController')


const productReviewRouter = express.Router()

productReviewRouter.post('/addReview',createReview)
productReviewRouter.put('/updateReview/:id',updateReview)
productReviewRouter.get('/getReviews/:productId',getAllReviewsByProductId)
productReviewRouter.delete('/deleteReview/:productId/:userId',deleteReviewByUserId)    
 

module.exports = productReviewRouter