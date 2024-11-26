const express = require('express');
const {  } = require('../services/locationServices');
const { manageNotification, getNotificationByNotificationType, manageReturnBill } = require('../services/notificationServices');
const router = express.Router()


router.post("/api/v1/notification/get-by-type", async (req, res) => {
  const requestBody = req.body;
  const response = await getNotificationByNotificationType(requestBody);

  if (!response || Object.keys(response).length === 0) {
      return res.status(404).json({ error: 'Unexpected error occurred'});
    }

  res.status(200).json(response);

});

router.post("/api/v1/notification/manage", async (req, res) => {
  const requestBody = req.body;
  const response = await manageNotification(requestBody);

  if (!response || Object.keys(response).length === 0) {
      return res.status(404).json({ error: 'Unexpected error occurred'});
    }

  res.status(200).json(response);

});

router.post("/api/v1/notification/manage-return-bill", async (req, res) => {
  const requestBody = req.body;
  const response = await manageReturnBill(requestBody);

  if (!response || Object.keys(response).length === 0) {
      return res.status(404).json({ error: 'Unexpected error occurred'});
    }

  res.status(200).json(response);

});

module.exports = router;