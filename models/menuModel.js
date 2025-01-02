const mongoose = require("mongoose");

const subItemSchema = new mongoose.Schema({
  title: { type: String, required: true },
  url: { type: String, required: true },
});

const menuItemSchema = new mongoose.Schema({
  title: { type: String, required: true },
  url: { type: String }, 
  subItems: [subItemSchema],
});

const menuSchema = new mongoose.Schema({
  items: [menuItemSchema], 
});

const Menu = mongoose.model("Menu", menuSchema);

module.exports = Menu;
