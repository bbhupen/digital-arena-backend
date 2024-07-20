const express = require('express');
const { verifyAccessToken } = require('../middleware/auth');
const { createCustomer, searchCustomer, searchCustomerWithPagination } = require('../services/customerServices');
const router = express.Router()


router.post("/api/v1/customer/create", async (req, res) => {
    const requestBody = req.body;
    const response = await createCustomer(requestBody)

    if (!response || Object.keys(response).length === 0) {
        return res.status(404).json({ error: 'Unexpected error occurred'});
      }

    res.status(200).json(response);

})

router.post("/api/v1/customer/search-paginate", async (req, res) => {
  const requestBody = req.body;
  const response = await searchCustomerWithPagination(requestBody)

  if (!response || Object.keys(response).length === 0) {
      return res.status(404).json({ error: 'Unexpected error occurred'});
    }

  res.status(200).json(response);

})

router.get("/api/v1/customer/search", async (req, res) => {
  const requestBody = req.query;
  const response = await searchCustomer(requestBody)

  if (!response || Object.keys(response).length === 0) {
      return res.status(404).json({ error: 'Unexpected error occurred'});
    }

  res.status(200).json(response);

})


module.exports = router;

