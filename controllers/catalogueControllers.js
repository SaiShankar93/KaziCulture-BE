const Catalogue = require("../models/catalogueModel");
const server_url = process.env.SERVER_URL;

const updateCatalogue = async (req, res) => {
  try {
    var links;

    if (typeof req.body.links === "string") {
      try {
        links = JSON.parse(req.body.links);
      } catch (error) {
        console.error("Error parsing attributes:", error);
        links = [];
      }
    } else if (Array.isArray(req.body.links)) {
        links = JSON.parse(req.body.links[1]);
    } else {
      console.error(
        "Unexpected type for links:",
        typeof req.body.links
      );
      links = [];
    }
    const image = req.file.path;
    let catalogue = await Catalogue.findOne();

    if (!catalogue) {
      catalogue = new Catalogue({
        image,
        links,
      });
    } else {
      catalogue.image = image;
      catalogue.links = links;
    }

    await catalogue.save();

    res
      .status(200)
      .json({ message: "Catalogue updated successfully", catalogue });
  } catch (error) {
    console.error("Error updating catalogue:", error);
    res.status(500).json({ error: "Failed to update catalogue" });
  }
};

const getCatalogue = async (req, res) => {
  try {
    const catalogue = await Catalogue.findOne();

    if (!catalogue) {
      return res.status(404).json({ error: "Catalogue not found" });
    }

    const imageURL = `${server_url}/${catalogue.image.replace(/\\/g, "/")}`;

    res
      .status(200)
      .json({ catalogue: { ...catalogue.toJSON(), image: imageURL } });
  } catch (error) {
    console.error("Error getting catalogue:", error);
    res.status(500).json({ error: "Failed to get catalogue" });
  }
};

const deleteCatalogue = async (req, res) => {
  try {
    const catalogue = await Catalogue.findOne();

    if (!catalogue) {
      return res.status(404).json({ error: "Catalogue not found" });
    }

    await Catalogue.deleteOne({ _id: catalogue._id });

    res.status(200).json({ message: "Catalogue deleted successfully" });
  } catch (error) {
    console.error("Error deleting catalogue:", error);
    res.status(500).json({ error: "Failed to delete catalogue" });
  }
};

module.exports = {
  updateCatalogue,
  getCatalogue,
  deleteCatalogue
};
