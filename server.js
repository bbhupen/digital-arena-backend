const express = require('express');
require('dotenv').config();

const PORT = process.env.PORT || 3000;


const userRoute = require("./src/controllers/userController");
const customerRoute = require("./src/controllers/customerController");
const purchaseRoute = require("./src/controllers/purchaseController");
const saleRoute = require("./src/controllers/salesController");
const locationRoute = require("./src/controllers/locationController");

const app = express();

app.use(express.json())

app.use("/", userRoute);
app.use("/", customerRoute);
// app.use("/", purchaseRoute);
app.use("/", saleRoute);
app.use("/", locationRoute);




app.listen(PORT, () => {
    console.log(`App listening on PORT ${PORT}`);
})