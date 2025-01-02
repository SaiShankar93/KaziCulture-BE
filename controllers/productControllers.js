const { sendEmail } = require("../config/sendEmail");
const Product = require("../models/productModel");
const Review = require("../models/reviewModel");
const User = require("../models/userModel");
const csv = require("csv-parser");
const fs = require("fs");
const path = require("path");
const { Parser } = require("json2csv");
const mongoose = require("mongoose");
const Material = require("../models/materialModel");

const server_url = process.env.SERVER_URL;
const getProduct = async (req, res) => {
  try {
    const productId = req.params.productId;

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    const reviews = await Review.find({ productId });

    let totalRating = 0;
    if (reviews.length > 0) {
      totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
      totalRating /= reviews.length;
    }

    console.log("Original product object:", product);

    const cleanPath = (path) => {
      return path
        .replace(/\\/g, "/")
        .replace(/["[\]]/g, "")
        .replace(/^\/+|\/+$/g, "");
    };

    const mainImageURL = `${server_url.replace(/\/+$/, "")}/${cleanPath(product.mainImage)}`;

    const additionalImagesURLs = product.additionalImages.map((image) => {
      const cleanImage = cleanPath(image);
      console.log("Processing additional image:", cleanImage);
      return `${server_url.replace(/\/+$/, "")}/${cleanImage}`;
    });

    const attributeImagesURLs = product.attributes.map((attribute) => {
      const attributeImage = attribute.attributeImage;
      console.log("Processing attribute image:", attributeImage);
      if (attributeImage && attributeImage.startsWith("http")) {
        return attribute.toObject();
      } else if (attributeImage) {
        const attributeImageURL = `${server_url.replace(/\/+$/, "")}/${cleanPath(attributeImage)}`;
        return {
          ...attribute.toObject(),
          attributeImage: attributeImageURL,
        };
      }
      return attribute.toObject();
    });
    const arFileURL = product.arFilePath
      ? `${server_url}/${cleanPath(product.arFilePath)}`
      : null;

    const productWithImagesAndRating = {
      ...product.toObject(),
      mainImage: mainImageURL,
      additionalImages: additionalImagesURLs,
      attributes: attributeImagesURLs,
      avgRating: totalRating.toFixed(1),
      arFilePath: arFileURL,
    };

    console.log("Processed product object:", productWithImagesAndRating);

    res.status(200).json(productWithImagesAndRating);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find();

    const reviewsMap = {};
    const productIds = products.map((product) => product._id);
    const reviews = await Review.find({ productId: { $in: productIds } });

    reviews.forEach((review) => {
      if (!reviewsMap[review.productId]) {
        reviewsMap[review.productId] = [];
      }
      reviewsMap[review.productId].push(review);
    });

    const productsWithImagesAndRating = products.map((product) => {
      const mainImageURL = `${server_url}/${product.mainImage.replace(
        /\\/g,
        "/"
      )}`;

      const additionalImagesURLs = product.additionalImages.map((image) => {
        return `${server_url}/${image.replace(/\\/g, "/")}`;
      });

      const attributeImagesURLs = product.attributes.map((attribute) => {
        const attributeImage = attribute.attributeImage;
        if (attributeImage && attributeImage.startsWith("http")) {
          return attribute.toObject();
        } else if (attributeImage) {
          const attributeImageURL = `${server_url}/${attributeImage.replace(
            /\\/g,
            "/"
          )}`;
          return {
            ...attribute.toObject(),
            attributeImage: attributeImageURL,
          };
        }
        return attribute.toObject();
      });

      const arFileURL = product.arFilePath
        ? `${server_url}/${product.arFilePath.replace(/\\/g, "/")}`
        : null;

      let avgRating = 0;
      const productReviews = reviewsMap[product._id];
      if (productReviews && productReviews.length > 0) {
        const totalRating = productReviews.reduce(
          (sum, review) => sum + review.rating,
          0
        );
        avgRating = totalRating / productReviews.length;
      }

      return {
        ...product.toObject(),
        mainImage: mainImageURL,
        additionalImages: additionalImagesURLs,
        attributes: attributeImagesURLs,
        avgRating: avgRating.toFixed(1),
        arFilePath: arFileURL
      };
    });

    res.status(200).json(productsWithImagesAndRating);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createProduct = async (req, res) => {
  try {
    console.log("Request body:", req.body);
    const {
      title,
      description,
      discounts,
      discountValue,
      price,
      currency,
      available,
      pieces,
      promotional,
      editorContent,
      width,
      height,
      weight,
      status,
      sku,
      mainCategory,
      subCategory,
      series,
      tags,
      vendorId,
      threeDiaLinkHor,
      threeDiaLinkVer,
      metaTitle,
      metaDescription,
      metaTags,
      approved,
      isStock,
    } = req.body;

    const mainCategoryArray = mainCategory ? mainCategory.split(",") : [];
    const subCategoryArray = subCategory ? subCategory.split(",") : [];
    const seriesArray = series ? series.split(",") : [];

    var attributes;

    if (typeof req.body.attributes === "string") {
      try {
        attributes = JSON.parse(req.body.attributes);
      } catch (error) {
        console.error("Error parsing attributes:", error);
        attributes = [];
      }
    } else if (Array.isArray(req.body.attributes)) {
      attributes = JSON.parse(req.body.attributes[1]);
    } else {
      console.error(
        "Unexpected type for attributes:",
        typeof req.body.attributes
      );
      attributes = [];
    }

    // Check if required fields are present
    if (!title || !description || !price || !vendorId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Initialize arrays to store image paths
    const mainImagePaths = [];
    const additionalImagePaths = [];
    var arFilePath;

    // Check if mainImage and additionalImages are present in the request
    if (req.files) {
      // Process mainImage
      if (req.files.mainImage) {
        // If mainImage is an array of files
        if (Array.isArray(req.files.mainImage)) {
          req.files.mainImage.forEach((file) => {
            mainImagePaths.push(file.path);
          });
        } else {
          mainImagePaths.push(req.files.mainImage.path);
        }
      }

      // Process additionalImages
      if (req.files.additionalImages) {
        // If additionalImages is an array of files
        if (Array.isArray(req.files.additionalImages)) {
          req.files.additionalImages.forEach((file) => {
            additionalImagePaths.push(file.path);
          });
        } else {
          additionalImagePaths.push(req.files.additionalImages.path);
        }
      }
      if (req.files.arFile) {
        arFilePath = req.files.arFile[0].path;
      }
    }

    const attributeImages =
      req.files && req.files.attributeImages
        ? Array.isArray(req.files.attributeImages)
          ? req.files.attributeImages
          : [req.files.attributeImages]
        : [];

    console.log(attributes);
    const attributeImageMap = {};
    attributeImages.forEach((file) => {
      attributeImageMap[file.originalname] = file.path;
    });

    // Create a new Product object
    const newProduct = new Product({
      title,
      description,
      discounts,
      discountValue,
      price,
      currency,
      available,
      pieces,
      promotional,
      editorContent,
      width,
      height,
      weight,
      status,
      sku,
      mainImage: mainImagePaths[0],
      additionalImages: additionalImagePaths,
      mainCategory: mainCategoryArray,
      subCategory: subCategoryArray,
      series: seriesArray,
      tags,
      vendorId,
      attributes: attributes.map((attribute) => ({
        ...attribute,
        attributeImage:
          attributeImageMap[attribute.attributeImage] ||
          attribute.attributeImage,
      })),
      threeDiaLinkHor,
      threeDiaLinkVer,
      arFilePath,
      metaTitle,
      metaDescription,
      metaTags,
      approved,
      isStock,
    });

    const savedProduct = await newProduct.save();

    if (vendorId) {
      const vendor = await User.findById(vendorId);
      console.log(vendor);
      if (vendor && vendor.role === "vendor") {
        const subject = "Product Creation Notification";
        const message = `
          <html>
            <head>
              <style>
                body {
                  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                  font-size: 16px;
                  line-height: 1.6;
                  color: #333;
                  background-color: #f9f9f9;
                  margin: 0;
                  padding: 0;
                }
                .container {
                  margin: 20px auto;
                  padding: 20px;
                  background-color: #ffffff;
                  border-radius: 10px;
                  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                  max-width: 600px;
                }
                h2 {
                  color: #333;
                  margin-top: 0;
                }
                p {
                  margin: 10px 0;
                  font-size: 16px;
                }
                a {
                  color: #007bff;
                  text-decoration: none;
                }
              </style>
            </head>
            <body>
              <div class="container">
                <h2>Dear ${vendor.name},</h2>
                <p>Your product "${title}" has been submitted successfully for review. Our team will review the product and notify you once it is approved.</p>
                <p>Thank you for your contribution.</p>
              </div>
            </body>
          </html>
        `;
        await sendEmail(vendor.name, vendor.email, subject, message);
      }
    }
    // Respond with the saved product
    res.status(201).json(savedProduct);
  } catch (error) {
    // Handle error
    console.log(error.message);
    res.status(500).json({ error: error.message });
  }
};

const editProduct = async (req, res) => {
  try {
    // Extract product information from request body
    const productId = req.params.productId;
    console.log(productId);
    const {
      title,
      description,
      discounts,
      discountValue,
      price,
      currency,
      available,
      pieces,
      promotional,
      editorContent,
      width,
      height,
      weight,
      status,
      sku,
      mainCategory,
      subCategory,
      series,
      tags,
      vendorId,
      threeDiaLinkHor,
      threeDiaLinkVer,
      metaTitle,
      metaDescription,
      metaTags,
    } = req.body;

    console.log(req.body);

    const mainCategoryArray = mainCategory ? mainCategory.split(",") : [];
    const subCategoryArray = subCategory ? subCategory.split(",") : [];
    const seriesArray = series ? series.split(",") : [];

    var attributes;

    if (typeof req.body.attributes === "string") {
      try {
        attributes = JSON.parse(req.body.attributes);
      } catch (error) {
        console.error("Error parsing attributes:", error);
        attributes = [];
      }
    } else if (Array.isArray(req.body.attributes)) {
      attributes = JSON.parse(req.body.attributes[1]);
    } else {
      console.error(
        "Unexpected type for attributes:",
        typeof req.body.attributes
      );
      attributes = [];
    }

    // Find the existing product by ID
    let product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Initialize arrays to store image paths
    const mainImagePaths = [];
    const additionalImagePaths = [];
    var arFilePath;

    // Check if mainImage and additionalImages are present in the request
    if (req.files) {
      // Process mainImage
      if (req.files.mainImage) {
        // If mainImage is an array of files
        if (Array.isArray(req.files.mainImage)) {
          req.files.mainImage.forEach((file) => {
            mainImagePaths.push(file.path);
          });
        } else {
          mainImagePaths.push(req.files.mainImage.path);
        }
      }

      // Process additionalImages
      if (req.files.additionalImages) {
        // If additionalImages is an array of files
        if (Array.isArray(req.files.additionalImages)) {
          req.files.additionalImages.forEach((file) => {
            additionalImagePaths.push(file.path);
          });
        } else {
          additionalImagePaths.push(req.files.additionalImages.path);
        }
      }
      if (req.files.arFile) {
        arFilePath = req.files.arFile[0].path;
      }
    }

    const attributeImages =
      req.files && req.files.attributeImages
        ? Array.isArray(req.files.attributeImages)
          ? req.files.attributeImages
          : [req.files.attributeImages]
        : [];

    console.log(attributes);
    const attributeImageMap = {};
    attributeImages.forEach((file) => {
      attributeImageMap[file.originalname] = file.path;
    });

    // Update product fields with new values
    product.title = title;
    product.description = description;
    product.discounts = discounts;
    discountValue === "null" ? 0 : Number(discountValue);
    product.price = price;
    product.currency = currency;
    product.available = available === "null" ? null : parseInt(available);
    product.pieces = pieces === "null" ? null : parseInt(pieces);
    product.promotional = promotional;
    product.editorContent = editorContent;
    product.width = width === "null" ? null : parseInt(width);
    product.height = height === "null" ? null : parseInt(height);
    product.weight = weight === "null" ? null : parseInt(weight);
    product.status = status;
    product.sku = sku;
    product.mainCategory = mainCategoryArray;
    product.subCategory = subCategoryArray;
    product.series = seriesArray;
    product.tags = tags;
    product.vendorId = vendorId;
    product.attributes = attributes.map(({ _id, ...attribute }) => {
      const foundAttribute = product.attributes.find(
        (attr) => String(attr._id) === String(_id)
      );
      return {
        ...attribute,
        attributeImage:
          attributeImageMap[attribute.attributeImage] ||
          foundAttribute?.attributeImage ||
          attribute.attributeImage ||
          null,
      };
    });
    product.threeDiaLinkHor = threeDiaLinkHor;
    product.threeDiaLinkVer = threeDiaLinkVer;
    product.arFilePath = arFilePath;
    product.metaTitle = metaTitle;
    product.metaDescription = metaDescription;
    product.metaTags = metaTags;

    // If mainImagePaths array is not empty, update mainImage
    if (mainImagePaths.length > 0) {
      product.mainImage = mainImagePaths[0];
    }

    // If additionalImagePaths array is not empty, update additionalImages
    if (additionalImagePaths.length > 0) {
      product.additionalImages = additionalImagePaths;
    }

    // Save the updated product
    const savedProduct = await product.save();

    // Respond with the updated product
    res.status(200).json(savedProduct);
  } catch (error) {
    console.error("Error in editProduct:", error);
    res.status(500).json({ error: error.message });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const productId = req.params.productId;

    const deletedProduct = await Product.findByIdAndDelete(productId);

    if (!deletedProduct) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const changeStockStatus = async (req, res) => {
  try {
    const { productId, isStock } = req.body;
    console.log(productId, isStock);

    const product = await Product.findByIdAndUpdate(
      productId,
      { isStock },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    res
      .status(200)
      .json({ message: "Stock status updated successfully", product });
  } catch (error) {
    console.error("Error changing stock status:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const importCSV = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "CSV file is required" });
    }

    const readCSVStream = fs
      .createReadStream(req.file.path, { encoding: "utf8" })
      .pipe(csv())
      .on("data", async (row) => {
        let additionalImages = [];
        let tags = [];

        if (row.additionalImages) {
          try {
            additionalImages = JSON.parse(
              row.additionalImages.replace(/\\|\[\]\"/g, "")
            )
              .flat()
              .map((imagePath) => imagePath.trim());
            console.log("Parsed additionalImages:", additionalImages);
          } catch (error) {
            console.error("Error parsing additional images JSON:", error);
            return;
          }
        }

        if (row.tags) {
          try {
            tags = JSON.parse(row.tags.replace(/\\|\[\]\"/g, ""))
              .flat()
              .map((tag) => tag.trim());
            console.log("Parsed tags:", tags);
          } catch (error) {
            console.error("Error parsing tags JSON:", error);
            return;
          }
        }

        if (row.mainCategory) {
          try {
            mainCategoryArray = JSON.parse(row.mainCategory)
              .flat()
              .map((item) => item.trim());
          } catch (error) {
            console.error("Error parsing main category JSON:", error);
            return;
          }
        }

        if (row.subCategory) {
          try {
            subCategoryArray = JSON.parse(row.subCategory)
              .flat()
              .map((item) => item.trim());
          } catch (error) {
            console.error("Error parsing sub category JSON:", error);
            return;
          }
        }

        if (row.series) {
          try {
            seriesArray = JSON.parse(row.series)
              .flat()
              .map((item) => item.trim());
          } catch (error) {
            console.error("Error parsing series JSON:", error);
            return;
          }
        }

        const productData = {
          title: row.title,
          description: row.description,
          discounts: row.discounts.toLowerCase() === "true",
          discountValue: parseFloat(row.discountValue) || 0,
          price: parseFloat(row.price) || 0,
          currency: row.currency,
          available: parseInt(row.available) || 0,
          pieces: parseInt(row.pieces) || 0,
          promotional: row.promotional,
          editorContent: row.editorContent,
          width: parseFloat(row.width) || 0,
          height: parseFloat(row.height) || 0,
          weight: parseFloat(row.weight) || 0,
          status: row.status,
          sku: row.sku,
          mainImage: row.mainImage,
          additionalImages,
          tags,
          mainCategory: mainCategoryArray,
          subCategory: subCategoryArray,
          series: seriesArray,
          vendorId: row.vendorId,
          approved: row.approved.toLowerCase() === "true",
          createdAt: new Date(row.createdAt),
          attributes: row.attributes ? JSON.parse(row.attributes) : [],
          featured: row.featured.toLowerCase() === "true",
          isStock: row.isStock.toLowerCase() === "true",
          threeDiaLinkHor: row.threeDiaLinkHor,
          threeDiaLinkVer: row.threeDiaLinkVer,
          arFilePath: row.arFilePath,
          metaTitle: row.metaTitle,
          metaDescription: row.metaDescription,
          metaTags: row.metaTags,
        };

        if (row.materials) {
          try {
            const material = await Material.findOne({
              name: row.materials.trim(),
            });
            if (material) {
              console.log(`Found material: ${material.name}`);
              const updatedAttributes = productData.attributes.filter(
                (attr) => attr.type !== "material"
              );

              material.details.forEach((detail) => {
                updatedAttributes.push({
                  type: "material",
                  value: detail.value,
                  price: detail.price,
                  attributeImage: detail.materialImage,
                });
              });

              productData.attributes = updatedAttributes;
            } else {
              console.error(`Material with name "${row.materials}" not found`);
            }
          } catch (error) {
            console.error("Error fetching material:", error);
            return;
          }
        }

        let existingProduct = null;
        if (mongoose.Types.ObjectId.isValid(row._id)) {
          existingProduct = await Product.findById(row._id);
        }

        if (existingProduct) {
          console.log(`Updating product with _id ${row._id}`);
          Object.assign(existingProduct, productData);
          await existingProduct.save();
        } else {
          console.log(`Creating new product`);
          const newProduct = new Product({
            ...productData,
            _id: new mongoose.Types.ObjectId(),
          });
          await newProduct.save();
        }
      })
      .on("error", (error) => {
        console.error("Error reading CSV file:", error);
        res.status(500).json({ error: "Failed to import products" });
      });

    readCSVStream.on("end", async () => {
      fs.unlink(req.file.path, (err) => {
        if (err) {
          console.error("Error deleting CSV file:", err);
        } else {
          console.log("CSV file deleted successfully");
        }
      });

      res.status(200).json({ message: "Products imported successfully" });
    });
  } catch (error) {
    console.error("Error importing products:", error);
    res.status(500).json({ error: "Failed to import products" });
  }
};

const exportCSV = async (req, res) => {
  try {
    const products = await Product.find({});

    if (products.length === 0) {
      return res.status(404).json({ error: "No products found" });
    }

    const fields = [
      "_id",
      "title",
      "description",
      "discounts",
      "discountValue",
      "price",
      "currency",
      "available",
      "pieces",
      "promotional",
      "editorContent",
      "width",
      "height",
      "weight",
      "status",
      "sku",
      "mainImage",
      "additionalImages",
      "mainCategory",
      "subCategory",
      "series",
      "tags",
      "vendorId",
      "approved",
      "createdAt",
      "attributes",
      "featured",
      "isStock",
      "threeDiaLinkHor",
      "threeDiaLinkVer",
      "arFilePath",
      "metaTitle",
      "metaDescription",
      "metaTags",
    ];

    const opts = { fields };
    const parser = new Parser(opts);
    const csv = parser.parse(products);

    const tempDir = path.join(__dirname, "..", "temp", "csv");
    const filePath = path.join(tempDir, "products.csv");

    console.log("Base directory (__dirname):", __dirname);
    console.log("Temporary directory (tempDir):", tempDir);
    console.log("CSV file path (filePath):", filePath);

    // Ensure the directory exists
    if (!fs.existsSync(tempDir)) {
      console.log("Directory does not exist, creating directory:", tempDir);
      fs.mkdirSync(tempDir, { recursive: true });
    }

    fs.writeFileSync(filePath, csv);
    console.log("CSV file written successfully at:", filePath);

    res.download(filePath, "products.csv", (err) => {
      if (err) {
        console.error("Error downloading the file:", err);
        res.status(500).json({ error: "Failed to download CSV file" });
      }

      // fs.unlink(filePath, (err) => {
      //   if (err) {
      //     console.error('Error deleting the file:', err);
      //   }
      // });
    });
  } catch (error) {
    console.error("Error exporting products:", error);
    res.status(500).json({ error: "Failed to export products" });
  }
};

module.exports = {
  createProduct,
  editProduct,
  deleteProduct,
  getProduct,
  getAllProducts,
  changeStockStatus,
  importCSV,
  exportCSV,
};
