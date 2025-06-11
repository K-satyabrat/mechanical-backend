const express = require('express')
const { addProduct, getProducts, getProductById, updateProduct, deleteProduct, getAdminProducts, getAdminProductById, getCategories } = require('../controllers/productController')
const multer = require("multer");
const { storage } = require("../utils/cloudinary");
const upload = multer({ storage });
 
const userProductRouter = express.Router()
const adminProductRouter = express.Router()
 
adminProductRouter.post('/addProduct', upload.fields([{ name: 'image' }]),addProduct)
adminProductRouter.put('/updateProduct/:id',upload.fields([{ name: 'image' }]),updateProduct)
adminProductRouter.delete('/deleteProduct/:id',deleteProduct)
adminProductRouter.get('/getProducts',getAdminProducts)
adminProductRouter.get('/getProductsCategories',getCategories)
userProductRouter.get('/getProductsCategories',getCategories)
adminProductRouter.get('/getProductById/:id',getAdminProductById)
userProductRouter.get('/getProducts/:userId',getProducts)
userProductRouter.get('/getProductById/:id',getProductById)
userProductRouter.get('/getProducts',getProducts)
 
 
module.exports = {userProductRouter,adminProductRouter}