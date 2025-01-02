const mongoose = require('mongoose');

// Define the schema for PopupResponse
const popupResponseSchema = new mongoose.Schema({
  popup: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Popup',
    required: true
  },
  inputValue: {
    type: String,
    required: true
  },
  submittedAt: {
    type: Date,
    default: Date.now
  }
});

// Create a model for PopupResponse using the schema
const PopupResponse = mongoose.model('PopupResponse', popupResponseSchema);

module.exports = PopupResponse;
