const express = require('express');
const { loginService, refreshAccessToken, uploadImage, uploadImageService } = require('../services/userServices');
const upload = require('../helpers/multer');
const { verifyAccessToken } = require('../middleware/auth');
const router = express.Router()


router.post("/api/v1/user/login", async (req, res) => {
    const requestBody = req.body;
    const response = await loginService(requestBody);

    if (!response || Object.keys(response).length === 0) {
        return res.status(404).json({ error: 'Unexpected error occurred'});
      }

    res.status(200).json(response);

})

router.post("/api/v1/user/refreshAccessToken", async (req, res) => {
  const requestBody = req.body;
  const response = await refreshAccessToken(requestBody);

  if (!response || Object.keys(response).length === 0) {
      return res.status(404).json({ error: 'Unexpected error occurred'});
    }

  res.status(200).json(response);

})

router.post("/api/v1/user/uploadImage", verifyAccessToken, upload.single("image"), async (req, res) => {
    try {
      const result = await uploadImageService(req.file, req.body);

      return res.status(result.status_code  === 1 ? 200 : 400).json(result);
    } catch (error) {
      console.error(error);
      res.status(500).json({ status: "failure", message: "Unexpected error occurred" });
    }
  }
);


module.exports = router;