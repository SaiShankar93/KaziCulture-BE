const express = require("express");
const { createQuery } = require("../controllers/contactUsControllers");
const router = express.Router();

router.post("/create", createQuery);

module.exports = router;
