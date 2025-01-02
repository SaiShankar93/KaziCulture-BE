const express = require("express");

const {
  getOrdersForUser,
  getAllOrders,
  stripePayment,
  cybersourcePayment,
  sendOtp,
  verifyOtp,
  IPGPaymentOrder,
  getAllPayments,
  handlePaymentStatus,
  SuccessIPG,
} = require("../controllers/orderControllers");
const { applyCoupon } = require("../controllers/cartControllers");
const router = express.Router();

router.post("/ipg-payment", IPGPaymentOrder);
router.post("/successTransaction", SuccessIPG);
router.post("/stripe-checkout", stripePayment);
router.get("/getAllPayments", getAllPayments);
router.put("/paymentStatus", handlePaymentStatus);
router.get("/:userId", getOrdersForUser);
router.get("/", getAllOrders);
router.post("/applyCoupon", applyCoupon);
router.post("/sendOtp", sendOtp);
router.post("/verifyOtp", verifyOtp);

module.exports = router;
