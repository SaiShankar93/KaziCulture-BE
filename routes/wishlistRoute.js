const express = require("express");
const {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
} = require("../controllers/wishlistControllers");
const router = express.Router();

router.get("/:userId", getWishlist);
router.post("/addProduct", addToWishlist);
router.put("/removeProduct", removeFromWishlist);

module.exports = router;
