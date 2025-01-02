const Review = require("../models/reviewModel");

const createReview = async (req, res) => {
  const { productId, userId, rating, comment, title } = req.body;
  try {
    const review = await Review.create({
      productId,
      userId,
      rating,
      comment,
      title,
    });
    res.status(201).json({
      success: true,
      message: "Review Submitted Successfully",
      review,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create review",
      error: error.message,
    });
  }
};

const editReview = async (req, res) => {
  const { reviewId } = req.params;
  const { rating, comment, title } = req.body;
  try {
    const review = await Review.findByIdAndUpdate(
      reviewId,
      { rating, comment, title },
      { new: true }
    );
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }
    res.status(200).json({
      success: true,
      message: "Review updated successfully",
      review,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update review",
      error: error.message,
    });
  }
};

const getReviewsForAProduct = async (req, res) => {
  const { productId } = req.params;
  try {
    const reviews = await Review.find({ productId }).populate('userId');
    res.status(200).json({
      success: true,
      message: "Reviews retrieved successfully",
      reviews,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve reviews",
      error: error.message,
    });
  }
};

module.exports = { createReview, editReview, getReviewsForAProduct };
