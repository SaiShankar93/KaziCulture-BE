const Material = require("../models/materialModel");
const server_url = process.env.SERVER_URL;

const materialUpload = async (req, res) => {
  try {
    const { name } = req.body;
    var details;

    if (typeof req.body.details === "string") {
      try {
        details = JSON.parse(req.body.details);
      } catch (error) {
        console.error("Error parsing attributes:", error);
        details = [];
      }
    } else if (Array.isArray(req.body.details)) {
        details = JSON.parse(req.body.details[1]);
    } else {
      console.error(
        "Unexpected type for details:",
        typeof req.body.details
      );
      details = [];
    }

    if (!name || !Array.isArray(details)) {
      return res
        .status(400)
        .json({ error: "Material must have a name and an array of details" });
    }

    const materialImages =
      req.files && req.files.materialImages
        ? Array.isArray(req.files.materialImages)
          ? req.files.materialImages
          : [req.files.materialImages]
        : [];
    const materialImageMap = {};
    materialImages.forEach((file) => {
      materialImageMap[file.originalname] = file.path;
    });

    const updatedDetails = details.map((detail) => ({
      ...detail,
      materialImage: materialImageMap[detail.materialImage] || null,
    }));

    const newMaterial = new Material({
      name,
      details: updatedDetails,
    });
    await newMaterial.save();

    res.status(200).json({ message: "Material uploaded successfully" });
  } catch (error) {
    console.error("Error uploading material:", error);
    res.status(500).json({ error: "Failed to upload material" });
  }
};

const getMaterials = async (req, res) => {
  try {
    const materials = await Material.find();

    const materialsWithUrls = materials.map((material) => ({
      ...material.toObject(),
      details: material.details.map((detail) => ({
        ...detail.toObject(),
        materialImage: detail.materialImage
          ? `${server_url}/${detail.materialImage.replace(/\\/g, "/")}`
          : null,
      })),
    }));

    res.status(200).json(materialsWithUrls);
  } catch (error) {
    console.error("Error fetching materials:", error);
    res.status(500).json({ error: "Failed to fetch materials" });
  }
};

const deleteMaterial = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedMaterial = await Material.findByIdAndDelete(id);

    if (!deletedMaterial) {
      return res.status(404).json({ error: "Material not found" });
    }

    res.status(200).json({ message: "Material deleted successfully" });
  } catch (error) {
    console.error("Error deleting material:", error);
    res.status(500).json({ error: "Failed to delete material" });
  }
};

module.exports = { materialUpload, getMaterials ,deleteMaterial };
