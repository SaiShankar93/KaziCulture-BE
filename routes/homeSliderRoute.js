const express = require("express");
const path = require("path");
const router = express.Router();
const multer = require("multer");
const {
  uploadSlider,
  getSliders,
  deleteSlider,
} = require("../controllers/homeSliderControllers");

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

router.post("/", upload.single("sliderImage"), uploadSlider);
router.get("/", getSliders);
router.delete("/:id", deleteSlider);

module.exports = router;
