const HomeSlider = require("../models/homeSliderModel");
const server_url = process.env.SERVER_URL;
const fs = require("fs");

const uploadSlider = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const { title, description, buttonContent, name, link } = req.body;

    const slider = new HomeSlider({
      image: req.file.path,
      title,
      description,
      buttonContent,
      name,
      link,
    });

    await slider.save();
    res.status(201).json({ message: "Slider uploaded successfully" });
  } catch (error) {
    console.error("Error uploading slider:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const getSliders = async (req, res) => {
  try {
    const sliders = await HomeSlider.find();
    const slidersWithUrls = sliders.map((slider) => ({
      _id: slider._id,
      image: `${server_url}/${slider.image.replace(/\\/g, "/")}`,
      name: slider.name,
      link: slider.link,
      title: slider.title,
      description: slider.description,
      buttonContent : slider.buttonContent,
    }));

    res.status(200).json(slidersWithUrls);
  } catch (error) {
    console.error("Error fetching sliders:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const deleteSlider = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(id);
    const deletedSlider = await HomeSlider.findByIdAndDelete(id);

    if (!deletedSlider) {
      return res.status(404).json({ error: "Slider not found" });
    }

    res.status(200).json({ message: "Slider deleted successfully" });
  } catch (error) {
    console.error("Error deleting slider:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = { uploadSlider, getSliders, deleteSlider };
