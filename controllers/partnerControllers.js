const Partner = require("../models/partnersModel");
const server_url = process.env.SERVER_URL;

const uploadPartner = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const partner = new Partner({
      name: req.body.partnerName,
      logo: req.file.path,
    });

    await partner.save();
    res.status(201).json({ message: "Partner uploaded successfully" });
  } catch (error) {
    console.error("Error uploading partner:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const getPartners = async (req, res) => {
  try {
    const partners = await Partner.find();
    const partnersWithUrls = partners.map((partner) => ({
      _id: partner._id,
      name: partner.name,
      logo: `${server_url}/${partner.logo.replace(/\\/g, "/")}`,
    }));

    res.status(200).json(partnersWithUrls);
  } catch (error) {
    console.error("Error fetching partners:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const deletePartner = async (req, res) => {
  try {
    const partnerId = req.params.partnerId;
    const partner = await Partner.findById(partnerId);

    if (!partner) {
      return res.status(404).json({ message: "Partner not found" });
    }

    await Partner.findByIdAndDelete(partnerId);

    res.status(200).json({ message: "Partner deleted successfully" });
  } catch (error) {
    console.error("Error deleting partner:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = { uploadPartner, getPartners, deletePartner };
