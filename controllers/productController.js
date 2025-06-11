const Product = require("../models/productModel");
const mongoose = require("mongoose");
const User = require("../models/userModel");
const ProductReview = require("../models/productReviewModel");
const { categories } = require("../constants/categories");
const Order = require("../models/orderModel");
const cloudinary = require("cloudinary").v2;
 
//Add product
const addProduct = async (req, res) => {
  try {
    const {
      name,
      price,
      tax,
      category,
      description,
      discount,
      points,
      model,
      deliveryCharge,
      totalAmountWithTax,
      totalAmountWithOutTax,
    } = req.body;
 
    // Validate required fields
    if (
      !name ||
      !price 
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields name and price are required" });
    }
 
    // Handle image upload
    let imageUrl = [];
    if (req.files && req.files.image) {
      imageUrl = req.files.image.map((file) => file.path);
    }
 
   
 
    // Convert values to numbers safely
    const priceNumber = parseFloat(price) || 0;
    const taxNumber = parseFloat(tax) || 0;
    const discountNumber = parseFloat(discount) || 0;
    const pointsNumber = parseFloat(points) || 0;
    const deliveryChargeNumber = parseFloat(deliveryCharge) || 0;
    let totalAmountWithTaxNumber =  0;
    let totalAmountWithOutTaxNumber = 0;


    if(totalAmountWithTax){
      totalAmountWithTaxNumber = parseFloat(totalAmountWithTax) || 0;
    }
    else{
      totalAmountWithTaxNumber = priceNumber 
    }

    if(totalAmountWithOutTax){
      totalAmountWithOutTaxNumber =parseFloat(totalAmountWithOutTax) || 0;
    }
    else{
      totalAmountWithOutTaxNumber = priceNumber 
    }

    if(totalAmountWithTaxNumber < totalAmountWithOutTaxNumber){
      return res.status(400).json({ success: false, message: "Total amount with tax should be greater than or equal to total amount without tax" });
    }
 
    const product = new Product({
      name,
      price: priceNumber,
      tax: taxNumber,
      category:category?category.toLowerCase() :null,
      model: model  ,
      totalAmountWithOutTax: totalAmountWithOutTaxNumber,
      totalAmountWithTax: totalAmountWithTaxNumber,
      deliveryCharge: deliveryChargeNumber,
      description,
      image: imageUrl,
      discount: discountNumber,
      points: pointsNumber,
    });
 
    await product.save();
 
    res.status(201).json({
      success: true,
      message: "Product added successfully",
      data: product,
    });
  } catch (error) {
    console.error("Error adding product:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
 
// Update product
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    if(!id){
      return res.status(400).json({
        message:'id is required',
        success:false,
      })
    }
 
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid Product ID" });
    }
 
    const {
      name,
      price,
      tax,
      category,
      model,
      description,
      discount,
      points,
      deliveryCharge,
     
    } = req.body;
  
    let  existingImages = req.body.existingImages
    
    // Handle file uploads
    let imageUrl = req.body.image || [];
 
    if (req.files?.image) {
      const uploadedImages = req.files.image.map((file) => file.path);
      imageUrl = [...imageUrl, ...uploadedImages];
    }
     
   if(imageUrl.length>0){
    if(!existingImages){
      return res.status(400).json({
        message:'existingImages is required',
        success:false
      })
    }
    existingImages = JSON.parse(existingImages)

    if (!Array.isArray(existingImages)) {
      return res
      .status(400)
      .json({ success: false, message: "Existing images must be an array" });
    }
   }

  if(existingImages && imageUrl.length<=0){
    existingImages = JSON.parse(existingImages)
    if (!Array.isArray(existingImages)) {
      return res
      .status(400)
      .json({ success: false, message: "Existing images must be an array" });
    }
  }
    const product = await Product.findById(id)

    if(!product){
      return res.status(400).json({
        message:'product not found',
        success:false
      })
    }

    if(name) product.name = name

    if(price) product.price = parseInt(price)

    if(tax) product.tax = parseFloat(tax)  
    
    if(category) product.category = category.toLowerCase()
    
    if(model) product.model = model

    if(description) product.description=description
 
    if(discount) product.discount = parseFloat(discount)

    if(points) product.points = points
    
    if(deliveryCharge) product.deliveryCharge=deliveryCharge

    if (imageUrl.length > 0) {
      const filteredImages = product.image.filter(
        (img) => !existingImages.includes(img)
      );
      // Delete filtered images from Cloudinary
      for (const image of filteredImages) {
        const publicId = image.split("/upload/")[1].split(".")[0].split("/").slice(1).join("/"); // Extract public ID from the URL
        await cloudinary.uploader.destroy(publicId, (error, result) => {
          if (error) {
            console.error(`Error deleting image ${publicId} from Cloudinary:`, error);
          } else {
            console.log(`Image ${publicId} deleted from Cloudinary:`, result);
          }
        });
      }
      existingImages = [...existingImages, ...imageUrl];
      product.image = existingImages;
    }

    // Get filteredImages that are in product.image but not in existingImages
    

    if(existingImages && imageUrl.length<=0){
      const filteredImages = product.image.filter(
        (img) => !existingImages.includes(img)
      );
      // Delete filtered images from Cloudinary
      for (const image of filteredImages) {
        const publicId = image.split("/upload/")[1].split(".")[0].split("/").slice(1).join("/");  // Extract public ID from the URL
        await cloudinary.uploader.destroy(publicId, (error, result) => {
          if (error) {
            console.error(`Error deleting image ${publicId} from Cloudinary:`, error);
          } else {
            console.log(`Image ${publicId} deleted from Cloudinary:`, result);
          }
        });
      }
      product.image=existingImages
    } 

    

    const updatedProduct = await product.save()
    if (!updatedProduct) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }
 
    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: updatedProduct,
    });
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
 
// User get all products
const getProducts = async (req, res) => {
  try {
    const { userId } = req.params;
    const { category, sort, searchTitle, limit = 10, page = 1 } = req.query;
    const currentPage = parseInt(page) || 1;
    const pageSize = parseInt(limit) || 10;
 
    if (userId) {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid userId format" });
      }
 
      const user = await User.findById(userId);
      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }
    }
 
    const query = [];
 
    // Filter by category
    if (category!==undefined ) {
      if(category ==="null" || category ===null){
        query.push({$match:{ category: null }});
      }
      else{
        query.push({ $match: { category } });
      }
     
    }
    // Search by product name or category
   if (searchTitle) {
      query.push({
        $match: {
          $or: [
            { name: { $regex: searchTitle, $options: "i" } },
            { category: { $regex: searchTitle, $options: "i" } },
          ],
        },
      });
    }
 
    //Lookup to join with product reviews
    query.push(
      {
        $lookup: {
          from: "productreviews",
          localField: "_id",
          foreignField: "productId",
          as: "reviews",
        },
      },
      {
        $addFields: {
          averageRating: { $ifNull: [{ $avg: "$reviews.rating" }, 0] },
          reviewCount: { $size: "$reviews" },
          oldPrice: {
            $add: [
              "$totalAmountWithTax",
              { $multiply: ["$totalAmountWithTax", { $divide: ["$discount", 100] }] },
            ],
          },
          discountedPrice:"$totalAmountWithTax" ,
        },
      }
    );
 
    // Sorting logic
    const sortStage = {};
    if (sort === "lowprice") {
      sortStage.price = 1;
    } else if (sort === "highprice") {
      sortStage.price = -1;
    } else if (sort === "toprated") {
      sortStage.averageRating = -1;
    } else if (sort === "bestoffer") {
      sortStage.discount = -1;
    }
 
    if (Object.keys(sortStage).length) {
      query.push({ $sort: sortStage });
    }
 
    // Pagination
    query.push({ $skip: (currentPage - 1) * pageSize }, { $limit: pageSize });
 
    // Select only required fields
    query.push({
      $project: {
        _id: 1,
        name: 1,
        price: 1,
        description: 1,
        image: 1,
        discount: 1,
        points: 1,
        averageRating: 1,
        reviewCount: 1,
        category: 1,
        model: 1,
        deliveryCharge: 1,
        oldPrice: 1,
        discountedPrice: 1,
        
      },
    });
 
    // Fetch products using aggregation
    const products = await Product.aggregate(query);
 
    // Get total product count
    const countQuery = category ? { category } : {};
    const totalProducts = await Product.countDocuments(countQuery);
    const totalPages = Math.ceil(totalProducts / pageSize);
 
    return res.status(200).json({
      success: true,
      data: products,
      currentPage,
      totalProducts,
      totalPages,
      hasNextPage: currentPage < totalPages,
      hasPrevPage: currentPage > 1,
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};
 
//get product by ID
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid Product ID" });
    }
 
    const query = [
      { $match: { _id: new mongoose.Types.ObjectId(id) } },
      {
        $addFields: {
          oldPrice: {
            $add: [
              "$totalAmountWithTax",
              { $multiply: ["$totalAmountWithTax", { $divide: ["$discount", 100] }] },
            ],
          },
        },
      },
    ];

    query.push({
      $addFields: {
        shareableLink:`https://neargud-be.onrender.com/api/admin/products/getProductById/${id}`,
      }
    })

    query.push({
      $project: {
        _id: 1,
        name: 1,
        price: 1,
        description: 1,
        image: 1,
        discount: 1,
        points: 1,
        averageRating: 1,
        reviewCount: 1,
        discountedPrice:"$totalAmountWithTax",
        oldPrice:1,
        deliveryCharge:1,
        category: 1,
        shareableLink:1,
      },
    });
 
    const product = await Product.aggregate(query);
 
    if (!product.length) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }
 
    res.status(200).json({ success: true, data: product[0] });
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
 
// admin getAllProducts
const getAdminProducts = async (req, res) => {
  try {
    const { searchTitle, limit = 10, page = 1 } = req.query;
    const currentPage = parseInt(page) || 1;
    const pageSize = parseInt(limit) || 10;
    
 
    // Initialize aggregation pipeline
    const query = [];
    // Filter by search title
    if (searchTitle) {
      query.push({
        $match: {
          $or: [
            { name: { $regex: searchTitle, $options: "i" } },
            { category: { $regex: searchTitle, $options: "i" } },
          ],
        },
      });
    }
 
   
 
    // Select only the required fields for admin
    query.push({
      $project: {
        _id: 1,
        name: 1,
        description: 1,
        price: 1,
        tax: 1,
        category: 1,
        deliveryCharge:1,
        image:1,
        points:1,
        discount: 1,
        totalAmountWithTax: 1,
        totalAmountWithOutTax: 1,
      },
    });
 
    // Pagination
    query.push({ $skip: (currentPage - 1) * pageSize });
    query.push({ $limit: pageSize });
 
    // Fetch products
    const products = await Product.aggregate(query);
 
    // Count total products (with same search criteria)
    const countQuery = searchTitle
      ? {
          $or: [
            { name: { $regex: searchTitle, $options: "i" } },
            { category: { $regex: searchTitle, $options: "i" } },
          ],
        }
      : {};
    const totalProducts = await Product.countDocuments(countQuery);
    const totalPages = Math.ceil(totalProducts / pageSize);
 
    res.status(200).json({
      success: true,
      data: products,
      currentPage,
      totalProducts,
      totalPages,
      hasNextPage: currentPage < totalPages,
      hasPrevPage: currentPage > 1,
    });
  } catch (error) {
    console.error("Error fetching admin products:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const getAdminProductById = async (req, res) => {
  try {
    const { id } = req.params;

    if(!id){
      return res.status(400).json({
        message:'id is required',
        success:false
      })
    }
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid Product ID" });
    }
 
    const product = await Product.findById(id);
 
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }
 
    res.status(200).json({ success: true, data: product,message:'product fetch successfull'});
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ success: false,error:error.message, message: "Internal server error" });
  }
};
// Delete product
const deleteProduct = async (req, res) => {
  try {

    const { id } = req.params;

    if(!id){
      return res.status(400).json({
        message:'id is required',
        success:false
      })
    }
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid Product ID" });
    }

    const deletedReviews = await ProductReview.deleteMany({ productId: id });
    const deletedProduct = await Product.findByIdAndDelete(id);
    // Delete images from Cloudinary
    // do not delete images from cloudinary if product in orders
    const orders = await Order.find({ "products.productId": id });

    if(orders.length === 0) {
    if (deletedProduct.image && deletedProduct.image.length > 0) {
      for (const image of deletedProduct.image) {
      const publicId = image.split("/upload/")[1].split(".")[0].split("/").slice(1).join("/");  // Extract public ID from the URL
      await cloudinary.uploader.destroy(publicId, (error, result) => {
        if (error) {
        console.error(`Error deleting image ${publicId} from Cloudinary:`, error);
        } else {
        console.log(`Image ${publicId} deleted from Cloudinary:`, result);
        }
      });
      }
    }
    }
    if (!deletedProduct) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }
 
    return res
      .status(200)
      .json({ success: true, message: "Product deleted successfully" });
  } catch (error) {
    console.error("Error deleting product:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};
 

 
// Function to get all categories or a specific category by name
const getCategories = async (req, res) => {
  try{
    // fetch all categories form existing products
    const categories = await Product.distinct("category", { category: { $ne: null } });
    res.status(200).json({ success: true, data: categories,message:'categories fetched successfully' });
  }
  catch (error) {
    console.error("Error deleting product:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
  };
   
 
 
module.exports = {
  addProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getAdminProducts,
  getAdminProductById,
  getCategories
};