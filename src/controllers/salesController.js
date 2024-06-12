const express = require('express');
const { identifyUser, loginService, insertData, allUser } = require('../services/saleServices');
const router = express.Router()

router.get("/", async (req, res) => {
    res.send(`Unauthorized Use`);
})

router.get("/get-user", async (req, res) => {
    const response = await allUser();

    if (!response || Object.keys(response).length === 0) {
        return res.status(404).json({ error: 'Unexpected error occurred'});
      }

    res.status(200).json(response);


})



router.post("/insert", async (req, res) => {
    const requestBody = req.body;
    const response = await insertData(requestBody);

    if (!response || Object.keys(response).length === 0) {
        return res.status(404).json({ error: 'Unexpected error occurred'});
      }

    res.status(200).json(response);


})


module.exports = router;