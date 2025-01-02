const mongoose = require('mongoose');

const socialMediaSchema = new mongoose.Schema({
  facebook: { type: String },
  twitter: { type: String },
  youtube: { type: String },
  instagram: { type: String },
  linkedin: { type: String },
});

const SocialMedia = mongoose.model('SocialMedia', socialMediaSchema);

module.exports = SocialMedia;
