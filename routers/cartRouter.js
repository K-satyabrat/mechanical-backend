const express = require("express");
const {getCart,addProduct, deleteProduct,updateProductQuantity} = require("../controllers/cartController");
 
const cartRouter = express.Router();
 
cartRouter.get("/:userId", getCart);
cartRouter.post("/addProduct", addProduct);
cartRouter.delete("/deleteProduct", deleteProduct);
cartRouter.put("/updateProductQuantity", updateProductQuantity);
 
module.exports = cartRouter;