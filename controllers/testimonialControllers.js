const Testimonial = require("../models/testimonialModel");
const fs = require("fs");
const path = require("path");
const server_url = process.env.SERVER_URL;

const createTestimonial = async (req, res) => {
  try {
    const { title, description, testimonials } = req.body;
    const imagePath = req.file.path;

    const parsedTestimonials = JSON.parse(testimonials);

    const existingTestimonial = await Testimonial.findOne();
    if (existingTestimonial) {
      fs.unlinkSync(existingTestimonial.imagePath);
      await existingTestimonial.deleteOne();
    }

    const newTestimonial = new Testimonial({
      title,
      description,
      testimonials: parsedTestimonials,
      imagePath,
    });

    await newTestimonial.save();
    res.status(201).json(newTestimonial);
  } catch (error) {
    res.status(500).json({ message: "Error creating testimonial", error });
  }
};

const getTestimonials = async (req, res) => {
  try {
    const testimonial = await Testimonial.findOne();
    if (testimonial) {
        testimonial.imagePath = `${server_url}/${testimonial.imagePath.replace(/\\/g, "/")}`;
      res.status(200).json(testimonial);
    } else {
      res.status(404).json({ message: "No testimonial found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error fetching testimonial", error });
  }
};

const deleteTestimonial = async (req, res) => {
  try {
    const testimonial = await Testimonial.findOne();
    if (testimonial) {
      await testimonial.deleteOne();
      res.status(200).json({ message: "Testimonial deleted successfully" });
    } else {
      res.status(404).json({ message: "No testimonial found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error deleting testimonial", error });
  }
};

module.exports = {
  createTestimonial,
  getTestimonials,
  deleteTestimonial,
};
