// models/Popup.js
const mongoose = require("mongoose");

const popupSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    imagePath: {
      type: String,
      required: true,
    },
    link: {
      type: String,
      required: true,
    },
    showAfterHours: {
      type: Number,
      required: true,
    },
    feature: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Popup = mongoose.model("Popup", popupSchema);

module.exports = Popup;
