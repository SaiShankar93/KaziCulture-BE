const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const MaterialSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  details: [
    {
      value: {
        type: String,
        required: true,
      },
      price: {
        type: String,
        required: true,
      },
      materialImage: {
        type: String,
      },
    },
  ],
});

const Material = mongoose.model("Material", MaterialSchema);

module.exports = Material;
