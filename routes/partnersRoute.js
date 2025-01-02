const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const {
  uploadPartner,
  getPartners,
  deletePartner,
} = require("../controllers/partnerControllers");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "images/");
  },
  filename: function (req, file, cb) {
    cb(
      null,
      `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`
    );
  },
});

const upload = multer({ storage: storage });

router.post("/", upload.single("partnerLogo"), uploadPartner);
router.get("/", getPartners);
router.delete("/:partnerId", deletePartner);

module.exports = router;
