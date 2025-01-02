const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  products: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
      quantity: {
        type: Number,
        required: true,
      },
    },
  ],
  totalAmount: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: [
      "orderReceived",
      "inProgress",
      "qualityCheck",
      "outForDelivery",
      "orderDelivered",
    ],
    default: "orderReceived",
  },
  payment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Payment",
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  deliveryDate: {
    type: Date,
    default: null,
  },
});

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;
