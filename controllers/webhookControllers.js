const Cart = require("../models/cartModel");
const Order = require("../models/orderModel");
const stripe = require("stripe")(process.env.STRIPE_PRIVATE_KEY);

const clearCart = async (userId) => {
  try {
    const userCart = await Cart.findOne({ userId });
    if (userCart) {
      userCart.products = [];
      await userCart.save();
    }
  } catch (error) {
    console.error("Error clearing cart:", error);
    throw error;
  }
};

const createOrder = async (customerId, products, totalAmount) => {
  try {
    // Create a new order object
    const newOrder = new Order({
      customer: customerId,
      products: products,
      totalAmount,
      status: "pending",
    });

    // Save the new order to the database
    const savedOrder = await newOrder.save();

    return savedOrder;
  } catch (error) {
    console.error("Error creating order:", error);
    throw error;
  }
};

const stripeWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Error verifying webhook signature:", err);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const metadata = session.metadata;

    try {
      // Extract necessary information from the metadata
      const customerId = metadata.customerId
      const productsObject = JSON.parse(metadata.products);
      const totalAmount = parseFloat(metadata.totalAmount);

      const products = Object.entries(productsObject).map(
        ([productId, quantity]) => ({
          product: productId, // Assign the product ID
          quantity: quantity, // Assign the quantity
        })
      );
      // Create an order based on the session information
      const createdOrder = await createOrder(customerId, products, totalAmount);

      // Clear the user's cart
      await clearCart(customerId);

      // Send a response to indicate successful order creation
      res.status(200).json({
        message: "Order created successfully",
        orderId: createdOrder._id,
      });
    } catch (error) {
      console.error("Error processing webhook event:", error);
      res
        .status(500)
        .json({
          error: "An error occurred while processing the webhook event",
        });
    }
  } else {
    // Unexpected event type
    res.status(400).end();
  }
};

module.exports = { stripeWebhook };
