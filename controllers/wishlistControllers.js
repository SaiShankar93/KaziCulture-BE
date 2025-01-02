const User = require("../models/userModel");
const Wishlist = require("../models/wishlistModel");

// Function to add a product to wishlist
const addToWishlist = async (req, res) => {
  const { userId, productId } = req.body;
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const wishlist = await Wishlist.findOne({ userId });
    if (
      wishlist &&
      wishlist.products.some((item) => item.productId.toString() === productId)
    ) {
      return res
        .status(400)
        .json({ message: "Product already exists in the wishlist" });
    }

    // Create a new wishlist or update existing one
    const updatedWishlist = await Wishlist.findOneAndUpdate(
      { userId },
      { $addToSet: { products: { productId } } }, // Add product to the wishlist
      { upsert: true, new: true } // Create new wishlist if not exists
    );

    return res.status(201).json({
      success: true,
      message: "Product added to wishlist successfully",
      wishlist: updatedWishlist,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to add product to wishlist",
      error: error.message,
    });
  }
};

// Function to remove a product from wishlist
const removeFromWishlist = async (req, res) => {
  const { userId, productId } = req.body;
  try {
    // Check if the wishlist exists for the user
    const wishlist = await Wishlist.findOne({ userId });
    if (!wishlist) {
      return res
        .status(404)
        .json({ success: false, message: "Wishlist not found" });
    }

    // Remove the product from the wishlist
    wishlist.products = wishlist.products.filter(
      (item) => item.productId.toString() !== productId
    );

    // Save the updated wishlist
    const updatedWishlist = await wishlist.save();

    return res.status(200).json({
      success: true,
      message: "Product removed from wishlist successfully",
      wishlist: updatedWishlist,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to remove product from wishlist",
      error: error.message,
    });
  }
};

const getWishlist = async (req, res) => {
  try {
    // Extract user ID from request parameters
    const { userId } = req.params;

    // Find the user by ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Find the wishlist associated with the user and populate the products field
    const wishlist = await Wishlist.findOne({ userId }).populate(
      "products.productId"
    );
    if (!wishlist) {
      return res.status(404).json({ message: "Wishlist not found" });
    }

    // Return the wishlist in the response
    return res.status(200).json({
      success: true,
      message: "Wishlist retrieved successfully",
      wishlist,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch wishlist",
      error: error.message,
    });
  }
};

module.exports = { addToWishlist, removeFromWishlist, getWishlist };
