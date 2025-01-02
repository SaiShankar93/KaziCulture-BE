const mongoose = require("mongoose");

const bannerSchema = new mongoose.Schema({
  fileName: { type: String, required: true },
  redirectUrl: { type: String },
  filePath: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  title: { type: String },
  description: { type: String },
  buttonContent: { type: String }
});

const Banner = mongoose.model("Banner", bannerSchema);

module.exports = Banner;