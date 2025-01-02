const mongoose = require("mongoose");

const homeSliderSchema = new mongoose.Schema({
  image: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  link: {
    type: String,
    required: true,
  },
  title: {
    type: String,
  },
  description: {
    type: String,
  },
  buttonContent: {
    type: String,
  },
});

const HomeSlider = mongoose.model("HomeSlider", homeSliderSchema);

module.exports = HomeSlider;
