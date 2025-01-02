const express = require("express");
const {
  addToCart,
  getCart,
  removeFromCart,
  decreaseQuantityOfProduct,
  applyCoupon,
  getCoupon,
  removeCouponFromCart,
} = require("../controllers/cartControllers");
const router = express.Router();

router.get("/:userId", getCart);
router.post("/addProduct", addToCart);
router.put("/removeProduct", removeFromCart);
router.put("/decreaseQuantity", decreaseQuantityOfProduct);
router.post("/applyCoupon", applyCoupon);
router.get("/getCoupon/:userId", getCoupon);
router.delete("/removeCoupon/:userId", removeCouponFromCart);

module.exports = router;
