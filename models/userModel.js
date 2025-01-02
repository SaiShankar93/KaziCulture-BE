const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: Number },
  role: { type: String, enum: ["user", "vendor", "admin"], default: "user" },
  companyName: { type: String },
  address: { type: String },
  city: { type: String },
  state: { type: String },
  zipCode: { type: String },
  country: { type: String },
  local: {
    password: { type: String },
  },
  google: {
    accountId: { type: String },
  },
  facebook: {
    accountId: { type: String },
  },
  category: { type: String },
  resetOTP: String,
  resetOTPExpires: Date,
  vendorAccess: { type: Boolean, default: false },
  couponsApplied: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Coupon' }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const User = mongoose.model("User", userSchema);

module.exports = User;
