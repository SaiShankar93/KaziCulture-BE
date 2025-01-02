const express = require("express");
const path = require("path");
const router = express.Router();
const multer = require("multer");
const {
  updateCatalogue,
  getCatalogue,
  deleteCatalogue,
} = require("../controllers/catalogueControllers");

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

router.post("/", upload.single("catalogueImage"), updateCatalogue);
router.get("/", getCatalogue);
router.delete("/", deleteCatalogue);

module.exports = router;
