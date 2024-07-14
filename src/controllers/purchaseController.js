const express = require('express');
const { verifyAccessToken } = require('../middleware/auth');
const { getPurchaseDetails } = require('../services/purchaseServices');
const router = express.Router()


router.get("/api/v1/purchase/get", async (req, res) => {
    const queryParams = req.query;
    const response = await getPurchaseDetails(queryParams);

    if (!response || Object.keys(response).length === 0) {
        return res.status(404).json({ error: 'Unexpected error occurred'});
      }

    res.status(200).json(response);

})


module.exports = router;

