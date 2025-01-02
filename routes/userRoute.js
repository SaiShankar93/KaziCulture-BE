const express = require("express");
const router = express.Router();
const passportLogin = require("../controllers/passport-config");

router.use("/", passportLogin);

module.exports = router;
