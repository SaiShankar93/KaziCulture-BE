const express = require("express");
const path = require("path");
const router = express.Router();
const multer = require("multer");
const { getMaterials, materialUpload, deleteMaterial } = require("../controllers/materialControllers");

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

router.post("/", upload.fields([{ name: "materialImages" }]), materialUpload);
router.get("/", getMaterials);
router.delete("/:id", deleteMaterial);

module.exports = router;
