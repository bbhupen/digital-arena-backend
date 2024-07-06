const express = require('express');
const { verifyAccessToken } = require('../middleware/auth');
const { createCustomer } = require('../services/customerServices');
const router = express.Router()


router.post("/api/v1/customer/create", async (req, res) => {
    const requestBody = req.body;
    const response = await createCustomer(requestBody)

    if (!response || Object.keys(response).length === 0) {
        return res.status(404).json({ error: 'Unexpected error occurred'});
      }

    res.status(200).json(response);

})


module.exports = router;

