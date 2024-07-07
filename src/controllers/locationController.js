const express = require('express');
const { getAllLocation } = require('../services/locationServices');
const router = express.Router()


router.get("/api/v1/location/get", async (req, res) => {
  const requestBody = req.body;
  const response = await getAllLocation(requestBody);

  if (!response || Object.keys(response).length === 0) {
      return res.status(404).json({ error: 'Unexpected error occurred'});
    }

  res.status(200).json(response);

})

module.exports = router;