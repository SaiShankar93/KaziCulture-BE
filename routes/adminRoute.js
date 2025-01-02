const express = require("express");
const {
  approveVendor,
  productApproval,
  addBanner,
  createCoupon,
  deleteCoupon,
  changeOrderStatus,
  updateDeliveryDate,
  markFeatured,
  updatePrivacyPolicy,
  getPrivacyPolicy,
  getAllCoupons,
  generateNewsletter,
  getSocial,
  updateSocial,
  updateMenu,
  getMenu,
  getCategories,
  addCategory,
  markSelectedCategories,
  updateUserDetails,
  addSubcategory,
  createBlog,
  getAllBlogs,
  addSeries,
  deleteBanner,
  deleteBlog,
} = require("../controllers/adminControllers");
const router = express.Router();
const multer = require("multer");
const path = require("path");

// Multer storage configuration for banners
const bannerStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "images");
  },
  filename: function (req, file, cb) {
    const originalFilename = file.originalname;
    const extension = path.extname(originalFilename);
    const filenameWithoutExtension = originalFilename.replace(extension, "");
    const bannerFilename = `${filenameWithoutExtension}-banner-${Date.now()}${extension}`;
    cb(null, bannerFilename);
  },
});

// Multer storage configuration for categories
const categoryStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "images");
  },
  filename: function (req, file, cb) {
    const originalFilename = file.originalname;
    const extension = path.extname(originalFilename);
    const filenameWithoutExtension = originalFilename.replace(extension, "");
    const categoryFilename = `${filenameWithoutExtension}-category-${Date.now()}${extension}`;
    cb(null, categoryFilename);
  },
});

// Multer storage configuration for subcategory logos
const subcategoryLogoStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "images");
  },
  filename: function (req, file, cb) {
    const originalFilename = file.originalname;
    const extension = path.extname(originalFilename);
    const filenameWithoutExtension = originalFilename.replace(extension, "");
    const logoFilename = `${filenameWithoutExtension}-subcategory-logo-${Date.now()}${extension}`;
    cb(null, logoFilename);
  },
});

// Multer storage configuration for series logos
const seriesLogoStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "images");
  },
  filename: function (req, file, cb) {
    const originalFilename = file.originalname;
    const extension = path.extname(originalFilename);
    const filenameWithoutExtension = originalFilename.replace(extension, "");
    const seriesLogoFilename = `${filenameWithoutExtension}-series-logo-${Date.now()}${extension}`;
    cb(null, seriesLogoFilename);
  },
});

// Multer storage configuration for blog images
const blogImageStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "images");
  },
  filename: function (req, file, cb) {
    const originalFilename = file.originalname;
    const extension = path.extname(originalFilename);
    const filenameWithoutExtension = originalFilename.replace(extension, "");
    const blogImageFilename = `${filenameWithoutExtension}-blog-${Date.now()}${extension}`;
    cb(null, blogImageFilename);
  },
});

// Multer upload configuration for banners
const bannerUpload = multer({ storage: bannerStorage });

// Multer upload configuration for category images and logos
const categoryUpload = multer({ storage: categoryStorage }).fields([
  { name: "categoryImage", maxCount: 1 },
  { name: "categoryLogo", maxCount: 1 },
]);

// Multer upload configuration for subcategory logos
const subcategoryLogoUpload = multer({
  storage: subcategoryLogoStorage,
}).single("subcategoryLogo");

// Multer upload configuration for series logos
const seriesLogoUpload = multer({ storage: seriesLogoStorage }).single(
  "seriesLogo"
);

// Multer upload configuration for blog images
const blogImageUpload = multer({ storage: blogImageStorage }).single(
  "blogImage"
);

// Routes for banners
router.post("/uploadBanner", bannerUpload.single("banner"), addBanner);
router.delete("/banner/:bannerId", deleteBanner);

// Routes for categories
router.post(
  "/category",
  (req, res, next) => {
    categoryUpload(req, res, (err) => {
      if (err) {
        console.log(err);
        return res
          .status(400)
          .json({ error: "Category image/logo upload failed" });
      }
      next();
    });
  },
  addCategory
);

// Add a route for adding subcategories
router.post(
  "/subcategory",
  (req, res, next) => {
    subcategoryLogoUpload(req, res, (err) => {
      if (err) {
        console.log(err);
        return res
          .status(400)
          .json({ error: "Subcategory logo upload failed" });
      }
      next();
    });
  },
  addSubcategory
);

// Add a route for adding series
router.post(
  "/series",
  (req, res, next) => {
    seriesLogoUpload(req, res, (err) => {
      if (err) {
        console.log(err);
        return res.status(400).json({ error: "Series logo upload failed" });
      }
      next();
    });
  },
  addSeries
);

// Route for creating a blog post
router.post(
  "/createBlog",
  (req, res, next) => {
    blogImageUpload(req, res, (err) => {
      if (err) {
        console.log(err);
        return res.status(400).json({ error: "Blog image upload failed" });
      }
      next();
    });
  },
  createBlog
);

router.get("/category", getCategories);
router.post("/category/select", markSelectedCategories);

// Other routes
router.post("/approveVendor", approveVendor);
router.post("/approveProduct", productApproval);
router.get("/coupons", getAllCoupons);
router.post("/createCoupon", createCoupon);
router.delete("/coupons/:id", deleteCoupon);
router.put("/orderStatus", changeOrderStatus);
router.post("/updateDelivery", updateDeliveryDate);
router.post("/markFeatured", markFeatured);
router.get("/privacy", getPrivacyPolicy);
router.post("/privacy", updatePrivacyPolicy);
router.post("/newsletter", generateNewsletter);
router.get("/social", getSocial);
router.post("/social", updateSocial);
router.get("/menu", getMenu);
router.post("/menu", updateMenu);
router.put("/updateCustomer", updateUserDetails);
router.get("/blogs", getAllBlogs);
router.delete("/blog/:id", deleteBlog);

module.exports = router;
