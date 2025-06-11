const Order = require("../models/orderModel");

const generateInvoiceNo = async () => {
  try {
    const lastOrder = await Order.findOne({}, null, { sort: { _id: -1 } });
    if (lastOrder && lastOrder.invoiceNo) {
      const invoiceNo = parseInt(lastOrder.invoiceNo) + 1;
      return invoiceNo.toString().padStart(5, "0");
    } else {
      return "00001";
    }
  } catch (error) {
    console.error("Error generating invoice number:", error);
    return null;
  }
};

module.exports = generateInvoiceNo;