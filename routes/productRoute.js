const express = require("express");
const {
  createProduct,
  editProduct,
  deleteProduct,
  getProduct,
  getAllProducts,
  changeStockStatus,
  importCSV,
  exportCSV,
} = require("../controllers/productControllers");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Multer storage configuration for CSV files
const csvStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "temp/csv");
  },
  filename: function (req, file, cb) {
    cb(
      null,
      `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`
    );
  },
});

// Multer upload configuration for CSV files
const uploadCSV = multer({ storage: csvStorage });

// Multer storage configuration for images
const imageStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "images"); // Destination folder for saving images
  },
  filename: function (req, file, cb) {
    cb(
      null,
      `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`
    );
  },
});

// Multer upload configuration for images
const uploadImages = multer({ storage: imageStorage });

// Multer storage configuration for GLB/GLTF files
const arFileStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "arFiles"); // Destination folder for saving AR files
  },
  filename: function (req, file, cb) {
    cb(
      null,
      `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`
    );
  },
});

// Multer upload configuration for GLB/GLTF files
const uploadARFile = multer({ storage: arFileStorage });

router.get("/all", getAllProducts);

router.post(
  "/create",
  uploadImages.fields([
    { name: "mainImage", maxCount: 1 },
    { name: "additionalImages", maxCount: 5 },
    { name: "attributeImages" },
    { name: "arFile", maxCount: 1 },
  ]),
  createProduct
);

router.put(
  "/edit/:productId",
  uploadImages.fields([
    { name: "mainImage", maxCount: 1 },
    { name: "additionalImages", maxCount: 5 },
    { name: "attributeImages" },
    { name: "arFile", maxCount: 1 },
  ]),
  editProduct
);

router.delete("/delete/:productId", deleteProduct);
router.post("/stockStatus", changeStockStatus);

router.get('/exportCSV', exportCSV);
router.post(
  "/importCSV",
  uploadCSV.single("csvFile"),
  importCSV
);

router.get("/:productId", getProduct);

module.exports = router;
