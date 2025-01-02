const Subscriber = require("../models/newsletterModel");

const subscribe = async (req, res) => {
  try {
    const { email } = req.body;
    const subscriber = new Subscriber({ email });
    await subscriber.save();
    res.status(201).json({ message: "Successfully subscribed" });
  } catch (err) {
    console.error("Failed to subscribe:", err);
    res.status(500).json({ message: "Failed to subscribe" });
  }
};

const getSubscribers = async (req, res) => {
    try {
      const subscribers = await Subscriber.find();
  
      res.status(200).json(subscribers);
    } catch (err) {
      console.error("Failed to get subscribers:", err);
      res.status(500).json({ message: "Failed to get subscribers" });
    }
  };


module.exports = {subscribe,getSubscribers};