const mongoose = require("mongoose");

const catalogueSchema = new mongoose.Schema({
  image: {
    type: String,
    required: true,
  },
  links: [
    {
      type: String,
      required: true,
    },
  ],
});

const Catalogue = mongoose.model("Catalogue", catalogueSchema);

module.exports = Catalogue;
