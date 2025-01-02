const express = require("express");
const path = require("path");
const router = express.Router();
const multer = require("multer");
const {
  createPopup,
  getPopup,
  deletePopup,
  markFeatured,
  getSinglePopup,
  createResponse,
} = require("../controllers/popupControllers");

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

router.post("/", upload.single("popupImage"), createPopup);
router.get("/", getPopup);
router.get("/featured", getSinglePopup);
router.delete("/:id", deletePopup);
router.patch("/feature/:id", markFeatured);
router.post("/response", createResponse);

module.exports = router;
