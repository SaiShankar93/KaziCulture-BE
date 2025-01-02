const express = require("express");
const path = require("path");
const router = express.Router();
const multer = require("multer");
const {
  createTestimonial,
  getTestimonials,
  deleteTestimonial,
} = require("../controllers/testimonialControllers");

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

router.post("/create", upload.single("testimonialImage"), createTestimonial);
router.get("/", getTestimonials);
router.delete("/", deleteTestimonial);

module.exports = router;
