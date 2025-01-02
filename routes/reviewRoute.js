const express = require("express");
const router = express.Router();
const {
  createReview,
  getReviewsForAProduct,
  editReview,
} = require("../controllers/reviewControllers");

router.post("/", createReview);
router.get("/:productId", getReviewsForAProduct);
router.put("/:reviewId", editReview);

module.exports = router;
