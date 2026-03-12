const express = require("express");
const router = express.Router();
const multer = require("multer");
const scanController = require("../controllers/scan.controller");

const upload = multer({ dest: "uploads/" });

router.post("/", upload.single("image"), scanController.scan);

module.exports = router;
