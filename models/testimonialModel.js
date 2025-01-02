const mongoose = require("mongoose");

const testimonialSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  testimonials: [{ type: String, required: true }],
  imagePath: { type: String },
  createdAt: { type: Date, default: Date.now },
});

const Testimonial = mongoose.model("Testimonial", testimonialSchema);

module.exports = Testimonial;
