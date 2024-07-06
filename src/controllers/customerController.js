const express = require('express');
const { verifyAccessToken } = require('../middleware/auth');
const { getCustomerDetails } = require('../services/customerServices');
const router = express.Router()


router.get("/api/v1/customer/get", verifyAccessToken ,async (req, res) => {
    const requestBody = req.body;
    const response = await getCustomerDetails(requestBody);

    if (!response || Object.keys(response).length === 0) {
        return res.status(404).json({ error: 'Unexpected error occurred'});
      }

    res.status(200).json(response);

})


module.exports = router;

