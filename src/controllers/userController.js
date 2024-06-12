const express = require('express');
const { loginService, refreshAccessToken } = require('../services/userServices');
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



module.exports = router;