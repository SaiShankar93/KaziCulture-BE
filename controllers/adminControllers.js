const Product = require("../models/productModel");
const User = require("../models/userModel");
const Banner = require("../models/bannerModel");
const { sendEmail } = require("../config/sendEmail");
const Order = require("../models/orderModel");
const Coupon = require("../models/couponModel");
const PrivacyPolicy = require("../models/privacyPolicyModel");
const SocialMedia = require("../models/socialModel");
const Menu = require("../models/menuModel");
const Category = require("../models/categoryModel");
const Blog = require("../models/blogModel");
const { ObjectId } = require("mongodb");

const serverUrl = process.env.SERVER_URL;

const approveVendor = async (req, res) => {
  try {
    const { user } = req.body;
    const vendor = await User.findById(user._id);
    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }
    if (vendor.vendorAccess) {
      return res.status(400).json({ message: "Vendor is already approved" });
    }
    vendor.vendorAccess = true;
    await vendor.save();

    const approvalEmailMessage = `
  <html>
    <head>
      <style>
        body {
          font-family: Arial, sans-serif;
          background-color: #f4f4f4;
          padding: 20px;
        }
        .container {
          background-color: #fff;
          border-radius: 5px;
          padding: 20px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        h2 {
          color: #333;
          margin-bottom: 20px;
        }
        p {
          color: #555;
          margin-bottom: 10px;
        }
        .button {
          background-color: #007bff;
          color: #fff;
          padding: 10px 20px;
          text-decoration: none;
          border-radius: 5px;
          display: inline-block;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>Congratulations! Your vendor account has been approved.</h2>
        <p>Hello ${vendor.name},</p>
        <p>Your vendor account at our platform has been approved. You can now start selling your products.</p>
        <p>If you have any questions or need assistance, feel free to contact us.</p>
        <a href="${process.env.CLIENT_URL}/vendor-login" class="button">Start Selling</a>
      </div>
    </body>
  </html>
`;

    // Send approval email
    await sendEmail(
      vendor.name,
      vendor.email,
      "Vendor Approval",
      approvalEmailMessage
    );

    res.status(200).json({ message: "Vendor approved successfully" });
  } catch (error) {
    console.error("Error approving vendor:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const productApproval = async (req, res) => {
  try {
    const { product } = req.body;
    const approvedProduct = await Product.findById(product._id);
    if (approvedProduct.approved) {
      return res.status(400).json({ message: "Product is already approved" });
    }

    approvedProduct.approved = true;
    await approvedProduct.save();

    const user = await User.findById(product.vendorId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const approvalEmailMessage = `
        <html>
          <head>
            <style>
              /* CSS styles */
            </style>
          </head>
          <body>
            <div>
              <h2>Congratulations! Your product has been approved.</h2>
              <p>Hello ${user.name},</p>
              <p>Your product "${product.title}" has been approved. It is now visible to customers on our platform.</p>
              <p>If you have any questions or need assistance, feel free to contact us.</p>
            </div>
          </body>
        </html>
      `;

    await sendEmail(
      user.name,
      user.email,
      "Product Approval",
      approvalEmailMessage
    );

    res.status(200).json({ message: "Product approved successfully" });
  } catch (error) {
    console.error("Error approving product:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const addBanner = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    const bannerFile = req.file;
    const { fileName, redirectUrl, title, description, buttonContent } =
      req.body;
    console.log(fileName, title, description, buttonContent);

    const newBanner = new Banner({
      fileName,
      filePath: bannerFile.path,
      redirectUrl,
      title,
      description,
      buttonContent,
    });

    const savedBanner = await newBanner.save();

    res
      .status(200)
      .json({ message: "Banner uploaded successfully", banner: savedBanner });
  } catch (error) {
    console.error("Error adding banner:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Function to get banner URLs with perfect format
const getBanners = async (req, res) => {
  try {
    const banners = await Banner.find({});

    const bannerData = banners.map((banner) => ({
      _id: banner._id,
      filePath: `${serverUrl}/${banner.filePath.replace(/\\/g, "/")}`,
      fileName: banner.fileName,
      redirectUrl: banner.redirectUrl,
      title: banner.title,
      description: banner.description,
      buttonContent: banner.buttonContent,
    }));

    res
      .status(200)
      .json({ message: "Banners retrieved successfully", banners: bannerData });
  } catch (error) {
    console.error("Error retrieving banners:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const deleteBanner = async (req, res) => {
  try {
    const bannerId = req.params.bannerId;
    const banner = await Banner.findById(bannerId);

    if (!banner) {
      return res.status(404).json({ message: "Banner not found" });
    }

    await Banner.findByIdAndDelete(bannerId);

    res.status(200).json({ message: "Banner deleted successfully" });
  } catch (error) {
    console.error("Error deleting banner:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const createCoupon = async (req, res) => {
  try {
    const {
      code,
      description,
      discountType,
      discountAmount,
      expirationDate,
      emails,
      all,
    } = req.body;

    console.log(
      code,
      description,
      discountType,
      discountAmount,
      expirationDate,
      emails[0],
      all
    );

    if (
      !code ||
      !description ||
      !discountType ||
      !discountAmount ||
      !expirationDate
    ) {
      return res.status(400).json({
        message: "All fields are required for coupon creation",
      });
    }

    const newCoupon = new Coupon({
      code,
      description,
      discountType,
      discountAmount,
      expirationDate,
    });

    const savedCoupon = await newCoupon.save();

    const subject = "Your Exclusive Coupon Code";
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
            <h2>Your Exclusive Coupon Code</h2>
            <p>${description}</p>
            <p>Use the code <strong>${code}</strong> to avail the discount.</p>
            <p>Hurry up, this offer expires on ${expirationDate}!</p>
          </div>
        </body>
      </html>
    `;

    if (all) {
      const allUsers = await User.find({}, "email");
      for (const user of allUsers) {
        await sendEmail("Recipient", user.email, subject, message);
      }
    } else if (emails && emails.length > 0 && emails[0] != "") {
      for (const email of emails) {
        await sendEmail("Recipient", email, subject, message);
      }
    }

    res.status(201).json({
      message: "Coupon added successfully and emails sent",
      coupon: savedCoupon,
    });
  } catch (error) {
    console.error("Error adding coupon:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const getAllCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find();

    res.status(200).json({ coupons });
  } catch (error) {
    console.error("Error getting coupons:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const deleteCoupon = async (req, res) => {
  try {
    const couponId = req.params.id;

    if (!couponId) {
      return res.status(400).json({ message: "Coupon ID is required" });
    }

    const deletedCoupon = await Coupon.findByIdAndDelete(couponId);

    if (!deletedCoupon) {
      return res.status(404).json({ message: "Coupon not found" });
    }

    res.status(200).json({
      message: "Coupon deleted successfully",
      deletedCoupon,
    });
  } catch (error) {
    console.error("Error deleting coupon:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const changeOrderStatus = async (req, res) => {
  try {
    const { orderId, newStatus } = req.body;
    console.log(newStatus);

    if (!orderId || !newStatus) {
      return res.status(400).json({ error: "Missing orderId or newStatus" });
    }

    if (
      ![
        "orderReceived",
        "inProgress",
        "qualityCheck",
        "outForDelivery",
        "orderDelivered",
      ].includes(newStatus)
    ) {
      return res.status(400).json({ error: "Invalid newStatus" });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    order.status = newStatus;
    await order.save();

    res
      .status(200)
      .json({ message: "Order status updated successfully", order });
  } catch (error) {
    console.error("Error changing order status:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const updateDeliveryDate = async (req, res) => {
  try {
    const { orderId, deliveryDate } = req.body;
    console.log(orderId, deliveryDate);

    if (!orderId || !deliveryDate) {
      return res.status(400).json({ error: "Missing orderId or deliveryDate" });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    order.deliveryDate = deliveryDate;
    await order.save();

    res
      .status(200)
      .json({ message: "Delivery date updated successfully", order });
  } catch (error) {
    console.error("Error updating delivery date:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const markFeatured = async (req, res) => {
  try {
    const { productId, featured } = req.body;

    if (!productId || !featured) {
      return res.status(400).json({ error: "Missing productId or isFeatured" });
    }

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    product.featured = featured;

    await product.save();

    res.status(200).json({
      message: "Product featured status updated successfully",
      product,
    });
  } catch (error) {
    console.error("Error marking product as featured:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const updatePrivacyPolicy = async (req, res) => {
  try {
    const { content } = req.body;

    if (!content) {
      return res
        .status(400)
        .json({ error: "Privacy policy content is required" });
    }

    const existingPolicy = await PrivacyPolicy.findOne();

    if (existingPolicy) {
      existingPolicy.content = content;
      await existingPolicy.save();
    } else {
      const newPolicy = new PrivacyPolicy({ content });
      await newPolicy.save();
    }

    return res
      .status(201)
      .json({ message: "Privacy policy updated successfully" });
  } catch (error) {
    console.error("Error updating privacy policy:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const getPrivacyPolicy = async (req, res) => {
  try {
    const policy = await PrivacyPolicy.findOne();

    if (!policy) {
      return res.status(404).json({ error: "Privacy policy not found" });
    }

    return res.status(200).json({ policy });
  } catch (error) {
    console.error("Error retrieving privacy policy:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const generateNewsletter = async (req, res) => {
  const { emails, subject, message, all } = req.body;
  try {
    if (all) {
      const allUsers = await User.find({}, "email");
      for (const user of allUsers) {
        await sendEmail("", user.email, subject, message);
      }
    } else {
      for (const email of emails) {
        await sendEmail("", email, subject, message);
      }
    }
    res.status(200).json({ message: "Newsletter sent successfully" });
  } catch (error) {
    console.error("Error generating newsletter:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const updateSocial = async (req, res) => {
  try {
    const { facebook, twitter, youtube, instagram, linkedin } = req.body;

    if (!facebook && !twitter && !youtube && !instagram && !linkedin) {
      return res.status(400).json({ error: "No social media data provided" });
    }

    let socialMedia = await SocialMedia.findOne();

    if (!socialMedia) {
      socialMedia = new SocialMedia({});
    }

    if (facebook) socialMedia.facebook = facebook;
    if (twitter) socialMedia.twitter = twitter;
    if (youtube) socialMedia.youtube = youtube;
    if (instagram) socialMedia.instagram = instagram;
    if (linkedin) socialMedia.linkedin = linkedin;

    await socialMedia.save();

    res.status(200).json({
      message: "Social media profile updated successfully",
      socialMedia,
    });
  } catch (error) {
    console.error("Error updating social media profile:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const getSocial = async (req, res) => {
  try {
    const socialMedia = await SocialMedia.findOne();

    if (!socialMedia) {
      return res.status(404).json({ error: "Social media profile not found" });
    }

    res.status(200).json({ socialMedia });
  } catch (error) {
    console.error("Error fetching social media profile:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const updateMenu = async (req, res) => {
  try {
    const { items } = req.body;

    let menu = await Menu.findOne();
    if (!menu) {
      menu = new Menu();
    }

    menu.items = items;

    await menu.save();

    res.status(200).json({ message: "Menu updated successfully", menu });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getMenu = async (req, res) => {
  try {
    const menu = await Menu.findOne();
    if (!menu) {
      return res.status(404).json({ error: "Menu not found" });
    }
    res.status(200).json(menu);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const addCategory = async (req, res) => {
  try {
    console.log(req.body);
    const { fileName, redirectUrl } = req.body;
    const categoryImage = req.files["categoryImage"][0];
    const categoryLogo = req.files["categoryLogo"][0];

    const newCategory = new Category({
      fileName,
      redirectUrl,
      imageFilePath: categoryImage.path,
      logoFilePath: categoryLogo.path,
    });

    const savedCategory = await newCategory.save();

    res.status(201).json({
      message: "Category added successfully",
      category: savedCategory,
    });
  } catch (error) {
    console.error("Error adding category:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const addSubcategory = async (req, res) => {
  try {
    const { categoryId, name } = req.body;
    const subLogoFilePath = req.file.path;

    console.log(categoryId, name, subLogoFilePath);

    const category = await Category.findById(categoryId);
    console.log(category);

    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    const newSubcategory = {
      name,
      subLogoFilePath,
    };

    console.log(newSubcategory);

    category.subcategories.push(newSubcategory);
    console.log(category.subcategories);

    const savedCategory = await category.save();

    console.log(savedCategory);

    res.status(201).json(savedCategory);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to add subcategory" });
  }
};

const addSeries = async (req, res) => {
  try {
    const { subcategoryId, name } = req.body;
    const seriesLogoFilePath = req.file.path;

    const category = await Category.findOne({
      "subcategories._id": subcategoryId,
    });

    if (!category) {
      return res
        .status(404)
        .json({ error: "Category with subcategory not found" });
    }

    const subcategory = category.subcategories.find(
      (sub) => sub._id.toString() === subcategoryId
    );

    if (!subcategory) {
      return res.status(404).json({ error: "Subcategory not found" });
    }

    const newSeries = {
      name,
      seriesLogoFilePath,
    };

    subcategory.series.push(newSeries);

    const savedCategory = await category.save();

    res.status(201).json(savedCategory);
  } catch (error) {
    res.status(500).json({ error: "Failed to add series" });
  }
};

const getCategories = async (req, res) => {
  try {
    const categories = await Category.find();
    const categoriesWithLinks = categories.map((category) => ({
      ...category._doc,
      imageLink: `${serverUrl}/${category.imageFilePath.replace(/\\/g, "/")}`,
      logoLink: `${serverUrl}/${category.logoFilePath.replace(/\\/g, "/")}`,
      subcategories: category.subcategories.map((sub) => ({
        ...sub._doc,
        subLogoLink: `${serverUrl}/${sub.subLogoFilePath.replace(/\\/g, "/")}`,
      })),
    }));

    res.status(200).json({ categories: categoriesWithLinks });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const markSelectedCategories = async (req, res) => {
  try {
    const { categoryId } = req.body;
    console.log(categoryId);

    const selectedCount = await Category.countDocuments({ selected: true });

    if (selectedCount >= 6) {
      return res
        .status(400)
        .json({ message: "Maximum number of selected categories reached" });
    }

    await Category.findByIdAndUpdate(categoryId, { selected: true });

    res
      .status(200)
      .json({ message: "Category marked as selected successfully" });
  } catch (error) {
    console.error("Error marking selected category:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const updateUserDetails = async (req, res) => {
  try {
    const { id, name, email, address } = req.body;

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.name = name;
    user.email = email;
    user.address = address;

    await user.save();

    res
      .status(200)
      .json({ message: "Customer details updated successfully", user });
  } catch (error) {
    console.error("Error updating user details:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const createBlog = async (req, res) => {
  const { title, content, metaTitle, metaDescription } = req.body;

  try {
    if (!title || !content || !metaTitle || !metaDescription) {
      return res
        .status(400)
        .json({
          error:
            "Title, content, meta title, and meta description are required",
        });
    }

    const newBlog = new Blog({
      title: title,
      content: content,
      image: req.file.path,
      metaTitle: metaTitle,
      metaDescription: metaDescription,
    });

    await newBlog.save();

    res
      .status(201)
      .json({ message: "Blog post created successfully", blog: newBlog });
  } catch (error) {
    console.error("Error creating blog post:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getAllBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find();

    const blogsWithLinks = blogs.map((blog) => {
      return {
        ...blog.toObject(),
        imageLink: `${serverUrl}/${blog.image.replace(/\\/g, "/")}`,
      };
    });

    res.status(200).json(blogsWithLinks);
  } catch (error) {
    console.error("Error fetching blogs:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const deleteBlog = async (req, res) => {
  const { id } = req.params;

  try {
    const blog = await Blog.findById(id);

    if (!blog) {
      return res.status(404).json({ error: "Blog not found" });
    }

    await Blog.findByIdAndDelete(id);

    res.status(200).json({ message: "Blog deleted successfully" });
  } catch (error) {
    console.error("Error deleting blog:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = {
  approveVendor,
  productApproval,
  addBanner,
  getBanners,
  deleteBanner,
  createCoupon,
  getAllCoupons,
  deleteCoupon,
  changeOrderStatus,
  updateDeliveryDate,
  markFeatured,
  updatePrivacyPolicy,
  getPrivacyPolicy,
  generateNewsletter,
  updateSocial,
  getSocial,
  updateMenu,
  getMenu,
  addCategory,
  addSubcategory,
  addSeries,
  getCategories,
  markSelectedCategories,
  updateUserDetails,
  createBlog,
  getAllBlogs,
  deleteBlog,
};
