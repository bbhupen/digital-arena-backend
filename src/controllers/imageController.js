const express = require("express");
const { getImage } = require("../services/imageService");
const router = express.Router();

// GET request with filename as a URL parameter
router.get("/api/v1/images/:filename", async (req, res) => {
  try {
    const { filename } = req.params; // filename from URL
    const response = await getImage({ filename });

    if (!response || Object.keys(response).length === 0) {
      return res.status(404).json({ error: "Image not found" });
    }

    if (response.filePath) {
      return res.sendFile(response.filePath, (err) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ error: "Error sending file" });
        }
      });
    }

    return res.status(200).json(response);

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Unexpected error occurred" });
  }
});

module.exports = router;
