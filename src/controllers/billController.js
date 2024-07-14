const express = require('express');
const { createBill } = require('../services/billServices');

const router = express.Router()


router.post("/api/v1/bill/create", async (req, res) => {
  const requestBody = req.body;
  const response = await createBill(requestBody);

  if (!response || Object.keys(response).length === 0) {
      return res.status(404).json({ error: 'Unexpected error occurred'});
    }

  res.status(200).json(response);

})

module.exports = router;