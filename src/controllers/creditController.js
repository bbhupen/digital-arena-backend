const express = require('express');
const { getUnpaidCredits, getCreditDetailUsingBillId, updateCredit, getCreditHistory, getUnpaidCreditsByPhoneNumber } = require('../services/creditServices');
const { getCreditHistDataUsingBillID } = require('../data_access/creditRepo');


const router = express.Router()


router.post("/api/v1/credit/get", async (req, res) => {
    const requestBody = req.body;
    const response = await getUnpaidCredits(requestBody);

    if (!response || Object.keys(response).length === 0) {
        return res.status(404).json({ error: 'Unexpected error occurred' });
    }
    res.status(200).json(response);
})

router.post("/api/v1/credit/get-by-phone", async (req, res) => {
    const requestBody = req.body;
    const response = await getUnpaidCreditsByPhoneNumber(requestBody);

    if (!response || Object.keys(response).length === 0) {
        return res.status(404).json({ error: 'Unexpected error occurred' });
    }
    res.status(200).json(response);
})

router.post("/api/v1/credit/get-by-id", async (req, res) => {
    const requestBody = req.body;
    const response = await getCreditDetailUsingBillId(requestBody);

    if (!response || Object.keys(response).length === 0) {
        return res.status(404).json({ error: 'Unexpected error occurred' });
    }
    res.status(200).json(response);
})

router.post("/api/v1/credit/get-credit-hist", async (req, res) => {
    const requestBody = req.body;
    const response = await getCreditHistory(requestBody);

    if (!response || Object.keys(response).length === 0) {
        return res.status(404).json({ error: 'Unexpected error occurred' });
    }
    res.status(200).json(response);
})

router.post("/api/v1/credit/update", async (req, res) => {
    const requestBody = req.body;
    const response = await updateCredit(requestBody);

    if (!response || Object.keys(response).length === 0) {
        return res.status(404).json({ error: 'Unexpected error occurred' });
    }
    res.status(200).json(response);
})

module.exports = router;