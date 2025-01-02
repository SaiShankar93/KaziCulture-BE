const mongoose = require('mongoose');

const partnerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  logo: {
    type: String,
    required: true
  }
});

const Partner = mongoose.model('Partner', partnerSchema);

module.exports = Partner;
