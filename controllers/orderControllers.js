const Order = require("../models/orderModel");
const User = require("../models/userModel");
const Cart = require("../models/cartModel");
const Coupon = require("../models/couponModel");
const crypto = require("crypto");
const axios = require("axios");
const nodemailer = require("nodemailer");
const CryptoJS = require("crypto-js");
const moment = require("moment-timezone");
const Payment = require("../models/paymentModel");
const { default: mongoose } = require("mongoose");
const stripe = require("stripe")(process.env.STRIPE_PRIVATE_KEY);

const client_url = process.env.CLIENT_URL;
const server_url = process.env.SERVER_URL;

const stripePayment = async (req, res) => {
  const { customer, products, totalAmount, status } = req.body;
  try {
    // Update user details in the database
    const updatedUser = await updateUserDetails(customer);

    // Create line items for the Stripe Checkout session
    const lineItems = products.map((product) => ({
      price_data: {
        currency: "AED",
        product_data: {
          name: product.productId.title,
          description: "Furniture Product",
        },
        unit_amount: product.productId.price * 100,
      },
      quantity: product.quantity,
    }));

    const productMetadata = products.reduce((metadata, product) => {
      metadata[product.productId._id] = product.quantity;
      return metadata;
    }, {});

    const productMetadataString = JSON.stringify(productMetadata);

    // Create a Stripe Checkout session
    const stripeSession = await stripe.checkout.sessions.create({
      success_url: client_url,
      cancel_url: client_url,
      payment_method_types: ["card"],
      mode: "payment",
      billing_address_collection: "auto",
      customer_email: customer.email,
      line_items: lineItems,
      metadata: {
        customerId: customer.customerId,
        products: productMetadataString,
        totalAmount,
      },
    });

    res.json({ id: stripeSession.id });
  } catch (error) {
    console.error("Error creating Stripe Checkout Session:", error);
    res
      .status(500)
      .json({ error: "An error occurred while creating a checkout session" });
  }
};

// Function to update user details in the database
const updateUserDetails = async (customer) => {
  try {
    // Retrieve user details from the database based on the email
    const user = await User.findById(customer.customerId);

    if (user) {
      // Update user details with the new information
      user.address = customer.addressLine1 + " " + customer.addressLine2;
      user.companyName = customer.companyName;
      user.phone = customer.phone;
      user.country = customer.country;
      user.city = customer.city;
      user.state = customer.state;
      user.zipCode = customer.zipCode;

      // Save the updated user details back to the database
      await user.save();
    } else {
      console.error("User not found");
    }

    return user;
  } catch (error) {
    console.error("Error updating user details:", error);
    throw error;
  }
};

const getOrdersForUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const orders = await Order.find({ customer: userId }).populate(
      "products.product"
    );

    return res.status(200).json({ orders });
  } catch (error) {
    console.error("Error fetching orders for user:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("customer")
      .populate("products.product");

    if (!orders || orders.length === 0) {
      return res.status(404).json({ error: "No orders found" });
    }

    return res.status(200).json({ orders });
  } catch (error) {
    console.error("Error fetching all orders:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const generateOTP = () => {
  return Math.floor(1000 + Math.random() * 9000);
};

// Send OTP email
const sendOTPEmail = async (email, otp) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: process.env.EMAILUSER,
        pass: process.env.EMAILPASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.EMAILUSER,
      to: email,
      subject: "Password Reset OTP",
      html: `
        <html>
          <head>
            <style>
              body {
                font-family: Arial, sans-serif;
                background-color: #f4f4f4;
                margin: 0;
                padding: 0;
              }
              .container {
                max-width: 600px;
                margin: 20px auto;
                padding: 20px;
                background-color: #fff;
                border-radius: 10px;
                box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
              }
              h1 {
                color: #333;
              }
              p {
                color: #555;
                font-size: 16px;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>Verification OTP</h1>
              <p>Your verification OTP is: <strong>${otp}</strong></p>
              <p>Please use this OTP to verify your email.</p>
            </div>
          </body>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log("OTP email sent");
  } catch (error) {
    console.error("Error sending OTP email:", error);
  }
};

const sendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    console.log(email);
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).send("User not found. Please register first.");
    }

    const otp = generateOTP();
    user.resetOTP = otp;
    user.resetOTPExpires = Date.now() + 600000;

    await user.save();
    await sendOTPEmail(email, otp);
    res.send("OTP sent to your email");
  } catch (error) {
    console.error("Error sending OTP:", error);
    res.status(500).send("Internal Server Error");
  }
};

const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({
      email,
      resetOTP: otp,
      resetOTPExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).send("Invalid or expired OTP");
    }

    res.send("OTP verified successfully");
  } catch (error) {
    console.error("Error verifying OTP:", error);
    res.status(500).send("Internal Server Error");
  }
};

const generateRandomString = () => {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
};

const SuccessIPG = async (req, res) => {
  try {
    // Assuming req.body contains the data you want to send in the POST request
    const { customerId, chargetotal, status, ipgTransactionId, ccbrand } =
      req.body;

    const products = JSON.parse(req.body.products);
    console.log(
      customerId,
      chargetotal,
      status,
      ipgTransactionId,
      ccbrand,
      products
    );

    const order = await Order.create({
      customer:customerId,
      products,
      totalAmount: chargetotal,
    });

    const cart = await Cart.findOne({ userId: customerId });

    const payment = await Payment.create({
      paymentId: ipgTransactionId,
      order: order._id,
      amount: chargetotal,
      status,
      paymentMethod: ccbrand,
    });

    order.payment = payment._id;
    await order.save();

    if (cart) {
      await Cart.findByIdAndDelete(cart._id);
    }

    // Make the POST request to client_url/successTransaction
    res.redirect(`${client_url}/successTransaction`);
  } catch (error) {
    // Handle errors
    console.error("Error making POST request:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to make POST request" });
  }
};

const IPGPaymentOrder = async (req, res) => {
  try {
    const order = await Order.create({
      customer,
      products,
      totalAmount,
    });

    const cart = await Cart.findOne({ userId: customer });

    const payment = await Payment.create({
      paymentId: generateRandomString(),
      order: order._id,
      amount: totalAmount,
      status: "pending",
      paymentMethod: "Credit Card",
    });

    order.payment = payment._id;
    await order.save();

    if (cart) {
      await Cart.findByIdAndDelete(cart._id);
    }

    res.status(201).json({ order, payment });
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ error: "Failed to create order" });
  }
};

const handlePaymentStatus = async (req, res) => {
  const { transactionId, newStatus } = req.body;
  try {
    const payment = await Payment.findOne({ _id: transactionId });

    if (!payment) {
      console.error("Payment not found for transaction:", transactionId);
      return res
        .status(404)
        .json({ message: "Payment not found", success: false });
    }

    payment.status = newStatus;
    await payment.save();

    console.log(
      `Payment status updated to ${newStatus} for transaction:`,
      transactionId
    );
    return res
      .status(200)
      .json({ message: "Payment status updated successfully", success: true });
  } catch (error) {
    console.error("Error updating payment status:", error);
    return res
      .status(500)
      .json({ message: "Failed to update payment status", success: false });
  }
};

const getAllPayments = async (req, res) => {
  try {
    const payments = await Payment.find();

    console.log("All payments:", payments);
    res
      .status(201)
      .json({ message: "Payments fetched successfully", payments });
  } catch (error) {
    console.error("Error fetching payments:", error);
    res.status(500).json({ error: "Failed to fetch payments" });
  }
};

module.exports = {
  stripePayment,
  getOrdersForUser,
  getAllOrders,
  SuccessIPG,
  IPGPaymentOrder,
  sendOtp,
  verifyOtp,
  getAllPayments,
  handlePaymentStatus,
};
