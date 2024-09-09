const express = require('express');
const { createBill, searchBillUsingCustomerId, createCreditBill, createFinanceBill, createFinanceCreditBill } = require('../services/billServices');

const router = express.Router()


router.post("/api/v1/bill/create", async (req, res) => {
  const requestBody = req.body;
  const response = await createBill(requestBody);

  if (!response || Object.keys(response).length === 0) {
      return res.status(404).json({ error: 'Unexpected error occurred'});
    }

  res.status(200).json(response);

})


router.post("/api/v1/bill/create-credit", async (req, res) => {
  const requestBody = req.body;
  const response = await createCreditBill(requestBody);

  if (!response || Object.keys(response).length === 0) {
      return res.status(404).json({ error: 'Unexpected error occurred'});
    }

  res.status(200).json(response);

})

router.post("/api/v1/bill/create-finance", async (req, res) => {
  const requestBody = req.body;
  const response = await createFinanceBill(requestBody);

  if (!response || Object.keys(response).length === 0) {
      return res.status(404).json({ error: 'Unexpected error occurred'});
    }

  res.status(200).json(response);

})

router.post("/api/v1/bill/create-finance-credit", async (req, res) => {
  const requestBody = req.body;
  const response = await createFinanceCreditBill(requestBody);

  if (!response || Object.keys(response).length === 0) {
      return res.status(404).json({ error: 'Unexpected error occurred'});
    }

  res.status(200).json(response);

})

router.post("/api/v1/bill/search-using-customer", async (req, res) => {
  const requestBody = req.body;
  const response = await searchBillUsingCustomerId(requestBody);

  if (!response || Object.keys(response).length === 0) {
      return res.status(404).json({ error: 'Unexpected error occurred'});
    }

  res.status(200).json(response);

})

module.exports = router;