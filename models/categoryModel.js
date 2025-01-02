const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
  name: { type: String },
  fileName: { type: String, required: true },
  redirectUrl: { type: String },
  imageFilePath: { type: String, required: true },
  logoFilePath: { type: String, required: true },
  subcategories: [
    {
      name: { type: String },
      subLogoFilePath: { type: String },
      series: [
        {
          name: { type: String },
          seriesFilePath: { type: String }
        }
      ]
    }
  ],
  createdAt: { type: Date, default: Date.now },
  selected: { type: Boolean, default: false },
});

const Category = mongoose.model("Category", categorySchema);

module.exports = Category;
