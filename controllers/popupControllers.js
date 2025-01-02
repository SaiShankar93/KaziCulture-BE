const Popup = require("../models/popupModel");
const PopupResponse = require("../models/popupResponse");
const server_url = process.env.SERVER_URL;

const createPopup = async (req, res) => {
    try {
        const { title, link, showAfterHours } = req.body;
        const imagePath = req.file.path;

        const newPopup = new Popup({
            title,
            imagePath,
            link,
            showAfterHours
        });

        await newPopup.save();

        res.status(201).json({ message: 'Popup created successfully', popup: newPopup });
    } catch (error) {
        console.error('Error creating popup:', error);
        res.status(500).json({ error: 'Failed to create popup' });
    }
};

const getPopup = async (req, res) => {
    try {
        const popups = await Popup.find();
        const updatedPopups = popups.map(popup => ({
            ...popup._doc,
            imagePath: `${server_url}/${popup.imagePath.replace(/\\/g, "/")}`
        }));
        res.status(200).json({ popups: updatedPopups });
    } catch (error) {
        console.error('Error getting popups:', error);
        res.status(500).json({ error: 'Failed to get popups' });
    }
};

const getSinglePopup = async (req, res) => {
    try {
        const featuredPopup = await Popup.findOne({ feature: true });
        if (!featuredPopup) {
            return res.status(404).json({ error: 'Featured popup not found' });
        }
        
        const updatedPopup = {
            ...featuredPopup._doc,
            imagePath: `${server_url}/${featuredPopup.imagePath.replace(/\\/g, "/")}`
        };
        
        res.status(200).json({ popup: updatedPopup });
    } catch (error) {
        console.error('Error getting single featured popup:', error);
        res.status(500).json({ error: 'Failed to get single featured popup' });
    }
};

const deletePopup = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedPopup = await Popup.findByIdAndDelete(id);

        if (!deletedPopup) {
            return res.status(404).json({ error: 'Popup not found' });
        }

        res.status(200).json({ message: 'Popup deleted successfully' });
    } catch (error) {
        console.error('Error deleting popup:', error);
        res.status(500).json({ error: 'Failed to delete popup' });
    }
};

const markFeatured = async (req, res) => {
    try {
        const { id } = req.params;
        
        const popup = await Popup.findById(id);
        if (!popup) {
            return res.status(404).json({ error: 'Popup not found' });
        }

        const existingFeaturedPopup = await Popup.findOne({ feature: true });
        if (existingFeaturedPopup) {
            existingFeaturedPopup.feature = false;
            await existingFeaturedPopup.save();
        }
        
        popup.feature = true;
        await popup.save();

        res.status(200).json({ message: 'Popup marked as featured', popup });
    } catch (error) {
        console.error('Error marking popup as featured:', error);
        res.status(500).json({ error: 'Failed to mark popup as featured' });
    }
};

const createResponse = async (req, res) => {
    try {
        const { popupId, inputValue } = req.body;

        const existingPopup = await Popup.findById(popupId);
        if (!existingPopup) {
            return res.status(404).json({ error: 'Popup not found' });
        }

        const newResponse = new PopupResponse({
            popup: popupId,
            inputValue
        });

        await newResponse.save();

        res.status(201).json({ message: 'Response created successfully', response: newResponse });
    } catch (error) {
        console.error('Error creating response:', error);
        res.status(500).json({ error: 'Failed to create response' });
    }
};

module.exports = {
    createPopup,
    getPopup,
    getSinglePopup,
    deletePopup,
    markFeatured,
    createResponse,
};
