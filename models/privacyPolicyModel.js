const mongoose = require('mongoose');

const privacyPolicySchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
  },
  datePublished: {
    type: Date,
    default: Date.now,
  },
});

const PrivacyPolicy = mongoose.model('PrivacyPolicy', privacyPolicySchema);

module.exports = PrivacyPolicy;
