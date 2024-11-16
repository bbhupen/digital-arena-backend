const express = require('express');
require('dotenv').config();

const PORT = process.env.PORT || 3000;


const userRoute = require("./src/controllers/userController");
const customerRoute = require("./src/controllers/customerController");
const purchaseRoute = require("./src/controllers/purchaseController");
const saleRoute = require("./src/controllers/salesController");
const locationRoute = require("./src/controllers/locationController");
const billRoute = require("./src/controllers/billController");
const notificationRoute = require("./src/controllers/notificationController");
const creditRoute = require("./src/controllers/creditController");

const app = express();
BigInt.prototype['toJSON'] = function () { 
    return this.toString()
}

app.use(express.json())

app.use("/", userRoute);
app.use("/", customerRoute);
app.use("/", purchaseRoute);
app.use("/", saleRoute);
app.use("/", locationRoute);
app.use("/", billRoute);
app.use("/", notificationRoute);
app.use("/", creditRoute);

// Handle 404 - Not Found
app.use((req, res, next) => {
    res.status(404).send({
        error: 'Not Found',
        message: 'The requested resource was not found',
    });
});

app.listen(PORT, () => {
    console.log(`App listening on PORT ${PORT}`);
})